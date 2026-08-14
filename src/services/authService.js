const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userDao = require('../dao/userDao');

const ADMIN_ROLE = 'ADMIN';

const authService = {
    register: async (name, email, password) => {
        // Check if user already exists
        const existingUser = await userDao.findByEmail(email);
        if (existingUser) {
            const error = new Error('Email is already registered');
            error.status = 400;
            throw error;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await userDao.createUser({
            name,
            email,
            password: hashedPassword
        });

        // Convert Mongoose doc to plain object and remove password
        const userObj = newUser.toObject();
        delete userObj.password;

        return userObj;
    },

    login: async (email, password) => {
        const user = await userDao.findByEmail(email);
        if (!user) {
            const error = new Error('Invalid email or password');
            error.status = 400;
            throw error;
        }

        const isPasswordMatched = await bcrypt.compare(password, user.password || '');
        if (!isPasswordMatched) {
            const error = new Error('Invalid email or password');
            error.status = 400;
            throw error;
        }

        // Setup fallback role and adminId as required by instructions
        const role = user.role ? user.role : ADMIN_ROLE;
        const adminId = user.adminId ? user.adminId : user._id;

        // Sign token
        const token = jwt.sign({
            name: user.name,
            email: user.email,
            _id: user._id,
            role: role,
            adminId: adminId,
        }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        // Remove password from user object before returning
        const userObj = user.toObject();
        delete userObj.password;

        return { token, user: userObj };
    }
};

module.exports = authService;
