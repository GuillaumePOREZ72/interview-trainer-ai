/**
 * Server Entry Point
 * Uses app configuration from app.ts
 */
import * as dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import connectDB from "./config/db";
import { logger } from "./config/logger";
import fs from "fs";
import path from "path";

/**
 * Validate critical environment variables
 */
const validateEnvVariables = () => {
  const requiredVars = ["MONGO_URI", "JWT_SECRET", "REFRESH_TOKEN_SECRET"];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    logger.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  logger.info("✅ All required environment variables are set");
};

/**
 * Create necessary directories for production
 */
const createRequiredDirectories = () => {
  const dirs = [path.join(__dirname, "logs"), path.join(__dirname, "uploads")];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`📁 Created directory: ${dir}`);
    }
  });
};

const app = createApp();

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
    await connectDB();
    logger.info("✅ Database connected successfully");

    // Start server
    app.listen(PORT, () => {
      logger.info(
        `🚀 Server running in ${NODE_ENV} mode on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    logger.error("❌ Error starting server:", error);

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
    logger.warn("\n⚠️  Shutting down server gracefully...");
    // Disconnect from database
    const mongoose = await import("mongoose");
    await mongoose.default.disconnect();
    logger.info("✅ Database disconnected");
    logger.info("👋 Server shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during server shutdown:", error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on("SIGTERM", handleServerShutdown);
process.on("SIGINT", handleServerShutdown);

// Start the server
startServer();
