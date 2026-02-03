import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Validation et sanitization des entrées pour les endpoints AI
 * Protection contre XSS et injection de prompts
 */

export const validateGenerateQuestions = [
  body("role")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Role must be between 1 and 100 characters")
    .escape() // Sanitization XSS - convertit <, >, &, ', " en entités HTML
    .custom((value) => {
      // Rejeter les tentatives d'injection de prompts
      const suspiciousPatterns = [
        /ignore\s+previous/i,
        /disregard\s+above/i,
        /system\s*:/i,
        /you\s+are\s+now/i,
        /act\s+as\s+/i,
        /DAN\s*:/i,
        /developer\s+mode/i,
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          throw new Error("Invalid input detected");
        }
      }
      return true;
    }),

  body("experience")
    .isIn(["junior", "mid", "senior", "lead", "Junior", "Mid", "Senior", "Lead"])
    .withMessage("Experience must be one of: junior, mid, senior, lead"),

  body("topicsToFocus")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Topics must be between 1 and 500 characters")
    .escape()
    .custom((value) => {
      // Vérifier les tentatives d'injection
      const suspiciousPatterns = [
        /ignore\s+previous/i,
        /disregard\s+above/i,
        /system\s*:/i,
        /you\s+are\s+now/i,
        /act\s+as\s+/i,
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          throw new Error("Invalid input detected");
        }
      }
      return true;
    }),

  body("numberOfQuestions")
    .isInt({ min: 1, max: 20 })
    .withMessage("Number of questions must be between 1 and 20"),

  // Middleware de gestion des erreurs
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }
    next();
  },
];

export const validateGenerateExplanation = [
  body("question")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Question must be between 1 and 1000 characters")
    .escape()
    .custom((value) => {
      // Vérifier les tentatives d'injection
      const suspiciousPatterns = [
        /ignore\s+previous/i,
        /disregard\s+above/i,
        /system\s*:/i,
        /you\s+are\s+now/i,
        /act\s+as\s+/i,
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          throw new Error("Invalid input detected");
        }
      }
      return true;
    }),

  // Middleware de gestion des erreurs
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }
    next();
  },
];

export const validateVocalAnalysis = [
  body("questionId")
    .isMongoId()
    .withMessage("Invalid question ID"),

  body("transcript")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Transcript must be between 1 and 5000 characters")
    .escape(),

  body("language")
    .optional()
    .isIn(["en", "fr", "es", "de", "it", "pt"])
    .withMessage("Language must be one of: en, fr, es, de, it, pt"),

  // Middleware de gestion des erreurs
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }
    next();
  },
];
