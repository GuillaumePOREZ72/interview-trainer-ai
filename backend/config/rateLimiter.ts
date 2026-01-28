import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 60000, // 1 minute
  limit: 300, // 300 requests per minute
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error:
      "Too many requests. Please try again later.",
  },
  skip: (req) => {
    if (req.originalUrl.startsWith("/api/auth/profile")) return true;
    if (req.originalUrl.startsWith("/api/auth/refresh-token")) return true; // optionnel, mais évite des cascades
    if (req.originalUrl.startsWith("/api/health")) return true;
    if (req.originalUrl.startsWith("/api/ping")) return true;
    return false;
  },
});

export default limiter;
