"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Use process.cwd() to get project root (works in both dev and production)
// This ensures uploads go to /backend/uploads regardless of where the compiled code runs
const uploadDir = path_1.default.join(process.cwd(), "uploads");
// Check and log upload directory status
const checkUploadDirectory = () => {
    console.log("📁 Upload directory:", uploadDir);
    console.log("📍 Process working directory:", process.cwd());
    if (!fs_1.default.existsSync(uploadDir)) {
        console.log("🔧 Creating uploads directory:", uploadDir);
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
    // Check write permissions
    try {
        fs_1.default.accessSync(uploadDir, fs_1.default.constants.W_OK);
        console.log("✅ Upload directory is writable");
    }
    catch (err) {
        console.error("❌ Upload directory is NOT writable:", err);
        console.error("   Directory permissions:", fs_1.default.statSync(uploadDir).mode.toString(8));
    }
};
checkUploadDirectory();
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        console.log("📦 Multer destination callback triggered", {
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadDir,
        });
        // Double-check directory exists at runtime
        if (!fs_1.default.existsSync(uploadDir)) {
            console.log("🔧 Creating uploads directory at runtime:", uploadDir);
            try {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
                console.log("✅ Upload directory created successfully");
            }
            catch (err) {
                console.error("❌ Failed to create upload directory:", err);
                cb(err, "");
                return;
            }
        }
        // Verify write permissions again at runtime
        try {
            fs_1.default.accessSync(uploadDir, fs_1.default.constants.W_OK);
            console.log("✅ Upload directory is writable");
            cb(null, uploadDir);
        }
        catch (err) {
            console.error("❌ Upload directory is NOT writable:", err);
            console.error("   Directory exists:", fs_1.default.existsSync(uploadDir));
            if (fs_1.default.existsSync(uploadDir)) {
                const stats = fs_1.default.statSync(uploadDir);
                console.error("   Directory stats:", {
                    isDirectory: stats.isDirectory(),
                    mode: stats.mode.toString(8),
                    uid: stats.uid,
                    gid: stats.gid,
                });
            }
            cb(new Error(`Cannot write to upload directory: ${err.message}`), "");
        }
    },
    filename: (req, file, cb) => {
        // Sanitize filename to avoid issues
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        const newFilename = `${Date.now()}-${sanitizedName}`;
        console.log("📝 Multer filename callback", {
            originalname: file.originalname,
            sanitizedName,
            newFilename,
        });
        cb(null, newFilename);
    },
});
// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    console.log("🔍 Multer fileFilter callback", {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fieldname: file.fieldname,
        allowedTypes,
    });
    if (allowedTypes.includes(file.mimetype)) {
        console.log("✅ File type accepted:", file.mimetype);
        cb(null, true);
    }
    else {
        console.log("❌ File type rejected:", file.mimetype);
        cb(new Error("Only .jpeg, .jpg and .png formats are allowed"));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});
exports.default = upload;
