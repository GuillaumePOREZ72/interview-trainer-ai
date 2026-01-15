"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = __importDefault(require("../middlewares/uploadMiddleware"));
const logger_1 = require("../config/logger");
const router = express_1.default.Router();
// Auth Routes
router.post("/register", authController_1.registerUser);
router.post("/login", authController_1.loginUser);
router.post("/refresh-token", authController_1.refreshAccessToken);
router.get("/profile", authMiddleware_1.protect, authController_1.getUserProfile);
router.post("/upload-image", (req, res, next) => {
    logger_1.logger.info("📤 Upload request received", {
        method: req.method,
        url: req.url,
        headers: {
            "content-type": req.headers["content-type"],
            "content-length": req.headers["content-length"],
        },
    });
    uploadMiddleware_1.default.single("image")(req, res, (err) => {
        if (err) {
            logger_1.logger.error("❌ Multer upload error", {
                error: err.message,
                code: err.code,
                stack: err.stack,
                field: err.field,
                storageErrors: err.storageErrors,
            });
            if (err.code === "LIMIT_FILE_SIZE") {
                res
                    .status(413)
                    .json({ message: "File too large. Maximum size is 5MB" });
                return;
            }
            if (err.code === "LIMIT_UNEXPECTED_FILE") {
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
        logger_1.logger.info("✅ Multer upload successful", {
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
}, (req, res) => {
    if (!req.file) {
        logger_1.logger.warn("⚠️  No file in request after multer processing");
        res.status(400).json({ message: "No file uploaded" });
        return;
    }
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    logger_1.logger.info("🎉 Image upload completed", {
        imageUrl,
        filename: req.file.filename,
    });
    res.status(200).json({ imageUrl });
});
exports.default = router;
