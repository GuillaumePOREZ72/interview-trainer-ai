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

// __dirname is available natively in CommonJS
declare const __dirname: string;

/**
 * Validate critical environment variables
 */
const validateEnvVariables = () => {
  const requiredVars = ["MONGO_URI", "JWT_SECRET", "REFRESH_TOKEN_SECRET"];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    logger.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`,
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  logger.info("✅ All required environment variables are set");
};

/**
 * Create necessary directories for production
 */
const createRequiredDirectories = () => {
  // Use process.cwd() to get the backend/ folder root
  const rootPath = process.cwd();

  const dirs = [path.join(rootPath, "logs"), path.join(rootPath, "uploads")];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        console.log(`[DEBUG] Attempting to create directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`📁 Created directory: ${dir}`);
      } catch (err) {
        console.error(`[DEBUG] Failed to create directory ${dir}:`, err);
        logger.error(`❌ Failed to create directory ${dir}:`, err);
      }
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
  console.log("🎬 Starting Interview Trainer AI Server...");

  try {
    // Create required directories early and safely
    createRequiredDirectories();

    // Start listening as soon as possible to satisfy Passenger/o2switch
    const server = app.listen(PORT, () => {
      const msg = `🚀 Server listening on port ${PORT} in ${NODE_ENV} mode`;
      console.log(msg);
      logger.info(msg);

      // Perform background initialization once port is bound
      initializeBackgroundServices();
    });

    server.on("error", (error: any) => {
      console.error("❌ Server listener error:", error);
      logger.error("❌ Server listener error:", error);
    });
  } catch (error) {
    console.error("❌ Fatal error during startup:", error);
    logger.error("❌ Fatal error during startup:", error);
    if (NODE_ENV === "production") {
      // Small delay before exit to allow logs/Passenger to catch up
      setTimeout(() => process.exit(1), 5000);
    }
  }
};

/**
 * Background initialization to keep startup fast
 */
const initializeBackgroundServices = async () => {
  try {
    // Validate environment variables (non-fatal start)
    validateEnvVariables();

    // Connect to database
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ Database connected successfully");
    logger.info("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Background initialization failed:", error);
    logger.error("❌ Background initialization failed:", error);
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
