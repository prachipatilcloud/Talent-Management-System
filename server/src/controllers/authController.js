import User from '../models/User.js'
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';

// helper

const sendRefreshTokenCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000  // 7days
    })
}

// const generateAccessToken = (user) => {
//     return jwt.sign(
//         { id: user._id, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: '15m' } // 15 minutes
//     );
// };

// // Generate Refresh Token (long-lived)
// const generateRefreshToken = (user) => {
//     return jwt.sign(
//         { id: user._id },
//         process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
//         { expiresIn: '7d' } // 7 days
//     );
// };

export const register = async (req, res, next) => {

    try {
        const { firstName, lastName, email, password, role, department } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            })
        }

        const emailNormalized = email.toLowerCase();

        const existingUser = await User.findOne({ email: emailNormalized });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            })
        }

        const user = await User.create({
            firstName, lastName, email: emailNormalized, password, role, department
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        sendRefreshTokenCookie(res, refreshToken);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            accessToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                department: user.department
            }
        })


    } catch (error) {
        next(error);
    }
}


export const login = async (req, res, next) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password both are required'
            })
        }

        // const user = await User.findOne({ email }).select('+password');
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Accout is deactivated.'
            })
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        sendRefreshTokenCookie(res, refreshToken);

        res.status(200).json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                department: user.department
            }
        })

    } catch (error) {
        next(error);
    }
}

export const getMe = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                role: req.user.role,
                department: req.user.department
            }
        })

    } catch (error) {
        next(error);
    }
}


export const refresh = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token

        let decoded;
        try {

            decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired refresh token'
            })
        }

        // Find user and check if refresh token matches the one in database
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== token) {
            return res.status(403).json({
                success: false,
                message: 'Token does not match, please login again'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'User account is deactivated'
            });
        }

        // Rotate both access token
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        sendRefreshTokenCookie(res, newRefreshToken);

        res.status(200).json({
            success: true,
            accessToken: newAccessToken
        });

    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;

        if (token) {
            await User.findOneAndUpdate(
                { refreshToken: token },
                { refreshToken: null }
            );

            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            })

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            })
        }
    }catch (error) {
            next(error);
        }
    };
