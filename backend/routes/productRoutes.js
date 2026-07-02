const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  sellProduct,
  getProducts,
  getProduct,
  getCollectionProducts,
  searchProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });


router.post(
  "/sell",
  upload.single("image"),
  sellProduct
);

router.get(
  "/",
  getProducts
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
  upload.single("image"),
  updateProduct
);

router.delete(
  "/:id",
  deleteProduct
);

module.exports = router;