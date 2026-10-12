const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  type: String,
  productCategory: { type: String, default: "", trim: true, maxlength: 80 },
  productType: { type: String, default: "", trim: true, maxlength: 80 },
  packageQuantity: { type: Number, default: null, min: 0.001 },
  packageUnit: { type: String, enum: ["", "g", "kg", "ml", "l", "piece", "count"], default: "" },
  price: Number,
  description: String,
  collec: String,
  image: String,
  certification: { type: String, default: "", maxlength: 2000 },
  ingredients: { type: String, default: "", maxlength: 2000 },
  packaging: { type: String, default: "", maxlength: 2000 },
  reusable: { type: String, default: "", maxlength: 2000 },
  recyclable: { type: String, default: "", maxlength: 2000 },
  evidenceNotes: { type: String, default: "", maxlength: 2000 },
  sellerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerProfile',
    default: null,
    index: true,
  },
  sku: { type: String, default: "", trim: true, maxlength: 80 },
  inventoryQuantity: { type: Number, default: null, min: 0 },
  shippingDetails: { type: String, default: "", maxlength: 1000 },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'rejected', 'archived'],
    default: 'published',
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
