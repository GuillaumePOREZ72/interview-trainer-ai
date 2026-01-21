import express, { Router, Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";
import upload from "../middlewares/uploadMiddleware";
import { logger } from "../config/logger";

const router: Router = express.Router();

// Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);
router.get("/profile", protect, getUserProfile);

router.post(
  "/upload-image",
  (req: Request, res: Response, next: NextFunction) => {
    logger.info("📤 Upload request received at /api/auth/upload-image");

    try {
      upload(req, res, (err: any) => {
        if (err) {
          logger.error("❌ Multer/Cloudinary upload error", {
            message: err.message,
            code: err.code,
            name: err.name,
            stack: err.stack,
          });

          return res.status(500).json({
            message: "Upload failed at storage level",
            error: err.message,
            code: err.code,
          });
        }

        if (!req.file) {
          logger.warn("⚠️  No file received by Multer");
          return res
            .status(400)
            .json({ message: "No file uploaded or invalid field name" });
        }

        logger.info("✅ File uploaded to Cloudinary successfully", {
          filename: req.file.filename,
          size: req.file.size,
        });

        // Pass to final handler
        next();
      });
    } catch (criticalErr: any) {
      logger.error("🔥 Critical error during upload initialization", {
        message: criticalErr.message,
        stack: criticalErr.stack,
      });
      res.status(500).json({ message: "Internal server error during upload" });
    }
  },
  (req: Request, res: Response) => {
    const imageUrl = req.file?.path;
    logger.info("📤 Sending upload response", { imageUrl });
    return res.status(200).json({ imageUrl });
  },
);

export default router;
