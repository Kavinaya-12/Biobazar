const Product = require("../models/productModel");
const SellerProfile = require("../models/sellerProfileModel");
const fs = require("fs/promises");
const path = require("path");
const sellerProductImages = require("../services/sellerProductImages");
const { productCategoryValues } = require("../services/productCategories");
const { validClassification } = require("../services/productClassification");

const publicProductFilter = async () => {
  const approvedSellerIds = await SellerProfile.distinct("_id", { status: "approved" });
  return {
    $and: [
      { $or: [{ sellerProfile: null }, { sellerProfile: { $exists: false } }, { sellerProfile: { $in: approvedSellerIds } }] },
      { $or: [{ status: { $exists: false } }, { status: "published" }] },
    ],
  };
};

const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif", ".bmp"];
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isValidImageUrl = (value) => {
  if (!isNonEmptyString(value)) return false;

  try {
    const url = new URL(value.trim());
    const pathname = url.pathname.toLowerCase();
    const hasDirectImageExtension = validImageExtensions.some((extension) => pathname.endsWith(extension));
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && hasDirectImageExtension;
  } catch {
    return false;
  }
};

exports.sellProduct = async (req, res) => {
  let filename;
  try {
    const { name, type, price, description, collec, imageUrl, productCategory, productType, packageQuantity, packageUnit } = req.body;
    const userId = req.user && (req.user.user_id || req.user._id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to sell a product",
      });
    }

    if (!isNonEmptyString(name) || !isNonEmptyString(type) || !isNonEmptyString(description) || !isNonEmptyString(collec)) {
      return res.status(400).json({
        success: false,
        message: "Name, type, description, and collection are required",
      });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({
        success: false,
        message: "Price is required",
      });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }
    const inventoryQuantity = Number(req.body.inventoryQuantity);
    if (req.body.inventoryQuantity === undefined || !Number.isInteger(inventoryQuantity) || inventoryQuantity < 0) return res.status(400).json({ success: false, message: "Available stock must be a whole number greater than or equal to zero." });

    if (!validClassification({ collec, productCategory, productType })) return res.status(400).json({ success: false, message: "Choose a product category and product type that belong to the selected collection." });
    const numericQuantity = packageQuantity === undefined || packageQuantity === "" ? null : Number(packageQuantity);
    if (numericQuantity !== null && (!Number.isFinite(numericQuantity) || numericQuantity <= 0 || numericQuantity > 1000000)) return res.status(400).json({ success: false, message: "Package quantity must be a positive finite amount." });
    const unit = packageUnit || "";
    if (!(["", "g", "kg", "ml", "l", "piece", "count"].includes(unit)) || ((numericQuantity === null) !== !unit) || (["piece", "count"].includes(unit) && numericQuantity !== null && !Number.isInteger(numericQuantity))) return res.status(400).json({ success: false, message: "Enter a valid package quantity and unit together." });

    filename = await sellerProductImages.saveSellerProductImage(req.file);
    const hasUploadedFile = Boolean(filename);
    const finalImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";

    if (!hasUploadedFile && !isValidImageUrl(finalImageUrl)) {
      return res.status(400).json({
        success: false,
        message: "Product image is required. Upload an image or use a direct image link ending with .jpg, .jpeg, .png, .gif, .webp, .svg, .avif, or .bmp.",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      type: type.trim(),
      price: numericPrice,
      description: description.trim(),
      collec: collec.trim(),
      productCategory, productType, packageQuantity: numericQuantity, packageUnit: unit,
      inventoryQuantity,
      ...Object.fromEntries(["certification", "ingredients", "packaging", "reusable", "recyclable", "evidenceNotes"].map((field) => [field, typeof req.body[field] === "string" ? req.body[field].trim() : ""])),
      image: hasUploadedFile ? filename : finalImageUrl,
      userId,
      sellerProfile: req.sellerProfile._id,
      status: "published",
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    if (filename) await fs.rm(path.join(__dirname, "../uploads", filename), { force: true }).catch(() => {});
    if (error.message.includes("Product image content")) return res.status(400).json({ success: false, message: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find(await publicProductFilter());

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...(await publicProductFilter()) });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCollectionProducts = async (req, res) => {
  try {
    const categoryValues = productCategoryValues(req.params.collec);
    const collectionFilter = categoryValues.length ? { collec: { $in: categoryValues } } : { collec: req.params.collec };
    const products = await Product.find({ $and: [await publicProductFilter(), collectionFilter] });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const userId = req.user && (req.user.user_id || req.user._id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const products = await Product.find({ userId }).sort({ _id: -1 });

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const keyword = typeof req.query.keyword === "string" ? req.query.keyword.trim().slice(0, 100) : "";
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const products = await Product.find({ $and: [await publicProductFilter(), { name: { $regex: escapedKeyword, $options: "i" } }] });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  let filename;
  try {
    const userId = req.user && (req.user.user_id || req.user._id);
    const mutableFields = ["name", "type", "price", "description", "collec", "productCategory", "productType", "packageQuantity", "packageUnit", "certification", "ingredients", "packaging", "reusable", "recyclable", "evidenceNotes"];
    const updateData = Object.fromEntries(mutableFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    const remoteImageUrl = typeof req.body.imageUrl === "string" ? req.body.imageUrl.trim() : "";

    if (!req.file && isValidImageUrl(remoteImageUrl)) {
      updateData.image = remoteImageUrl;
    }

    if (updateData.name !== undefined && !isNonEmptyString(updateData.name)) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (updateData.type !== undefined && !isNonEmptyString(updateData.type)) {
      return res.status(400).json({
        success: false,
        message: "Type cannot be empty",
      });
    }

    if (updateData.description !== undefined && !isNonEmptyString(updateData.description)) {
      return res.status(400).json({
        success: false,
        message: "Description cannot be empty",
      });
    }

    if (updateData.collec !== undefined && !isNonEmptyString(updateData.collec)) {
      return res.status(400).json({
        success: false,
        message: "Collection cannot be empty",
      });
    }

    if (updateData.price !== undefined) {
      const numericPrice = Number(updateData.price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a positive number",
        });
      }
      updateData.price = numericPrice;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!userId || product.userId?.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this product",
      });
    }

    const finalClassification = { collec: updateData.collec || product.collec, productCategory: updateData.productCategory ?? product.productCategory, productType: updateData.productType ?? product.productType };
    if (finalClassification.productCategory || finalClassification.productType) {
      if (!validClassification(finalClassification)) return res.status(400).json({ success: false, message: "Choose a product category and product type that belong to the selected collection." });
    }
    if (updateData.packageQuantity !== undefined) updateData.packageQuantity = updateData.packageQuantity === "" ? null : Number(updateData.packageQuantity);
    const finalQuantity = updateData.packageQuantity === undefined ? product.packageQuantity : updateData.packageQuantity;
    const finalUnit = updateData.packageUnit === undefined ? product.packageUnit : updateData.packageUnit;
    if ((finalQuantity === null || finalQuantity === undefined || finalQuantity === "") !== (!finalUnit) || (finalQuantity !== null && finalQuantity !== undefined && (!Number.isFinite(finalQuantity) || finalQuantity <= 0 || finalQuantity > 1000000)) || (["piece", "count"].includes(finalUnit) && finalQuantity !== null && finalQuantity !== undefined && !Number.isInteger(finalQuantity))) return res.status(400).json({ success: false, message: "Enter a valid package quantity and unit together." });

    if (product.sellerProfile && product.sellerProfile.toString() !== req.sellerProfile._id.toString()) {
      return res.status(403).json({ success: false, message: "This product is not managed through your approved seller account." });
    }

    if (req.file) {
      filename = await sellerProductImages.saveSellerProductImage(req.file);
      updateData.image = filename;
    }
    if (!product.sellerProfile) product.sellerProfile = req.sellerProfile._id;
    Object.assign(product, updateData);
    await product.save();

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    if (filename) await fs.rm(path.join(__dirname, "../uploads", filename), { force: true }).catch(() => {});
    if (error.message.includes("Product image content")) return res.status(400).json({ success: false, message: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const userId = req.user && (req.user.user_id || req.user._id);
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!userId || product.userId?.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this product",
      });
    }

    if (product.sellerProfile && product.sellerProfile.toString() !== req.sellerProfile._id.toString()) {
      return res.status(403).json({ success: false, message: "This product is not managed through your approved seller account." });
    }
    product.sellerProfile = req.sellerProfile._id;
    product.status = "archived";
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product archived successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
