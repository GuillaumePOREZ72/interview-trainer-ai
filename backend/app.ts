/**
 * Express App Configuration
 * Separated from server.ts to allow testing with supertest
 */
import * as dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
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
          logger.warn(`CORS blocked: ${origin} not in whitelist. Current whitelist: ${whitelist.join(', ')}`);
          callback(new Error(`CORS error: ${origin} is not allowed by CORS`));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  app.use(cors(corsOptions));

  // Middlewares
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // Diagnostic middleware for production (do not log request bodies)
  if (NODE_ENV === "production") {
    app.use((req, res, next) => {
      logger.info(`🔍 [${req.method}] ${req.url}`, {
        headers: {
          "content-type": req.headers["content-type"],
          "content-length": req.headers["content-length"],
        },
      });
      next();
    });
  }

  // Compression for responses larger than 1KB
  app.use(
    compression({
      threshold: 1024,
    }),
  );

  // Security headers with a robust CSP
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "blob:", "https://api.dicebear.com"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: null,
        },
      },
    }),
  );

  // Apply rate limiting middleware (skip in test environment)
  if (NODE_ENV !== "test") {
    app.use(limiter);
  }

  // Health check endpoint (Hidden at root, explicit at /api/health)
  app.get("/api/health", (req, res) => {
    res.json({
      message: "Interview Trainer AI Backend is running.",
      version: "v1",
      status: "healthy",
    });
  });

  // Simple ping to verify Node.js is receiving requests
  app.get("/api/ping", (req, res) => {
    logger.info("🏓 PING received! Node.js is handling this request.");
    res.json({ pong: true, timestamp: new Date().toISOString() });
  });

  // POST test to verify POST requests work
  app.post("/api/ping-post", (req, res) => {
    // Avoid logging request body in production
    logger.info("🏓 POST PING received!");
    res.json({
      pong: true,
      method: "POST",
      body: req.body,
      timestamp: new Date().toISOString(),
    });
  });

  // Raw POST test - no middleware at all
  app.post("/api/debug/raw-post", (req, res) => {
    logger.info("📬 Raw POST received!", {
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
    });
    res.json({
      received: true,
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
    });
  });

  // Health check endpoint at root (only for JSON requests)
  app.get("/", (req, res, next) => {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json({
        status: "healthy",
        message: "Interview Prep AI Backend is running.",
      });
    }
    next();
  });

  // API Routes (keeping /api prefix for consistency with frontend)
  app.use("/api/auth", authRoutes);
  app.use("/api/sessions", sessionRoutes);
  app.use("/api/questions", questionRoutes);
  app.use("/api/ai/generate-questions", protect, generateInterviewQuestions);
  app.use("/api/ai/generate-explanation", protect, generateConceptExplanation);

  // Serve static files from React frontend in production
  if (NODE_ENV === "production") {
    // Try multiple possible locations for the frontend dist
    const possibleDistPaths = [
      path.resolve(__dirname, "../../frontend/interview-prep-ai/dist"),
      path.resolve(__dirname, "../frontend/interview-prep-ai/dist"),
      path.resolve(process.cwd(), "frontend/interview-prep-ai/dist"),
      path.resolve(process.cwd(), "../frontend/interview-prep-ai/dist"),
      path.resolve(process.cwd(), "dist"), // If uploaded directly inside backend/dist
    ];

    let frontendDistPath = possibleDistPaths[0];
    for (const p of possibleDistPaths) {
      if (fs.existsSync(path.join(p, "index.html"))) {
        frontendDistPath = p;
        logger.info(`✨ Found frontend index.html at: ${p}`);
        break;
      }
    }

    logger.info(`📁 Serving frontend from: ${frontendDistPath}`);

    // IMPORTANT: Skip static serving for API routes to prevent HTML fallback
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        logger.info(
          `🔀 API route detected, skipping static: ${req.method} ${req.originalUrl}`,
        );
        return next();
      }
      // For non-API routes, use static serving
      express.static(frontendDistPath)(req, res, next);
    });

    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();

      const indexPath = path.join(frontendDistPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        logger.error(
          `❌ index.html not found even after discovery: ${indexPath}`,
        );
        res.status(500).json({
          message: "Frontend files not found. Check path resolution.",
          attemptedPath: indexPath,
        });
      }
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
      // Do not log request bodies or other potentially sensitive payloads in production
      const meta: any = {
        url: req.url,
        method: req.method,
      };
      if (NODE_ENV === "development") {
        meta.stack = err.stack;
      }

      logger.error("❌ Unhandled error", { error: err.message, ...meta });

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
