const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
router.get("/:userId", cartController.getCart);
router.post("/add", cartController.addItemToCart);
router.post("/remove", cartController.removeItemFromCart);
router.put("/quantity", cartController.updateQuantity);
router.delete("/clear", cartController.clearCart);
module.exports = router;