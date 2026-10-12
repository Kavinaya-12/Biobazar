const mongoose = require("mongoose");

const sellerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  sellerType: { type: String, enum: ["individual", "business"], default: "individual" },
  storeName: { type: String, trim: true, maxlength: 100, default: "" },
  slug: { type: String, trim: true, lowercase: true, unique: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: "" },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  contactPhone: { type: String, trim: true, maxlength: 30, default: "" },
  address: {
    line1: { type: String, trim: true, maxlength: 160, default: "" },
    line2: { type: String, trim: true, maxlength: 160, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    region: { type: String, trim: true, maxlength: 80, default: "" },
    postalCode: { type: String, trim: true, maxlength: 20, default: "" },
    country: { type: String, trim: true, uppercase: true, minlength: 2, maxlength: 2, default: "IN" },
  },
  individual: {
    legalName: { type: String, trim: true, maxlength: 120, default: "" },
  },
  business: {
    legalName: { type: String, trim: true, maxlength: 160, default: "" },
    registrationNumber: { type: String, trim: true, maxlength: 80, default: "" },
    taxId: { type: String, trim: true, maxlength: 80, default: "" },
  },
  verificationDocuments: [{
    storageKey: { type: String, required: true },
    originalName: { type: String, required: true, maxlength: 180 },
    contentType: { type: String, enum: ["application/pdf", "image/jpeg", "image/png"], required: true },
    size: { type: Number, required: true, min: 1, max: 5242880 },
    uploadedAt: { type: Date, default: Date.now },
  }],
  status: { type: String, enum: ["draft", "pending", "action_required", "approved", "rejected", "suspended"], default: "draft", index: true },
  reviewNotes: { type: String, trim: true, maxlength: 2000, default: "" },
  rejectionReason: { type: String, trim: true, maxlength: 1000, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  agreementAccepted: { type: Boolean, default: false },
  agreementVersion: { type: String, default: "", maxlength: 40 },
  agreementAcceptedAt: { type: Date, default: null },
  agreementHistory: [{ version: { type: String, required: true, maxlength: 40 }, acceptedAt: { type: Date, required: true } }],
  payoutOnboardingStatus: { type: String, enum: ["not_started", "setup_required", "pending", "ready", "restricted"], default: "setup_required" },
  paymentProviderAccountId: { type: String, default: "", select: false },
}, { timestamps: true, strict: "throw" });

sellerProfileSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("SellerProfile", sellerProfileSchema);
