"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Server Entry Point
 * Uses app configuration from app.ts
 */
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app_1 = require("./app");
const db_1 = __importDefault(require("./config/db"));
const logger_1 = require("./config/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Validate critical environment variables
 */
const validateEnvVariables = () => {
    const requiredVars = ["MONGO_URI", "JWT_SECRET", "REFRESH_TOKEN_SECRET"];
    const missing = requiredVars.filter((varName) => !process.env[varName]);
    if (missing.length > 0) {
        logger_1.logger.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
    logger_1.logger.info("✅ All required environment variables are set");
};
/**
 * Create necessary directories for production
 */
const createRequiredDirectories = () => {
    const dirs = [path_1.default.join(__dirname, "logs"), path_1.default.join(__dirname, "uploads")];
    dirs.forEach((dir) => {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
            logger_1.logger.info(`📁 Created directory: ${dir}`);
        }
    });
};
const app = (0, app_1.createApp)();
/**
 * Constants
 */
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
/**
 * Database connection and server startup
 */
const startServer = async () => {
    try {
        // Validate environment variables
        validateEnvVariables();
        // Create required directories
        createRequiredDirectories();
        // Conect to database
        await (0, db_1.default)();
        logger_1.logger.info("✅ Database connected successfully");
        // Start server
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 Server running in ${NODE_ENV} mode on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error("❌ Error starting server:", error);
        if (NODE_ENV === "production") {
            process.exit(1);
        }
    }
};
/**
 * Graceful shutdown handler
 */
const handleServerShutdown = async () => {
    try {
        logger_1.logger.warn("\n⚠️  Shutting down server gracefully...");
        // Disconnect from database
        const mongoose = await Promise.resolve().then(() => __importStar(require("mongoose")));
        await mongoose.default.disconnect();
        logger_1.logger.info("✅ Database disconnected");
        logger_1.logger.info("👋 Server shutdown complete");
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error("❌ Error during server shutdown:", error);
        process.exit(1);
    }
};
// Register shutdown handlers
process.on("SIGTERM", handleServerShutdown);
process.on("SIGINT", handleServerShutdown);
// Start the server
startServer();
