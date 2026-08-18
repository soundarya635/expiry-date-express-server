const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Product title is required'],
        trim: true
    },
    upc: {
        type: String,
        trim: true,
        default: ''
    },
    amount: {
        type: String,
        trim: true,
        default: '1 pc'
    },
    category: {
        type: String,
        enum: ['Dairy', 'Bakery', 'Produce', 'Meat', 'Pantry', 'Beverages', 'General'],
        default: 'General'
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required']
    },
    status: {
        type: String,
        enum: ['active', 'consumed', 'discarded'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Indexes for fast queries
productSchema.index({ userId: 1, expiryDate: 1 });
productSchema.index({ userId: 1, upc: 1 });

module.exports = mongoose.model('Product', productSchema);
