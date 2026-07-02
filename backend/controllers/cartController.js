const Cart = require("../models/cartModel");

exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;

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
      cart.items[index].quantity += quantity || 1;
    } else {
      cart.items.push({
        productId,
        quantity: quantity || 1,
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

    item.quantity = quantity;

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