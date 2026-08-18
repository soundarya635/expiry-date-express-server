const { validationResult } = require('express-validator');
const authService = require('../services/authService');

const authController = {
    register: async (request, response, next) => {
        try {
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({
                    errors: errors.array()
                });
            }

            const { name, email, password } = request.body;
            const user = await authService.register(name, email, password);

            return response.status(201).json({
                message: 'User registered successfully',
                user: user
            });
        } catch (error) {
            if (error.status === 400) {
                return response.status(400).json({
                    message: error.message
                });
            }
            next(error);
        }
    },

    login: async (request, response, next) => {
        try {
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({
                    errors: errors.array()
                });
            }

            const { email, password } = request.body;
            const { token, user } = await authService.login(email, password);

            response.cookie('jwtToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/'
            });

            return response.status(200).json({
                message: 'User authenticated',
                token: token,
                user: user
            });
        } catch (error) {
            if (error.status === 400) {
                return response.status(400).json({
                    message: error.message
                });
            }
            next(error);
        }
    }
};

module.exports = authController;
