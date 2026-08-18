const { validationResult } = require('express-validator');
const productService = require('../services/productService');

const productController = {
    createProduct: async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = req.user._id;
            const product = await productService.createProduct(userId, req.body);

            return res.status(201).json({
                message: 'Product created successfully',
                product
            });
        } catch (error) {
            next(error);
        }
    },

    getProducts: async (req, res, next) => {
        try {
            const userId = req.user._id;
            const result = await productService.getProducts(userId, req.query);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    getProductById: async (req, res, next) => {
        try {
            const userId = req.user._id;
            const product = await productService.getProductById(req.params.id, userId);
            return res.status(200).json({ product });
        } catch (error) {
            if (error.status === 404) {
                return res.status(404).json({ message: error.message });
            }
            next(error);
        }
    },

    updateProduct: async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = req.user._id;
            const updated = await productService.updateProduct(req.params.id, userId, req.body);
            return res.status(200).json({
                message: 'Product updated successfully',
                product: updated
            });
        } catch (error) {
            if (error.status === 404) {
                return res.status(404).json({ message: error.message });
            }
            next(error);
        }
    },

    deleteProduct: async (req, res, next) => {
        try {
            const userId = req.user._id;
            await productService.deleteProduct(req.params.id, userId);
            return res.status(200).json({
                message: 'Product deleted successfully'
            });
        } catch (error) {
            if (error.status === 404) {
                return res.status(404).json({ message: error.message });
            }
            next(error);
        }
    }
};

module.exports = productController;
