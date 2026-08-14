const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    googleId: { type: String, required: false },
}, {
    timestamps: true // Useful for tracking creation/update times
});

module.exports = mongoose.model('User', userSchema);
