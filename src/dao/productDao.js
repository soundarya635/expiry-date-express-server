const Product = require('../models/product');
const connectDB = require('../config/db');

// In-memory store for fallback mode
const productsInMemory = [];

// Helper to format in-memory item like Mongoose doc
const formatMemoryDoc = (doc) => ({
    ...doc,
    toObject: function() {
        const obj = { ...this };
        delete obj.toObject;
        return obj;
    }
});

const productDao = {
    createProduct: async (productData) => {
        if (connectDB.isConnected()) {
            const product = new Product(productData);
            return await product.save();
        } else {
            const id = 'prod_' + Math.random().toString(36).substring(2, 11);
            const now = new Date();
            const newProduct = {
                _id: id,
                ...productData,
                upc: productData.upc || '',
                amount: productData.amount || '1 pc',
                category: productData.category || 'General',
                status: productData.status || 'active',
                expiryDate: new Date(productData.expiryDate),
                createdAt: now,
                updatedAt: now
            };
            productsInMemory.push(newProduct);
            return formatMemoryDoc(newProduct);
        }
    },

    getProductById: async (id, userId) => {
        if (connectDB.isConnected()) {
            return await Product.findOne({ _id: id, userId });
        } else {
            const prod = productsInMemory.find(p => p._id.toString() === id.toString() && p.userId.toString() === userId.toString());
            return prod ? formatMemoryDoc(prod) : null;
        }
    },

    updateProduct: async (id, userId, updateData) => {
        if (connectDB.isConnected()) {
            return await Product.findOneAndUpdate(
                { _id: id, userId },
                { $set: updateData },
                { new: true, runValidators: true }
            );
        } else {
            const index = productsInMemory.findIndex(p => p._id.toString() === id.toString() && p.userId.toString() === userId.toString());
            if (index === -1) return null;
            
            const updated = {
                ...productsInMemory[index],
                ...updateData,
                updatedAt: new Date()
            };
            if (updateData.expiryDate) {
                updated.expiryDate = new Date(updateData.expiryDate);
            }
            productsInMemory[index] = updated;
            return formatMemoryDoc(updated);
        }
    },

    deleteProduct: async (id, userId) => {
        if (connectDB.isConnected()) {
            return await Product.findOneAndDelete({ _id: id, userId });
        } else {
            const index = productsInMemory.findIndex(p => p._id.toString() === id.toString() && p.userId.toString() === userId.toString());
            if (index === -1) return null;
            const [deleted] = productsInMemory.splice(index, 1);
            return formatMemoryDoc(deleted);
        }
    },

    getProductsPaginated: async (userId, options = {}) => {
        const page = Math.max(1, parseInt(options.page) || 1);
        const limit = Math.min(20, Math.max(1, parseInt(options.limit) || 20));
        const skip = (page - 1) * limit;

        const { search, category, monthsFilter, statusFilter } = options;

        if (connectDB.isConnected()) {
            const query = { userId };

            if (statusFilter && statusFilter !== 'all') {
                query.status = statusFilter;
            } else {
                query.status = 'active';
            }

            if (category && category !== 'all') {
                query.category = category;
            }

            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { upc: { $regex: search, $options: 'i' } }
                ];
            }

            if (monthsFilter) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                if (monthsFilter === 'expired') {
                    query.expiryDate = { $lt: now };
                } else if (monthsFilter === 'soon') {
                    const threeDays = new Date();
                    threeDays.setDate(now.getDate() + 3);
                    query.expiryDate = { $gte: now, $lte: threeDays };
                } else if (!isNaN(parseInt(monthsFilter))) {
                    const months = parseInt(monthsFilter);
                    const target = new Date();
                    target.setMonth(target.getMonth() + months);
                    query.expiryDate = { $gte: now, $lte: target };
                }
            }

            const total = await Product.countDocuments(query);
            const products = await Product.find(query)
                .sort({ expiryDate: 1 })
                .skip(skip)
                .limit(limit);

            return {
                products,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            };
        } else {
            // In-Memory search & filter logic
            let filtered = productsInMemory.filter(p => p.userId.toString() === userId.toString());

            const status = statusFilter || 'active';
            if (status !== 'all') {
                filtered = filtered.filter(p => p.status === status);
            }

            if (category && category !== 'all') {
                filtered = filtered.filter(p => p.category === category);
            }

            if (search) {
                const q = search.toLowerCase();
                filtered = filtered.filter(p => 
                    (p.title && p.title.toLowerCase().includes(q)) ||
                    (p.upc && p.upc.toLowerCase().includes(q))
                );
            }

            if (monthsFilter) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                if (monthsFilter === 'expired') {
                    filtered = filtered.filter(p => new Date(p.expiryDate) < now);
                } else if (monthsFilter === 'soon') {
                    const threeDays = new Date();
                    threeDays.setDate(now.getDate() + 3);
                    filtered = filtered.filter(p => {
                        const d = new Date(p.expiryDate);
                        return d >= now && d <= threeDays;
                    });
                } else if (!isNaN(parseInt(monthsFilter))) {
                    const target = new Date();
                    target.setMonth(target.getMonth() + parseInt(monthsFilter));
                    filtered = filtered.filter(p => {
                        const d = new Date(p.expiryDate);
                        return d >= now && d <= target;
                    });
                }
            }

            // Sort by expiryDate ascending
            filtered.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

            const total = filtered.length;
            const paginated = filtered.slice(skip, skip + limit).map(formatMemoryDoc);

            return {
                products: paginated,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            };
        }
    }
};

module.exports = productDao;
