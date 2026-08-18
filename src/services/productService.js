const productDao = require('../dao/productDao');

const productService = {
    createProduct: async (userId, productData) => {
        const payload = {
            userId,
            title: productData.title,
            upc: productData.upc || '',
            amount: productData.amount || '1 pc',
            category: productData.category || 'General',
            expiryDate: new Date(productData.expiryDate),
            status: productData.status || 'active'
        };

        return await productDao.createProduct(payload);
    },

    getProducts: async (userId, queryParams) => {
        return await productDao.getProductsPaginated(userId, queryParams);
    },

    getProductById: async (id, userId) => {
        const product = await productDao.getProductById(id, userId);
        if (!product) {
            const error = new Error('Product not found');
            error.status = 404;
            throw error;
        }
        return product;
    },

    updateProduct: async (id, userId, updateData) => {
        const updated = await productDao.updateProduct(id, userId, updateData);
        if (!updated) {
            const error = new Error('Product not found or unauthorized');
            error.status = 404;
            throw error;
        }
        return updated;
    },

    deleteProduct: async (id, userId) => {
        const deleted = await productDao.deleteProduct(id, userId);
        if (!deleted) {
            const error = new Error('Product not found or unauthorized');
            error.status = 404;
            throw error;
        }
        return deleted;
    }
};

module.exports = productService;
