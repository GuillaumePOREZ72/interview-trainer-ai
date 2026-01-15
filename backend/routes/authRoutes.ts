import express, { Router, Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  refreshAccessToken,
} from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";
import upload from "../middlewares/uploadMiddleware";

const router: Router = express.Router();

// Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.get("/profile", protect, getUserProfile);

router.post(
  "/upload-image",
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        res.status(500).json({ message: "Upload failed", error: err.message });
        return;
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;
    res.status(200).json({ imageUrl });
  }
);

export default router;
