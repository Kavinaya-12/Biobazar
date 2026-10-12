const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const wishlistController = require("../controllers/wishlistController");

router.get("/:userId", authenticate, wishlistController.getWishlist);
router.post("/add", authenticate, wishlistController.addItem);
router.post("/remove", authenticate, wishlistController.removeItem);

module.exports = router;