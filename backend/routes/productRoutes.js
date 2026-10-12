const express = require("express");
const { uploadSellerProductImage } = require("../services/sellerProductImages");

const {
  sellProduct,
  getProducts,
  getProduct,
  getCollectionProducts,
  getMyProducts,
  searchProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { authenticate } = require("../middleware/auth");
const { requireApprovedSeller } = require("../middleware/seller");

const router = express.Router();

const upload = (req, res, next) => uploadSellerProductImage(req, res, (error) => {
  if (error) return res.status(400).json({ success: false, message: error.message || "Product image upload failed." });
  next();
});


router.post(
  "/sell",
  authenticate,
  requireApprovedSeller,
  upload,
  sellProduct
);

router.get(
  "/",
  getProducts
);

router.get(
  "/my-products",
  authenticate,
  getMyProducts
);

router.get(
  "/search",
  searchProducts
);

router.get(
  "/collection/:collec",
  getCollectionProducts
);

router.get(
  "/:id",
  getProduct
);

router.put(
  "/:id",
  authenticate,
  requireApprovedSeller,
  upload,
  updateProduct
);

router.delete(
  "/:id",
  authenticate,
  requireApprovedSeller,
  deleteProduct
);

module.exports = router;