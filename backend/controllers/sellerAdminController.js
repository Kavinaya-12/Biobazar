const mongoose = require("mongoose");
const SellerProfile = require("../models/sellerProfileModel");
const AdminAuditLog = require("../models/adminAuditLogModel");
const Product = require("../models/productModel");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.listApplications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = {};
    if (["draft", "pending", "action_required", "approved", "rejected", "suspended"].includes(req.query.status)) filter.status = req.query.status;
    if (["individual", "business"].includes(req.query.sellerType)) filter.sellerType = req.query.sellerType;
    const [applications, total] = await Promise.all([
      SellerProfile.find(filter).select("-paymentProviderAccountId").sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).populate("userId", "username email").lean(),
      SellerProfile.countDocuments(filter),
    ]);
    res.json({ success: true, applications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.getApplication = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid seller application ID." });
    const profile = await SellerProfile.findById(req.params.id).select("-paymentProviderAccountId").populate("userId", "username email").populate("reviewedBy", "username email").lean();
    if (!profile) return res.status(404).json({ success: false, message: "Seller application not found." });
    const productCount = await Product.countDocuments({ sellerProfile: profile._id });
    const auditEvents = await AdminAuditLog.find({ entityType: "seller", entityId: profile._id }).sort({ createdAt: -1 }).limit(50).populate("actorId", "username email").lean();
    res.json({ success: true, application: profile, productCount, auditEvents });
  } catch (error) { next(error); }
};

exports.reviewApplication = async (req, res, next) => {
  let audit;
  try {
    const { action, reason } = req.body || {};
    const normalizedReason = typeof reason === "string" ? reason.trim().slice(0, 2000) : "";
    const transitions = {
      approve: { from: "pending", to: "approved", audit: "seller.approved" },
      reject: { from: "pending", to: "rejected", audit: "seller.rejected" },
      request_information: { from: "pending", to: "action_required", audit: "seller.information_requested" },
      suspend: { from: "approved", to: "suspended", audit: "seller.suspended" },
      reinstate: { from: "suspended", to: "approved", audit: "seller.reinstated" },
    };
    const transition = transitions[action];
    if (!transition) return res.status(400).json({ success: false, message: "Choose approve, reject, suspend, or reinstate." });
    if ((action === "reject" || action === "request_information" || action === "suspend") && normalizedReason.length < 3) return res.status(400).json({ success: false, message: "A review note is required for this decision." });
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid seller application ID." });

    const profile = await SellerProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: "Seller application not found." });
    if (profile.status !== transition.from) return res.status(409).json({ success: false, message: `Cannot ${action} a seller application in ${profile.status} status.` });

    audit = await AdminAuditLog.create({ actorId: req.user.user_id, action: transition.audit, entityType: "seller", entityId: profile._id, reason: normalizedReason });
    const updates = {
      status: transition.to,
      reviewedBy: req.user.user_id,
      reviewedAt: new Date(),
      reviewNotes: ["approve", "reinstate", "request_information"].includes(action) ? normalizedReason : "",
      rejectionReason: action === "reject" ? normalizedReason : profile.rejectionReason,
    };
    const updated = await SellerProfile.findOneAndUpdate({ _id: profile._id, status: transition.from }, { $set: updates }, { new: true, runValidators: true });
    if (!updated) {
      await AdminAuditLog.deleteOne({ _id: audit._id });
      return res.status(409).json({ success: false, message: "The application changed during review. Reload and try again." });
    }
    res.json({ success: true, application: updated });
  } catch (error) {
    if (audit) await AdminAuditLog.deleteOne({ _id: audit._id }).catch(() => {});
    next(error);
  }
};
