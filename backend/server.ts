/**
 * Node modules
 */
import "dotenv/config";
import express, { Express } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";

/**
 * Custom modules
 */
import connectDB from "./config/db";
import { logger } from "./config/logger";
import limiter from "./config/rateLimiter";
import authRoutes from "./routes/authRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import questionRoutes from "./routes/questionRoutes";
import { protect } from "./middlewares/authMiddleware";
import {
  generateConceptExplanation,
  generateInterviewQuestions,
} from "./controllers/aiController";

/**
 * Constants
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Express app configuration
 */
const app: Express = express();

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (NODE_ENV === "development" || !origin) {
      callback(null, true);
    } else {
      const whitelist = process.env.WHITELIST_ORIGINS?.split(",") || [];
      if (whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS error: ${origin} is not allowed by CORS`));
        logger.warn(`CORS error: ${origin} is not allowed by CORS`);
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Compression for responses larger than 1KB
app.use(
  compression({
    threshold: 1024, // 1KB
  })
);

// Security headers with relaxed CSP for development
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: NODE_ENV === "production" ? undefined : false,
}));

// Apply rate limiting middleware to all routes
app.use(limiter);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Interview Prep AI Backend is running.",
    version: "v1",
    status: "healthy",
  });
});

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/ai/generate-questions", protect, generateInterviewQuestions);
app.use("/api/ai/generate-explanation", protect, generateConceptExplanation);


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