const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const cartController = require("../controllers/cartController");

router.get("/:userId", authenticate, cartController.getCart);
router.post("/add", authenticate, cartController.addItemToCart);
router.post("/remove", authenticate, cartController.removeItemFromCart);
router.put("/quantity", authenticate, cartController.updateQuantity);
router.delete("/clear", authenticate, cartController.clearCart);

module.exports = router;