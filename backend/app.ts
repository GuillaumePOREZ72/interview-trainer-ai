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
    }),
  );

  // Security headers with relaxed CSP for development/test
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: NODE_ENV === "production" ? undefined : false,
    }),
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

  // API Routes (keeping /api prefix for consistency with frontend)
  app.use("/api/auth", authRoutes);
  app.use("/api/sessions", sessionRoutes);
  app.use("/api/questions", questionRoutes);
  app.use("/api/ai/generate-questions", protect, generateInterviewQuestions);
  app.use("/api/ai/generate-explanation", protect, generateConceptExplanation);

  // Serve static files from React frontend in production
  if (NODE_ENV === "production") {
    const frontendDistPath = path.join(
      __dirname,
      "../../frontend/interview-prep-ai/dist",
    );
    app.use(express.static(frontendDistPath));

    // Support React Router client-side routing
    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(frontendDistPath, "index.html"));
    });
  }

  // Global error handler
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      logger.error("❌ Unhandled error", {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
      });

      res.status(500).json({
        message: "Internal server error",
        error: NODE_ENV === "development" ? err.message : undefined,
      });
    },
  );

  // 404 handler (MUST be after all routes and error handler)
  app.use((req: express.Request, res: express.Response) => {
    logger.warn("⚠️  Route not found", {
      url: req.url,
      method: req.method,
    });
    res.status(404).json({ message: "Route not found" });
  });

  return app;
};

// Export a default instance for backward compatibility
const app = createApp();
export default app;
