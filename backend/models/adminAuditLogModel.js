const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true, enum: ["seller.approved", "seller.rejected", "seller.information_requested", "seller.suspended", "seller.reinstated", "seller.resubmitted"] },
  entityType: { type: String, required: true, enum: ["seller"] },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  reason: { type: String, trim: true, maxlength: 2000, default: "" },
  createdAt: { type: Date, default: Date.now, immutable: true },
}, { versionKey: false, strict: "throw" });

adminAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
