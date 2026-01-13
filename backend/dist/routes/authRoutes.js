"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = __importDefault(require("../middlewares/uploadMiddleware"));
const router = express_1.default.Router();
// Auth Routes
router.post("/register", authController_1.registerUser);
router.post("/login", authController_1.loginUser);
router.post("/refresh-token", authController_1.refreshAccessToken);
router.get("/profile", authMiddleware_1.protect, authController_1.getUserProfile);
router.post("/upload-image", uploadMiddleware_1.default.single("image"), (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
    }
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
});
exports.default = router;
