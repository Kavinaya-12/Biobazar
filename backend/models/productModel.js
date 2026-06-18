const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  type: String,
  price: Number,
  description: String,
  collec: String,
  image: String
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;