const express = require("express");
const Product = require("../models/productModel");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const sellerAdminController = require("../controllers/sellerAdminController");
const router = express.Router();
const evidenceFields = ["certification", "ingredients", "packaging", "reusable", "recyclable", "evidenceNotes"];
router.use(authenticate, requireAdmin);
router.get("/session", (req, res) => res.json({ success: true, isAdmin: true }));
router.get("/seller-applications", sellerAdminController.listApplications);
router.get("/seller-applications/:id", sellerAdminController.getApplication);
router.patch("/seller-applications/:id/review", sellerAdminController.reviewApplication);
router.get("/products", async (req, res) => {
  try { const products = await Product.find().sort({ _id: -1 }).lean(); res.json({ success: true, products }); }
  catch (error) { res.status(500).json({ success: false, message: "Could not load products." }); }
});
router.patch("/products/:id/evidence", async (req, res) => {
  try {
    const update = {};
    for (const field of evidenceFields) if (req.body[field] !== undefined) {
      if (typeof req.body[field] !== "string") return res.status(400).json({ success: false, message: `${field} must be text.` });
      update[field] = req.body[field].trim().slice(0, 2000);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, product });
  } catch (error) { res.status(400).json({ success: false, message: "Invalid product ID or evidence data." }); }
});
router.delete("/products/:id", async (req, res) => {
  try { const product = await Product.findByIdAndDelete(req.params.id); if (!product) return res.status(404).json({ success: false, message: "Product not found." }); res.json({ success: true, message: "Product deleted." }); }
  catch (error) { res.status(400).json({ success: false, message: "Invalid product ID." }); }
});
module.exports = router;
