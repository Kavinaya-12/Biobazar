const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
router.get("/:userId", wishlistController.getWishlist);
router.post("/add", wishlistController.addItem);
router.post("/remove", wishlistController.removeItem);
module.exports = router;