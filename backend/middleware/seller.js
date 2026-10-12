const SellerProfile = require("../models/sellerProfileModel");

const requireApprovedSeller = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const sellerProfile = await SellerProfile.findOne({ userId, status: "approved" });
    if (!sellerProfile) return res.status(403).json({ success: false, code: "SELLER_APPROVAL_REQUIRED", message: "An approved seller application is required for this action." });
    req.sellerProfile = sellerProfile;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireApprovedSeller };
