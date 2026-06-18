const Cart = require('../models/cartModel');
const Product = require('../models/productModel'); 

exports.addItemToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        cart.items.push({ productId, quantity });
      }

      cart = await cart.save();
    } else {
      const newCart = new Cart({
        userId,
        items: [{ productId, quantity }]
      });

      await newCart.save();
    }

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeItemFromCart = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      cart.items = cart.items.filter(item => item.productId.toString() !== productId);

      cart = await cart.save();
      res.status(200).json({ success: true, cart });
    } else {
      res.status(404).json({ success: false, message: 'Cart not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (cart) {
      res.status(200).json({ success: true, cart });
    } else {
      res.status(404).json({ success: false, message: 'Cart not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 