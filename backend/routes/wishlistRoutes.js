const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
router.post("/add", wishlistController.addItem);
router.post("/remove", wishlistController.removeItem);
router.get("/:userId", wishlistController.getWishlist);
module.exports = router;