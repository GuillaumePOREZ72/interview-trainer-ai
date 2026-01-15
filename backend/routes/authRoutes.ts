import express, { Router, Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  refreshAccessToken,
} from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";
import upload from "../middlewares/uploadMiddleware";
import { logger } from "../config/logger";

const router: Router = express.Router();

// Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.get("/profile", protect, getUserProfile);

router.post(
  "/upload-image",
  (req: Request, res: Response, next: NextFunction) => {
    logger.info("📤 Upload request received", {
      method: req.method,
      url: req.url,
      headers: {
        "content-type": req.headers["content-type"],
        "content-length": req.headers["content-length"],
      },
    });

    upload.single("image")(req, res, (err) => {
      if (err) {
        logger.error("❌ Multer upload error", {
          error: err.message,
          code: (err as any).code,
          stack: err.stack,
          field: (err as any).field,
          storageErrors: (err as any).storageErrors,
        });

        if ((err as any).code === "LIMIT_FILE_SIZE") {
          res
            .status(413)
            .json({ message: "File too large. Maximum size is 5MB" });
          return;
        }
        if ((err as any).code === "LIMIT_UNEXPECTED_FILE") {
          res
            .status(400)
            .json({
              message: "Unexpected field name. Expected 'image'",
            });
          return;
        }

        res
          .status(500)
          .json({ message: "Upload failed", error: err.message });
        return;
      }
      logger.info("✅ Multer upload successful", {
        file: req.file ? {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path,
        } : "No file",
      });
      next();
    });
  },
  (req: Request, res: Response) => {
    if (!req.file) {
      logger.warn("⚠️  No file in request after multer processing");
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    logger.info("🎉 Image upload completed", {
      imageUrl,
      filename: req.file.filename,
    });

    res.status(200).json({ imageUrl });
  }
);

export default router;
