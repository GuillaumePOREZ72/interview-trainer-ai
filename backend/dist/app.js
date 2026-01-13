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
exports.createApp = void 0;
/**
 * Express App Configuration
 * Separated from server.ts to allow testing with supertest
 */
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("./config/logger");
const rateLimiter_1 = __importDefault(require("./config/rateLimiter"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const sessionRoutes_1 = __importDefault(require("./routes/sessionRoutes"));
const questionRoutes_1 = __importDefault(require("./routes/questionRoutes"));
const authMiddleware_1 = require("./middlewares/authMiddleware");
const aiController_1 = require("./controllers/aiController");
/**
 * Constants
 */
const NODE_ENV = process.env.NODE_ENV || "development";
/**
 * Create and configure Express app
 */
const createApp = () => {
    const app = (0, express_1.default)();
    // Trust proxy for rate limiting in production (o2switch/reverse proxies)
    if (NODE_ENV === "production") {
        app.set("trust proxy", 1);
    }
    // CORS configuration
    const corsOptions = {
        origin(origin, callback) {
            if (NODE_ENV === "development" || NODE_ENV === "test" || !origin) {
                callback(null, true);
            }
            else {
                const whitelist = process.env.WHITELIST_ORIGINS?.split(",") || [];
                if (whitelist.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error(`CORS error: ${origin} is not allowed by CORS`));
                    logger_1.logger.warn(`CORS error: ${origin} is not allowed by CORS`);
                }
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    };
    app.use((0, cors_1.default)(corsOptions));
    // Middlewares
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    // Compression for responses larger than 1KB
    app.use((0, compression_1.default)({
        threshold: 1024,
    }));
    // Security headers with relaxed CSP for development/test
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: NODE_ENV === "production" ? undefined : false,
    }));
    // Apply rate limiting middleware (skip in test environment)
    if (NODE_ENV !== "test") {
        app.use(rateLimiter_1.default);
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
    app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "uploads")));
    // API Routes (keeping /api prefix for consistency with frontend)
    app.use("/api/auth", authRoutes_1.default);
    app.use("/api/sessions", sessionRoutes_1.default);
    app.use("/api/questions", questionRoutes_1.default);
    app.use("/api/ai/generate-questions", authMiddleware_1.protect, aiController_1.generateInterviewQuestions);
    app.use("/api/ai/generate-explanation", authMiddleware_1.protect, aiController_1.generateConceptExplanation);
    return app;
};
exports.createApp = createApp;
// Export a default instance for backward compatibility
const app = (0, exports.createApp)();
exports.default = app;
