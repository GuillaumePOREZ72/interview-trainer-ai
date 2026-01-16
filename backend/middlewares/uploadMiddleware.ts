import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import path from "path";
import fs from "fs";

// __dirname is available natively in CommonJS
const __dirname = path.dirname(__filename);

// Use path to get the uploads directory in the backend root
const uploadDir = path.join(__dirname, "..", "uploads");

// Check and log upload directory status
const checkUploadDirectory = () => {
  console.log("📁 Upload directory:", uploadDir);
  console.log("📍 Process working directory:", process.cwd());

  if (!fs.existsSync(uploadDir)) {
    console.log("🔧 Creating uploads directory:", uploadDir);
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Check write permissions
  try {
    fs.accessSync(uploadDir, fs.constants.W_OK);
    console.log("✅ Upload directory is writable");
  } catch (err) {
    console.error("❌ Upload directory is NOT writable:", err);
    console.error("   Directory permissions:", fs.statSync(uploadDir).mode.toString(8));
  }
};

checkUploadDirectory();

// Configure storage
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    console.log("📦 Multer destination callback triggered", {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadDir,
    });

    // Double-check directory exists at runtime
    if (!fs.existsSync(uploadDir)) {
      console.log("🔧 Creating uploads directory at runtime:", uploadDir);
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log("✅ Upload directory created successfully");
      } catch (err) {
        console.error("❌ Failed to create upload directory:", err);
        cb(err as Error, "");
        return;
      }
    }

    // Verify write permissions again at runtime
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log("✅ Upload directory is writable");
      cb(null, uploadDir);
    } catch (err) {
      console.error("❌ Upload directory is NOT writable:", err);
      console.error("   Directory exists:", fs.existsSync(uploadDir));
      if (fs.existsSync(uploadDir)) {
        const stats = fs.statSync(uploadDir);
        console.error("   Directory stats:", {
          isDirectory: stats.isDirectory(),
          mode: stats.mode.toString(8),
          uid: stats.uid,
          gid: stats.gid,
        });
      }
      cb(new Error(`Cannot write to upload directory: ${(err as Error).message}`), "");
    }
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
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
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
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
  } else {
    console.log("❌ File type rejected:", file.mimetype);
    cb(new Error("Only .jpeg, .jpg and .png formats are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export default upload;
