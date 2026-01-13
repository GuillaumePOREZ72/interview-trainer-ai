"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../config/logger");
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI environment variable is not defined");
        }
        const conn = await mongoose_1.default.connect(process.env.MONGO_URI, {});
        logger_1.logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
    }
    catch (error) {
        logger_1.logger.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};
exports.default = connectDB;
