const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth protection to all product routes
router.use(authMiddleware.protect);

const productValidators = [
    body('title').trim().notEmpty().withMessage('Product title is required'),
    body('expiryDate').notEmpty().withMessage('Expiry date is required').isISO8601().withMessage('Expiry date must be a valid date')
];

router.post('/', productValidators, productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productValidators, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
