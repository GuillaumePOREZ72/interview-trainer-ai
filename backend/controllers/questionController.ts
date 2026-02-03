import { Request, Response } from "express";
import { logger } from "../config/logger";
import SessionService from "../services/SessionService";
import Session from "../models/Session";
import Question from "../models/Question";

interface AddQuestionsRequest extends Request {
  body: {
    sessionId: string;
    questions: Array<{ question: string; answer: string }>;
  };
}

// Add additional questions to an existing session
export const addQuestionsToSession = async (
  req: AddQuestionsRequest,
  res: Response,
): Promise<void> => {
  try {
    const { sessionId, questions } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!sessionId || !questions || !Array.isArray(questions)) {
      res.status(400).json({ message: "Invalid input data" });
      return;
    }

    // Vérification de propriété : l'utilisateur doit posséder la session
    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      logger.warn(
        `Unauthorized attempt to add questions: User ${userId} tried to access session ${sessionId}`,
      );
      res.status(403).json({ message: "Not authorized to modify this session" });
      return;
    }

    const createdQuestions = await SessionService.addQuestionsToSession(
      sessionId,
      questions,
    );

    logger.info(
      `➕ ${createdQuestions.length} questions added to session: ${sessionId} by user: ${userId}`,
    );
    res.status(201).json(createdQuestions);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Add questions error: ${errorMessage}`);
    res
      .status(errorMessage.includes("found") ? 404 : 500)
      .json({ message: errorMessage });
  }
};

// Pin or unpin a question
export const togglePinQuestion = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Vérification de propriété : la question doit appartenir à une session de l'utilisateur
    const question = await Question.findById(req.params.id).populate({
      path: "session",
      match: { user: userId },
    });

    if (!question || !(question.session as any)) {
      logger.warn(
        `Unauthorized attempt to toggle pin: User ${userId} tried to access question ${req.params.id}`,
      );
      res.status(403).json({ message: "Not authorized to modify this question" });
      return;
    }

    const updatedQuestion = await SessionService.togglePinQuestion(req.params.id);

    logger.info(
      `📌 Question ${updatedQuestion.isPinned ? "pinned" : "unpinned"}: ${req.params.id} by user: ${userId}`,
    );
    res.status(200).json({ success: true, question: updatedQuestion });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Toggle pin error: ${errorMessage}`);
    res
      .status(errorMessage.includes("found") ? 404 : 500)
      .json({ message: errorMessage });
  }
};

// Update a note for a question
export const updateQuestionNote = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { note } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Vérification de propriété : la question doit appartenir à une session de l'utilisateur
    const question = await Question.findById(req.params.id).populate({
      path: "session",
      match: { user: userId },
    });

    if (!question || !(question.session as any)) {
      logger.warn(
        `Unauthorized attempt to update note: User ${userId} tried to access question ${req.params.id}`,
      );
      res.status(403).json({ message: "Not authorized to modify this question" });
      return;
    }

    const updatedQuestion = await SessionService.updateQuestionNote(
      req.params.id,
      note,
    );

    logger.info(`📝 Note updated for question: ${req.params.id} by user: ${userId}`);
    res.status(200).json({ success: true, question: updatedQuestion });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Update note error: ${errorMessage}`);
    res
      .status(errorMessage.includes("found") ? 404 : 500)
      .json({ message: errorMessage });
  }
};
