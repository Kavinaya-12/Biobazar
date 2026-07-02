const Wishlist = require("../models/wishlistModel");

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

    const exists = wishlist.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!exists) {
      wishlist.items.push({
        productId,
      });
    }

    await wishlist.save();

    const updatedWishlist = await Wishlist.findOne({
      userId,
    }).populate("items.productId");

    res.status(200).json({
      success: true,
      wishlist: updatedWishlist,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

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

    const updatedWishlist = await Wishlist.findOne({
      userId,
    }).populate("items.productId");

    res.status(200).json({
      success: true,
      wishlist: updatedWishlist,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

exports.getWishlist = async (req, res) => {

  try {

    const { userId } = req.params;

    const wishlist = await Wishlist.findOne({
      userId,
    }).populate("items.productId");

    if (!wishlist) {

      return res.status(200).json({
        success: true,
        wishlist: {
          items: [],
        },
      });

    }

    res.status(200).json({
      success: true,
      wishlist,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};