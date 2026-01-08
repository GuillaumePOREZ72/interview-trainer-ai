/**
 * Express App Configuration
 * Separated from server.ts to allow testing with supertest
 */
import * as dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";

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
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Create and configure Express app
 */
export const createApp = (): Express => {
  const app: Express = express();

  // Trust proxy for rate limiting in production (o2switch/reverse proxies)
  if (NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // CORS configuration
  const corsOptions: cors.CorsOptions = {
    origin(origin, callback) {
      if (NODE_ENV === "development" || NODE_ENV === "test" || !origin) {
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
      threshold: 1024,
    })
  );

  // Security headers with relaxed CSP for development/test
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: NODE_ENV === "production" ? undefined : false,
    })
  );

  // Apply rate limiting middleware (skip in test environment)
  if (NODE_ENV !== "test") {
    app.use(limiter);
  }

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

  const apiPrefix = NODE_ENV === "production" ? "" : "/api";
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/sessions`, sessionRoutes);
  app.use(`${apiPrefix}/questions`, questionRoutes);
  app.use(`${apiPrefix}/ai/generate-questions`, protect, generateInterviewQuestions);
  app.use(`${apiPrefix}/ai/generate-explanation`, protect, generateConceptExplanation);

  return app;
};

// Export a default instance for backward compatibility
const app = createApp();
export default app;
