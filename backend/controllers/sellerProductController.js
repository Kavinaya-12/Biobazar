const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../models/productModel");
const { saveSellerProductImage } = require("../services/sellerProductImages");
const { validClassification } = require("../services/productClassification");

const categories = new Set(["Foods", "PersonalCare", "Household", "Lifestyle"]);
const fields = ["name", "type", "description", "collec", "productCategory", "productType", "packageUnit", "sku", "shippingDetails", "certification", "ingredients", "packaging", "reusable", "recyclable", "evidenceNotes"];
const idIsValid = (value) => mongoose.Types.ObjectId.isValid(value);
const text = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const imageUrlIsValid = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;
  try { const url = new URL(value.trim()); return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && /\.(jpg|jpeg|png|webp)$/i.test(url.pathname); }
  catch { return false; }
};
const safeProduct = (product) => product.toObject ? product.toObject() : product;

function mutableFields(body, existingMainCategory = "") {
  const result = {};
  for (const field of fields) if (body[field] !== undefined) result[field] = text(body[field], field === "description" || field === "evidenceNotes" ? 2000 : ["productCategory", "productType"].includes(field) ? 80 : 1000);
  if (body.inventoryQuantity !== undefined) {
    const quantity = Number(body.inventoryQuantity);
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Inventory must be a whole number greater than or equal to zero.");
    result.inventoryQuantity = quantity;
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0 || price > 10000000) throw new Error("Price must be a positive amount within the supported limit.");
    result.price = price;
  }
  if (body.packageQuantity !== undefined) {
    if (body.packageQuantity === "" || body.packageQuantity === null) result.packageQuantity = null;
    else {
      if (!(["string", "number"].includes(typeof body.packageQuantity)) || (typeof body.packageQuantity === "string" && !body.packageQuantity.trim())) throw new Error("Package quantity must be a positive finite amount within the supported limit.");
      const quantity = Number(body.packageQuantity);
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1000000) throw new Error("Package quantity must be a positive finite amount within the supported limit.");
      result.packageQuantity = quantity;
    }
  }
  if (body.status !== undefined) {
    if (!["draft", "published", "archived"].includes(body.status)) throw new Error("Choose draft, published, or archived status.");
    result.status = body.status;
  }
  if (result.collec !== undefined && !categories.has(result.collec)) throw new Error("Choose one of BioBazaar's product categories.");
  if (body.packageUnit !== undefined && typeof body.packageUnit !== "string") throw new Error("Choose a supported package unit.");
  if (result.packageUnit !== undefined && !["", "g", "kg", "ml", "l", "piece", "count"].includes(result.packageUnit)) throw new Error("Choose a supported package unit.");
  if (body.packageQuantity !== undefined || body.packageUnit !== undefined) {
    const quantity = body.packageQuantity === undefined ? undefined : result.packageQuantity;
    const unit = body.packageUnit === undefined ? undefined : result.packageUnit;
    if ((quantity === null || quantity === undefined || quantity === "") !== (!unit)) throw new Error("Enter both package quantity and package unit, or leave both empty.");
    if (["piece", "count"].includes(unit) && quantity !== null && quantity !== undefined && !Number.isInteger(quantity)) throw new Error("Count-based package quantity must be a whole number.");
  }
  const classificationProvided = ["productCategory", "productType"].some((field) => body[field] !== undefined && body[field] !== "");
  if (classificationProvided) {
    const classification = {
      collec: result.collec || body.collec || existingMainCategory,
      productCategory: result.productCategory === undefined ? body.productCategory : result.productCategory,
      productType: result.productType === undefined ? body.productType : result.productType,
    };
    if (!validClassification(classification)) throw new Error("Choose a product category and product type that belong to the selected main category.");
  } else if ((body.productCategory || body.productType) && !validClassification({ collec: result.collec || body.collec, productCategory: body.productCategory, productType: body.productType })) {
    throw new Error("Choose a product category and product type that belong to the selected main category.");
  }
  for (const field of ["name", "type", "description", "collec"]) {
    if (result[field] !== undefined && !result[field]) throw new Error(`${field} cannot be empty.`);
  }
  return result;
}

async function findOwnedProduct(req) {
  if (!idIsValid(req.params.id)) return null;
  return Product.findOne({ _id: req.params.id, sellerProfile: req.sellerProfile._id, userId: req.user.user_id });
}

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = { sellerProfile: req.sellerProfile._id, userId: req.user.user_id };
    if (["draft", "pending_review", "published", "rejected", "archived"].includes(req.query.status)) filter.status = req.query.status;
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.get = async (req, res, next) => {
  try {
    const product = await findOwnedProduct(req);
    if (!product) return res.status(404).json({ success: false, message: "Seller product not found." });
    res.json({ success: true, product: safeProduct(product) });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  let filename;
  try {
    const data = mutableFields(req.body);
    if (!validClassification(data)) throw new Error("Choose a product category and product type that belong to the selected main category.");
    if (!data.name || !data.type || !data.description || !data.collec || req.body.price === undefined || req.body.inventoryQuantity === undefined) {
      return res.status(400).json({ success: false, message: "Name, type, description, category, price, and inventory are required." });
    }
    const imageUrl = text(req.body.imageUrl, 1000);
    if (data.sku) {
      const duplicateSku = await Product.exists({ sellerProfile: req.sellerProfile._id, sku: data.sku });
      if (duplicateSku) return res.status(409).json({ success: false, message: "That SKU is already used by one of your products." });
    }
    if (!req.file && !imageUrlIsValid(imageUrl)) return res.status(400).json({ success: false, message: "Upload a JPEG, PNG, or WebP image, or provide a direct image URL." });
    filename = await saveSellerProductImage(req.file);
    const product = await Product.create({
      ...data,
      price: Number(req.body.price),
      inventoryQuantity: Number(req.body.inventoryQuantity),
      image: filename || imageUrl,
      userId: req.user.user_id,
      sellerProfile: req.sellerProfile._id,
      status: data.status || "published",
    });
    res.status(201).json({ success: true, product });
  } catch (error) {
    if (filename) await fs.rm(path.join(__dirname, "../uploads", filename), { force: true }).catch(() => {});
    if (["Price must", "Package quantity", "Enter both package", "Choose a supported package", "Choose a product category", "Inventory must", "Choose one", "cannot be empty", "Choose draft"].some((message) => error.message.startsWith(message))) return res.status(400).json({ success: false, message: error.message });
    if (error.message.includes("Product image content")) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

exports.update = async (req, res, next) => {
  let filename;
  try {
    const product = await findOwnedProduct(req);
    if (!product) return res.status(404).json({ success: false, message: "Seller product not found." });
    const data = mutableFields(req.body, product.collec);
    const finalClassification = {
      collec: data.collec === undefined ? product.collec : data.collec,
      productCategory: data.productCategory === undefined ? product.productCategory : data.productCategory,
      productType: data.productType === undefined ? product.productType : data.productType,
    };
    if ((finalClassification.productCategory || finalClassification.productType) && !validClassification(finalClassification)) throw new Error("Choose a product category and product type that belong to the selected main category.");
    const imageUrl = req.body.imageUrl === undefined ? "" : text(req.body.imageUrl, 1000);
    if (req.body.imageUrl !== undefined && !imageUrlIsValid(imageUrl)) return res.status(400).json({ success: false, message: "Provide a direct JPEG, PNG, or WebP image URL." });
    if (data.sku && data.sku !== product.sku && await Product.exists({ sellerProfile: req.sellerProfile._id, sku: data.sku, _id: { $ne: product._id } })) {
      return res.status(409).json({ success: false, message: "That SKU is already used by one of your products." });
    }
    filename = await saveSellerProductImage(req.file);
    Object.assign(product, data);
    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.inventoryQuantity !== undefined) product.inventoryQuantity = Number(req.body.inventoryQuantity);
    if (filename) product.image = filename;
    else if (imageUrl) product.image = imageUrl;
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    if (filename) await fs.rm(path.join(__dirname, "../uploads", filename), { force: true }).catch(() => {});
    if (["Price must", "Package quantity", "Enter both package", "Choose a supported package", "Choose a product category", "Inventory must", "Choose one", "cannot be empty", "Choose draft"].some((message) => error.message.startsWith(message))) return res.status(400).json({ success: false, message: error.message });
    if (error.message.includes("Product image content")) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

exports.archive = async (req, res, next) => {
  try {
    const product = await findOwnedProduct(req);
    if (!product) return res.status(404).json({ success: false, message: "Seller product not found." });
    product.status = "archived";
    await product.save();
    res.json({ success: true, product });
  } catch (error) { next(error); }
};

exports.inventory = async (req, res, next) => {
  try {
    const quantity = Number(req.body.inventoryQuantity);
    if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ success: false, message: "Inventory must be a whole number greater than or equal to zero." });
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerProfile: req.sellerProfile._id, userId: req.user.user_id },
      { $set: { inventoryQuantity: quantity } },
      { new: true, runValidators: true },
    );
    if (!product) return res.status(404).json({ success: false, message: "Seller product not found." });
    res.json({ success: true, product });
  } catch (error) { next(error); }
};

exports.dashboard = async (req, res, next) => {
  try {
    const products = await Product.find({ sellerProfile: req.sellerProfile._id, userId: req.user.user_id }).select("status inventoryQuantity").lean();
    const threshold = Math.max(0, Number.parseInt(process.env.SELLER_LOW_STOCK_THRESHOLD, 10) || 5);
    res.json({
      success: true,
      products: { total: products.length, published: products.filter((product) => product.status === "published").length, lowStock: products.filter((product) => product.inventoryQuantity !== null && product.inventoryQuantity <= threshold).length },
      commerce: { status: "not_configured", message: "Orders and verified payment reporting are unavailable because checkout and provider webhooks are not implemented or configured." },
    });
  } catch (error) { next(error); }
};

exports.commerceUnavailable = (resource) => (req, res) => res.status(503).json({
  success: false,
  code: "MARKETPLACE_COMMERCE_NOT_CONFIGURED",
  message: `${resource} is unavailable: BioBazaar has no verified checkout, order, payment, ledger, or payout integration configured. No financial records are being simulated.`,
});

exports.payoutStatus = (req, res) => res.json({ success: true, status: req.sellerProfile.payoutOnboardingStatus, provider: "razorpay_route_setup_required", message: "Payout onboarding requires an approved Razorpay Route account and linked-account configuration." });
exports.startPayoutOnboarding = exports.commerceUnavailable("Payout onboarding");
exports.mutableFields = mutableFields;
