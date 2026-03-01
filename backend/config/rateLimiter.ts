import { rateLimit } from "express-rate-limit";
import { Request } from "express";
import { IUser } from "../models/User";

// Extend Request type locally for this file if needed,
// though usually it's better to rely on global type declarations if they exist.
// Assuming IUser is properly defined and linked in global types or imported.

const limiter = rateLimit({
  windowMs: 15000, // 15 seconds
  limit: 25, // 25 requests per 15 seconds
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
  skip: (req) => {
    if (req.originalUrl.startsWith("/api/auth/profile")) return true;
    if (req.originalUrl.startsWith("/api/auth/refresh-token")) return true;
    if (req.originalUrl.startsWith("/api/health")) return true;
    if (req.originalUrl.startsWith("/api/ping")) return true;
    return false;
  },
});

// Rate limit for vocal analysis to protect Groq API usage
// Limit: 5 requests per 15 minutes
export const vocalAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP/User to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise fallback to IP
    // Depending on how custom types are set up, we cast to any or check existing types
    const user = req.user as IUser | undefined;
    return user ? user._id.toString() : req.ip || "unknown";
  },
  message: {
    message:
      "Too many vocal analyses requests. Please try again in 15 minutes.",
  },
});

export default limiter;
