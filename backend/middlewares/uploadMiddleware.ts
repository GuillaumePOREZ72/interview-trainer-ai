/**
 * Audio Upload Middleware
 * Handles multipart/form-data uploads for user audio responses
 * Uses Multer with file validation and size limits
 */

import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../config/logger";

// Configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_AUDIO_FILE_SIZE || "5242880", 10); // 5MB default
const TEMP_DIR = process.env.AUDIO_TEMP_DIR || "uploads/audio/temp";

// Allowed MIME types for audio
const ALLOWED_MIME_TYPES = [
  "audio/mpeg",     // MP3
  "audio/wav",      // WAV
  "audio/webm",     // WebM (from browser MediaRecorder)
  "audio/ogg",      // OGG
  "audio/mp4",      // M4A
  "audio/x-m4a",    // M4A alternative
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".webm", ".ogg", ".m4a", ".mp4"];

/**
 * Multer storage configuration
 * Saves files to temp directory with unique names
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid + original extension
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter - validates MIME type and extension
 */
const fileFilter: multer.Options["fileFilter"] = (
  req,
  file,
  cb
) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.warn(`Upload rejected: Invalid MIME type ${file.mimetype}`);
    cb(
      new Error(
        `Invalid audio format. Allowed: MP3, WAV, WEBM, OGG, M4A. Received: ${file.mimetype}`
      )
    );
    return;
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    logger.warn(`Upload rejected: Invalid extension ${ext}`);
    cb(
      new Error(
        `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
      )
    );
    return;
  }

  // Accept file
  cb(null, true);
};

/**
 * Multer upload instance
 * Configured with storage, file filter, and size limits
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB max
    files: 1, // Only 1 file per request
  },
});

/**
 * Middleware for single audio file upload
 * Usage: router.post('/answer', uploadAudio, controller)
 * 
 * After this middleware:
 * - req.file contains the uploaded file info
 * - req.body contains other form fields
 */
export const uploadAudio = upload.single("audio");

/**
 * Error handling middleware for multer errors
 * Catches and formats multer-specific errors
 */
export const handleUploadError = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        logger.warn(`Upload rejected: File too large`);
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        });

      case "LIMIT_UNEXPECTED_FILE":
        logger.warn(`Upload rejected: Unexpected file field`);
        return res.status(400).json({
          success: false,
          message: "Unexpected file field. Use field name 'audio'",
        });

      case "LIMIT_FILE_COUNT":
        logger.warn(`Upload rejected: Too many files`);
        return res.status(400).json({
          success: false,
          message: "Too many files. Only 1 file allowed per request",
        });

      default:
        logger.error(`Upload error: ${err.message}`);
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
    }
  }

  // Other errors (including our custom fileFilter errors)
  if (err instanceof Error) {
    logger.error(`Upload error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    logger.error(`Upload error: ${String(err)}`);
    return res.status(400).json({
      success: false,
      message: String(err),
    });
  }

  // No error, continue
  next();
};

/**
 * Delete uploaded file (cleanup on error)
 * 
 * @param filePath - Path to the file to delete
 */
export const deleteUploadedFile = (filePath: string): void => {
  try {
    if (filePath && require("fs").existsSync(filePath)) {
      require("fs").unlinkSync(filePath);
      logger.info(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Failed to delete file ${filePath}: ${error}`);
  }
};
