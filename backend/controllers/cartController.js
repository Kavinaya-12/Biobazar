const Cart = require("../models/cartModel");

// Add item to cart
exports.addItemToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
      });
    }

    await cart.save();

    const populatedCart = await Cart.findOne({ userId }).populate(
      "items.productId"
    );

    res.status(200).json({
      success: true,
      cart: populatedCart,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      userId: req.params.userId,
    }).populate("items.productId");

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Remove item
exports.removeItemFromCart = async (req, res) => {
  const { userId, productId } = req.body;

  try {
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

    const updatedCart = await Cart.findOne({ userId }).populate(
      "items.productId"
    );

    res.status(200).json({
      success: true,
      cart: updatedCart,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};