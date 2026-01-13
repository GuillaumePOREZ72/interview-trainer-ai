"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = require("express-rate-limit");
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60000, // 1 minute
    limit: 60, // 60 requests per minute
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        error: "You have sent too many requests in a given amount of time. Please try again later.",
    },
    skip: (req) => {
        // Skip rate limiting for health check endpoint
        return req.path === "/";
    },
});
exports.default = limiter;
