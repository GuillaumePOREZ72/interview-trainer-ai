/**
 * Mock Interview Routes
 * API endpoints for mock interview sessions
 */

import { Router, Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import {
  startInterview,
  submitAnswer,
  getAnalysisStream,
  completeInterview,
  getSession,
  getHistory,
} from "../controllers/mockInterviewController";
import { protect } from "../middlewares/authMiddleware";
import { uploadAudio, handleUploadError } from "../middlewares/uploadMiddleware";

const router: Router = Router();

// Validation error handler middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation middleware
const validateSessionId = param("sessionId")
  .isMongoId()
  .withMessage("Invalid session ID");

// POST /api/mock-interview/start
router.post(
  "/start",
  protect,
  [
    body("role")
      .trim()
      .notEmpty()
      .withMessage("Role is required")
      .isLength({ max: 100 })
      .withMessage("Role must be at most 100 characters"),
    body("experience")
      .notEmpty()
      .withMessage("Experience is required")
      .isInt({ min: 0, max: 50 })
      .withMessage("Experience must be a number between 0 and 50 years"),
    body("topicsToFocus")
      .isArray({ min: 1, max: 10 })
      .withMessage("topicsToFocus must be an array with 1-10 items"),
    body("topicsToFocus.*")
      .trim()
      .notEmpty()
      .withMessage("Each topic must be a non-empty string"),
    body("language")
      .optional()
      .isIn(["fr", "en"])
      .withMessage("Language must be 'fr' or 'en'"),
  ],
  handleValidationErrors,
  startInterview
);

// POST /api/mock-interview/:sessionId/answer
router.post(
  "/:sessionId/answer",
  protect,
  validateSessionId,
  uploadAudio,
  handleUploadError,
  [
    body("transcript")
      .optional()
      .trim()
      .isLength({ max: 50000 })
      .withMessage("Transcript must be at most 50000 characters"),
  ],
  submitAnswer
);

// GET /api/mock-interview/:sessionId/stream
router.get(
  "/:sessionId/stream",
  protect,
  validateSessionId,
  getAnalysisStream
);

// POST /api/mock-interview/:sessionId/complete
router.post(
  "/:sessionId/complete",
  protect,
  validateSessionId,
  completeInterview
);

// GET /api/mock-interview/:sessionId
router.get(
  "/:sessionId",
  protect,
  validateSessionId,
  getSession
);

// GET /api/mock-interview/history
router.get(
  "/history",
  protect,
  getHistory
);

export default router;
