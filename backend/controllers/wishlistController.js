const Wishlist = require("../models/wishlistModel");

// ===========================
// Get Wishlist
// ===========================
exports.getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    let wishlist = await Wishlist.findOne({ userId })
      .populate("items.productId");

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId,
        items: [],
      });
    }

    return res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// Add Item
// ===========================
exports.addItem = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        items: [],
      });
    }

    const alreadyExists = wishlist.items.some(
      (item) => item.productId.toString() === productId
    );

    if (!alreadyExists) {
      wishlist.items.push({
        productId,
      });
    }

    await wishlist.save();

    wishlist = await Wishlist.findById(wishlist._id)
      .populate("items.productId");

    return res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Add Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// Remove Item
// ===========================
exports.removeItem = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await wishlist.save();

    const updatedWishlist = await Wishlist.findById(wishlist._id)
      .populate("items.productId");

    return res.status(200).json({
      success: true,
      wishlist: updatedWishlist,
    });
  } catch (error) {
    console.error("Remove Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};