import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 60000, // 1 minute
  limit: 60, // 60 requests per minute
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error:
      "You have sent too many requests in a given amount of time. Please try again later.",
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === "/";
  },
});

export default limiter;
