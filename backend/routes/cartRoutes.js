const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.post('/add', cartController.addItemToCart);
router.post('/remove', cartController.removeItemFromCart);
router.get('/:userId', cartController.getCart);

module.exports = router;
