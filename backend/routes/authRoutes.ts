import express, { Router } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";

const router: Router = express.Router();

// Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);
router.get("/profile", protect, getUserProfile);

export default router;
