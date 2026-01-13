"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccessToken = exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const User_js_1 = __importDefault(require("../models/User.js"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_js_1 = require("../config/logger.js");
// Generate JWT Access Token (short-lived)
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "10m",
    });
};
// Generate Refresh Token (long-lived)
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
};
// Register a new user
const registerUser = async (req, res) => {
    try {
        const { name, email, password, profileImageUrl } = req.body;
        const userExists = await User_js_1.default.findOne({ email });
        if (userExists) {
            logger_js_1.logger.warn(`Registration attempt with existing email: ${email}`);
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = await User_js_1.default.create({
            name,
            email,
            password: hashedPassword,
            profileImageUrl,
        });
        const accessToken = generateToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());
        logger_js_1.logger.info(`✅ New user registered: ${email}`);
        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                profileImageUrl: user.profileImageUrl,
            },
            token: accessToken,
            refreshToken,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Server error";
        logger_js_1.logger.error(`Registration error: ${errorMessage}`);
        res.status(500).json({
            message: "Server error",
            error: errorMessage,
        });
    }
};
exports.registerUser = registerUser;
// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_js_1.default.findOne({ email });
        if (!user) {
            logger_js_1.logger.warn(`Login attempt with invalid email: ${email}`);
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            logger_js_1.logger.warn(`Login attempt with incorrect password for email: ${email}`);
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }
        const accessToken = generateToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());
        logger_js_1.logger.info(`✅ User logged in: ${email}`);
        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                profileImageUrl: user.profileImageUrl,
            },
            token: accessToken,
            refreshToken,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Server error";
        logger_js_1.logger.error(`Login error: ${errorMessage}`);
        res.status(500).json({
            message: "Server error",
            error: errorMessage,
        });
    }
};
exports.loginUser = loginUser;
// Refresh access token using refresh token
const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({ message: "Refresh token is required" });
            return;
        }
        // Verify the refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        // Check if user still exists
        const user = await User_js_1.default.findById(decoded.id);
        if (!user) {
            logger_js_1.logger.warn(`Refresh token attempt for non-existent user: ${decoded.id}`);
            res.status(401).json({ message: "User not found" });
            return;
        }
        // Generate new access token
        const newAccessToken = generateToken(user._id.toString());
        logger_js_1.logger.info(`🔄 Access token refreshed for user: ${user.email}`);
        res.json({
            token: newAccessToken,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Invalid refresh token";
        logger_js_1.logger.error(`Refresh token error: ${errorMessage}`);
        res.status(401).json({ message: "Invalid or expired refresh token" });
    }
};
exports.refreshAccessToken = refreshAccessToken;
// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User_js_1.default.findById(req.user?._id).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Server error";
        res.status(500).json({
            message: "Server error",
            error: errorMessage,
        });
    }
};
exports.getUserProfile = getUserProfile;
