const Product = require('../models/productModel'); 
const path = require('path');
const fs = require('fs');

exports.sellProduct = async (req, res) => {
  try {
    const { name, type, price, description, collec} = req.body;
    const image = req.file ? req.file.filename : null;

    const newProduct = new Product({
      name,
      type,
      price,
      description,
      collec,
      image
    });

    await newProduct.save();

    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
};

