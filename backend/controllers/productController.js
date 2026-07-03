const Product = require("../models/productModel");

const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

exports.sellProduct = async (req, res) => {
  try {
    const { name, type, price, description, collec } = req.body;

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
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    if (!allowedImageTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image type",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      type: type.trim(),
      price: numericPrice,
      description: description.trim(),
      collec: collec.trim(),
      image: req.file.filename,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();

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
    const product = await Product.findById(req.params.id);

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
    const products = await Product.find({ collec: req.params.collec });

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

exports.searchProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";

    const products = await Product.find({
      name: {
        $regex: keyword,
        $options: "i",
      },
    });

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
  try {
    const updateData = { ...req.body };

    if (req.file) {
      if (!allowedImageTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Invalid image type",
        });
      }
      updateData.image = req.file.filename;
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

    Object.assign(product, updateData);
    await product.save();

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

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
