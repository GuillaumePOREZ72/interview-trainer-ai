import { Request, Response, NextFunction } from "express";
import Session from "../models/Session";
import Question from "../models/Question";
import { logger } from "../config/logger";

/**
 * Middleware de vérification de propriété des ressources
 * S'assure que l'utilisateur authentifié est bien le propriétaire de la ressource demandée
 */

export const verifySessionOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id || req.body.sessionId;
    const userId = req.user?._id;

    if (!sessionId) {
      res.status(400).json({ message: "Session ID required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const session = await Session.findOne({ _id: sessionId, user: userId });
    
    if (!session) {
      logger.warn(
        `Ownership check failed: User ${userId} attempted to access session ${sessionId}`
      );
      res.status(403).json({ message: "Not authorized to access this session" });
      return;
    }

    // Attacher la session à la requête pour usage ultérieur
    (req as any).ownedSession = session;
    next();
  } catch (error) {
    logger.error(`Ownership verification error: ${error}`);
    res.status(500).json({ message: "Server Error" });
  }
};

export const verifyQuestionOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const questionId = req.params.id;
    const userId = req.user?._id;

    if (!questionId) {
      res.status(400).json({ message: "Question ID required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const question = await Question.findById(questionId).populate({
      path: "session",
      match: { user: userId }
    });

    if (!question || !(question.session as any)) {
      logger.warn(
        `Ownership check failed: User ${userId} attempted to access question ${questionId}`
      );
      res.status(403).json({ message: "Not authorized to access this question" });
      return;
    }

    (req as any).ownedQuestion = question;
    next();
  } catch (error) {
    logger.error(`Question ownership verification error: ${error}`);
    res.status(500).json({ message: "Server Error" });
  }
};
