/**
 * Server Entry Point
 * Uses app configuration from app.ts
 */
import * as dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import connectDB from "./config/db";
import { logger } from "./config/logger";

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
