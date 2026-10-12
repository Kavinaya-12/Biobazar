const fs = require("fs/promises");
const path = require("path");
const SellerProfile = require("../models/sellerProfileModel");
const User = require("../models/userModel");
const AdminAuditLog = require("../models/adminAuditLogModel");
const { SELLER_REGISTRATION_COUNTRIES, slugify, validateSellerApplication } = require("../services/sellerApplicationValidation");
const { MAX_DOCUMENTS_PER_APPLICATION, privateDocumentDirectory, readPrivateSellerDocument, savePrivateSellerDocuments } = require("../services/privateSellerDocuments");

const allowedCountries = SELLER_REGISTRATION_COUNTRIES;
const userIdFrom = (req) => req.user && req.user.user_id;
const draftText = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : undefined;
const publicProfile = (profile) => profile ? profile.toObject({ getters: true }) : null;

function agreementAcceptanceUpdates(profile, version, acceptedAt = new Date()) {
  const history = [...(profile?.agreementHistory || [])];
  if (profile?.agreementAccepted && profile.agreementVersion && profile.agreementAcceptedAt && !history.some((entry) => entry.version === profile.agreementVersion && new Date(entry.acceptedAt).getTime() === new Date(profile.agreementAcceptedAt).getTime())) {
    history.push({ version: profile.agreementVersion, acceptedAt: profile.agreementAcceptedAt });
  }
  const alreadyAccepted = profile?.agreementAccepted && profile.agreementVersion === version && profile.agreementAcceptedAt;
  if (!alreadyAccepted) history.push({ version, acceptedAt });
  const recorded = history.filter((entry) => entry.version === version).at(-1);
  return { agreementHistory: history, agreementVersion: version, agreementAcceptedAt: recorded.acceptedAt };
}
exports.agreementAcceptanceUpdates = agreementAcceptanceUpdates;

function pickDraft(input = {}) {
  const data = {};
  if (typeof input.agreementAccepted === "boolean") data.agreementAccepted = input.agreementAccepted;
  if (["individual", "business"].includes(input.sellerType)) data.sellerType = input.sellerType;
  const storeName = draftText(input.storeName, 100); if (storeName !== undefined) data.storeName = storeName;
  const description = draftText(input.description, 2000); if (description !== undefined) data.description = description;
  const contactEmail = draftText(input.contactEmail, 254); if (contactEmail !== undefined) data.contactEmail = contactEmail.toLowerCase();
  const contactPhone = draftText(input.contactPhone, 30); if (contactPhone !== undefined) data.contactPhone = contactPhone;
  if (input.address && typeof input.address === "object" && !Array.isArray(input.address)) {
    data.address = {};
    for (const [key, max] of Object.entries({ line1: 160, line2: 160, city: 80, region: 80, postalCode: 20, country: 2 })) {
      const value = draftText(input.address[key], max);
      if (value !== undefined) data.address[key] = key === "country" ? value.toUpperCase() : value;
    }
  }
  if (input.individual && typeof input.individual === "object") {
    const legalName = draftText(input.individual.legalName, 120); if (legalName !== undefined) data.individual = { legalName };
  }
  if (input.business && typeof input.business === "object") {
    data.business = {};
    for (const [key, max] of Object.entries({ legalName: 160, registrationNumber: 80, taxId: 80 })) {
      const value = draftText(input.business[key], max); if (value !== undefined) data.business[key] = value;
    }
  }
  return data;
}

async function persistDraft(req, res, next, allowRejected = false) {
  let storedDocuments = [];
  try {
    const userId = userIdFrom(req);
    const input = typeof req.body.application === "string" ? JSON.parse(req.body.application) : req.body;
    const existing = await SellerProfile.findOne({ userId });
    if (existing && !["draft", ...(allowRejected ? ["rejected", "action_required"] : [])].includes(existing.status)) {
      return res.status(409).json({ success: false, message: "This application cannot be edited in its current status." });
    }
    if ((existing?.verificationDocuments.length || 0) + (req.files || []).length > MAX_DOCUMENTS_PER_APPLICATION) {
      return res.status(400).json({ success: false, message: `A maximum of ${MAX_DOCUMENTS_PER_APPLICATION} verification files can be attached.` });
    }
    storedDocuments = await savePrivateSellerDocuments(req.files || []);
    const updates = pickDraft(input);
    if (typeof updates.agreementAccepted === "boolean") {
      if (updates.agreementAccepted) {
        const version = process.env.SELLER_AGREEMENT_VERSION || "2026-01";
        Object.assign(updates, agreementAcceptanceUpdates(existing, version));
      } else {
        updates.agreementVersion = "";
        updates.agreementAcceptedAt = null;
      }
    }
    if (!existing && !updates.storeName) updates.storeName = "";
    if (!existing) updates.slug = `draft-${userId}`;
    for (const [key, value] of Object.entries(updates)) existing ? existing.set(key, value) : null;
    let profile = existing;
    if (!profile) profile = new SellerProfile({ userId, ...updates });
    if (storedDocuments.length) profile.verificationDocuments.push(...storedDocuments);
    await profile.save();
    return res.status(existing ? 200 : 201).json({ success: true, profile: publicProfile(profile), currentAgreementVersion: process.env.SELLER_AGREEMENT_VERSION || "2026-01", registrationCountries: allowedCountries });
  } catch (error) {
    await Promise.all(storedDocuments.map((document) => fs.rm(path.join(privateDocumentDirectory, document.storageKey), { force: true }).catch(() => {})));
    if (error.code === 11000) return res.status(409).json({ success: false, message: "That store URL is already in use. Change the store name and try again." });
    next(error);
  }
}

exports.getMe = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: userIdFrom(req) });
    res.json({ success: true, profile: publicProfile(profile), currentAgreementVersion: process.env.SELLER_AGREEMENT_VERSION || "2026-01", registrationCountries: allowedCountries });
  } catch (error) { next(error); }
};

exports.saveDraft = (req, res, next) => persistDraft(req, res, next, true);
exports.createApplication = (req, res, next) => persistDraft(req, res, next);

exports.getStatus = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: userIdFrom(req) });
    if (!profile) return res.json({ success: true, profile: null });
    res.json({ success: true, profile: publicProfile(profile), currentAgreementVersion: process.env.SELLER_AGREEMENT_VERSION || "2026-01", registrationCountries: allowedCountries });
  } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { storeName, description, contactEmail, contactPhone } = req.body || {};
    const updates = {};
    if (storeName !== undefined) {
      if (typeof storeName !== "string" || storeName.trim().length < 2 || storeName.trim().length > 100) return res.status(400).json({ success: false, message: "Store name must contain 2 to 100 characters." });
      updates.storeName = storeName.trim();
      updates.slug = slugify(storeName);
      if (!updates.slug) return res.status(400).json({ success: false, message: "Store name must include at least one letter or number." });
    }
    if (description !== undefined) {
      if (typeof description !== "string" || description.length > 2000) return res.status(400).json({ success: false, message: "Description must be up to 2,000 characters." });
      updates.description = description.trim();
    }
    if (contactEmail !== undefined) {
      if (typeof contactEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) return res.status(400).json({ success: false, message: "Enter a valid contact email address." });
      updates.contactEmail = contactEmail.trim().toLowerCase();
    }
    if (contactPhone !== undefined) {
      if (typeof contactPhone !== "string" || !/^[+\d][\d\s().-]{6,29}$/.test(contactPhone.trim())) return res.status(400).json({ success: false, message: "Enter a valid contact phone number." });
      updates.contactPhone = contactPhone.trim();
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: "Provide at least one editable store setting." });
    const profile = await SellerProfile.findOneAndUpdate({ _id: req.sellerProfile._id, userId: userIdFrom(req), status: "approved" }, { $set: updates }, { new: true, runValidators: true });
    if (!profile) return res.status(404).json({ success: false, message: "Approved seller profile not found." });
    res.json({ success: true, profile: publicProfile(profile) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "That store URL is already in use." });
    next(error);
  }
};

async function submitApplication(req, res, next, resubmission = false) {
  let resubmissionAudit;
  try {
    const userId = userIdFrom(req);
    const profile = await SellerProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ success: false, message: "Save an application draft before submitting." });
    if (resubmission ? !["rejected", "action_required"].includes(profile.status) : profile.status !== "draft") {
      return res.status(409).json({ success: false, message: resubmission ? "Only rejected or action-required applications can be resubmitted." : "This application is not a draft." });
    }
    const validation = validateSellerApplication(profile.toObject(), allowedCountries);
    if (validation.errors.length) return res.status(400).json({ success: false, errors: validation.errors });
    const currentAgreementVersion = process.env.SELLER_AGREEMENT_VERSION || "2026-01";
    if (!profile.agreementAccepted || profile.agreementVersion !== currentAgreementVersion) return res.status(400).json({ success: false, message: "Review and accept the current seller agreement before submitting." });
    if (process.env.SELLER_DOCUMENT_REQUIRED !== "false" && !profile.verificationDocuments.length) return res.status(400).json({ success: false, message: "Attach at least one PDF, JPEG, or PNG verification document." });
    const slug = validation.data.slug;
    const duplicate = await SellerProfile.findOne({ slug, _id: { $ne: profile._id } }).select("_id");
    if (duplicate) return res.status(409).json({ success: false, message: "That store URL is already in use. Change the store name and try again." });
    if (resubmission) {
      resubmissionAudit = await AdminAuditLog.create({ actorId: userId, action: "seller.resubmitted", entityType: "seller", entityId: profile._id, reason: profile.status === "rejected" ? profile.rejectionReason : profile.reviewNotes });
    }
    Object.assign(profile, validation.data, {
      status: "pending",
      slug,
      agreementVersion: currentAgreementVersion,
      agreementAcceptedAt: profile.agreementAcceptedAt || new Date(),
      reviewNotes: "",
      reviewedBy: null,
      reviewedAt: null,
    });
    if (!resubmission) profile.rejectionReason = "";
    await profile.save();
    res.json({ success: true, profile: publicProfile(profile) });
  } catch (error) {
    if (resubmissionAudit) await AdminAuditLog.deleteOne({ _id: resubmissionAudit._id }).catch(() => {});
    next(error);
  }
}

exports.submit = (req, res, next) => submitApplication(req, res, next);
exports.resubmit = (req, res, next) => submitApplication(req, res, next, true);

exports.removeDocument = async (req, res, next) => {
  try {
    const storageKey = req.params.storageKey;
    if (!/^[0-9a-f-]{36}\.(pdf|jpg|png)$/.test(storageKey)) return res.status(400).json({ success: false, message: "Invalid document reference." });
    const profile = await SellerProfile.findOne({ userId: userIdFrom(req), "verificationDocuments.storageKey": storageKey });
    if (!profile) return res.status(404).json({ success: false, message: "Your verification document was not found." });
    if (!["draft", "rejected"].includes(profile.status)) return res.status(409).json({ success: false, message: "Documents cannot be changed after submission. Contact BioBazaar support if a change is needed." });
    profile.verificationDocuments = profile.verificationDocuments.filter((document) => document.storageKey !== storageKey);
    await profile.save();
    await fs.rm(path.join(privateDocumentDirectory, storageKey), { force: true });
    res.json({ success: true, profile: publicProfile(profile) });
  } catch (error) { next(error); }
};

exports.getDocument = async (req, res, next) => {
  try {
    const storageKey = req.params.storageKey;
    const profile = await SellerProfile.findOne({ "verificationDocuments.storageKey": storageKey });
    if (!profile) return res.status(404).json({ success: false, message: "Verification document not found." });
    const requesterId = userIdFrom(req);
    const isOwner = profile.userId.toString() === String(requesterId);
    const requester = requesterId ? await User.findById(requesterId).select("role").lean() : null;
    const isAdmin = requester?.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "You are not authorized to view this document." });
    const document = profile.verificationDocuments.find((entry) => entry.storageKey === storageKey);
    const buffer = await readPrivateSellerDocument(storageKey);
    if (!buffer) return res.status(404).json({ success: false, message: "Verification document is unavailable." });
    res.set({ "Content-Type": document.contentType, "Content-Length": String(buffer.length), "Content-Disposition": `attachment; filename="${path.basename(document.originalName).replace(/[\"\r\n]/g, "")}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
    res.send(buffer);
  } catch (error) { next(error); }
};
