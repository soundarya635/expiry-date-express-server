const User = require('../models/user');
const connectDB = require('../config/db');

// In-memory database store for fallback mode
const usersInMemory = [];

const userDao = {
    findByEmail: async (email) => {
        if (connectDB.isConnected()) {
            return await User.findOne({ email });
        } else {
            const user = usersInMemory.find(u => u.email === email);
            if (!user) return null;
            
            // Return a Mongoose-compatible document format
            return {
                ...user,
                toObject: function() {
                    const obj = { ...this };
                    delete obj.toObject;
                    return obj;
                }
            };
        }
    },
    createUser: async (userData) => {
        if (connectDB.isConnected()) {
            const user = new User(userData);
            return await user.save();
        } else {
            const id = 'mock_' + Math.random().toString(36).substring(2, 11);
            const now = new Date();
            const newUser = {
                _id: id,
                ...userData,
                createdAt: now,
                updatedAt: now,
                toObject: function() {
                    const obj = { ...this };
                    delete obj.toObject;
                    return obj;
                }
            };
            usersInMemory.push(newUser);
            return newUser;
        }
    }
};

module.exports = userDao;
