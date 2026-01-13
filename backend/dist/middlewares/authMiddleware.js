"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = require("../config/logger");
// Middleware to protect routes
const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if (token && token.startsWith("Bearer")) {
            token = token.split(" ")[1]; // Extract token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = await User_1.default.findById(decoded.id).select("-password");
            next();
        }
        else {
            logger_1.logger.warn("Authentication failed: User not found for token");
            res.status(401).json({ message: "Not authorized, no token" });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Token failed";
        logger_1.logger.error(`Authentication error: ${errorMessage} - IP: ${req.ip}`);
        res.status(401).json({ message: "Token failed", error: errorMessage });
    }
};
exports.protect = protect;
