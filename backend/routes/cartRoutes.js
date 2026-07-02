const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middleware/auth");
router.post("/add", authenticate, cartController.addItemToCart);
router.get("/:userId", authenticate, cartController.getCart);
router.post("/remove", authenticate, cartController.removeItemFromCart);
module.exports = router;