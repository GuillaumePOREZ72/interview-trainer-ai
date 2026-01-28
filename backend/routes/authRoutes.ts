import express, { Router } from "express";
import { body } from "express-validator";
import { rateLimit } from "express-rate-limit";
import {
  registerUser,
  loginUser,
  getUserProfile,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  logoutUser,
} from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";

const router: Router = express.Router();

// Strict rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per 15 minutes
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts. Try again later.",
  },
  skip: (req) => process.env.NODE_ENV === "test", // Skip in tests
});

// Auth Routes
router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  registerUser,
);

router.post(
  "/login",
  authLimiter,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password").exists().withMessage("Password is required"),
  ],
  loginUser,
);

router.post("/refresh-token", authLimiter, refreshAccessToken);

router.post(
  "/forgotpassword",
  authLimiter,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
  ],
  forgotPassword,
);

router.post("/logout", logoutUser);

router.put(
  "/resetpassword/:resetToken",
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  resetPassword,
);

router.get("/profile", protect, getUserProfile);

export default router;
