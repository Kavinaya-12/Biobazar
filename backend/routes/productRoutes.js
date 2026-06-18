const express = require('express');
const multer = require('multer');
const path = require('path');
const Product = require("../models/productModel") 
const { sellProduct } = require('../controllers/productController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post('/sell', upload.single('image'), sellProduct);
router.get('/collection/:collec', async (req, res) => {
  try {
    const products = await Product.find({ collec: req.params.collec });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;

