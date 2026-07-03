const mongoose = require("mongoose");
const Cart = require("../models/cartModel");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!req.user || !req.user.user_id || req.user.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to access this cart",
      });
    }

    let cart = await Cart.findOne({ userId })
      .populate("items.productId");

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
      });
    }

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addItemToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!isValidObjectId(userId) || !isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID and product ID are required",
      });
    }

    if (!req.user || !req.user.user_id || req.user.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this cart",
      });
    }

    const qty = quantity === undefined || quantity === null ? 1 : Number(quantity);
    if (!isPositiveInteger(qty)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    const index = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (index > -1) {
      cart.items[index].quantity += qty;
    } else {
      cart.items.push({
        productId,
        quantity: qty,
      });
    }

    await cart.save();

    cart = await Cart.findById(cart._id)
      .populate("items.productId");

    return res.status(200).json({
      success: true,
      cart,
    });

  } catch (error) {
    console.error("Add Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.removeItemFromCart = async (req, res) => {
  try {

    const { userId, productId } = req.body;

    if (!isValidObjectId(userId) || !isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID and product ID are required",
      });
    }

    if (!req.user || !req.user.user_id || req.user.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this cart",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate("items.productId");

    return res.status(200).json({
      success: true,
      cart: updatedCart,
    });

  } catch (error) {

    console.error("Remove Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateQuantity = async (req, res) => {

  try {

    const { userId, productId, quantity } = req.body;

    if (!isValidObjectId(userId) || !isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID and product ID are required",
      });
    }

    if (!req.user || !req.user.user_id || req.user.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this cart",
      });
    }

    const qty = Number(quantity);
    if (!isPositiveInteger(qty)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (i) => i.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    item.quantity = qty;

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate("items.productId");

    return res.status(200).json({
      success: true,
      cart: updatedCart,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.clearCart = async (req, res) => {

  try {

    const { userId } = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    if (!req.user || !req.user.user_id || req.user.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to clear this cart",
      });
    }

    await Cart.findOneAndDelete({
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Cart Cleared",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};