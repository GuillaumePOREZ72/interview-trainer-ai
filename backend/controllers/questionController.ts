import { Request, Response } from "express";
import { logger } from "../config/logger";
import SessionService from "../services/SessionService";

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

    if (!sessionId || !questions || !Array.isArray(questions)) {
      res.status(400).json({ message: "Invalid input data" });
      return;
    }

    const createdQuestions = await SessionService.addQuestionsToSession(
      sessionId,
      questions,
    );

    logger.info(
      `➕ ${createdQuestions.length} questions added to session: ${sessionId}`,
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
    const question = await SessionService.togglePinQuestion(req.params.id);

    logger.info(
      `📌 Question ${question.isPinned ? "pinned" : "unpinned"}: ${req.params.id}`,
    );
    res.status(200).json({ success: true, question });
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
    const question = await SessionService.updateQuestionNote(
      req.params.id,
      note,
    );

    logger.info(`📝 Note updated for question: ${req.params.id}`);
    res.status(200).json({ success: true, question });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Update note error: ${errorMessage}`);
    res
      .status(errorMessage.includes("found") ? 404 : 500)
      .json({ message: errorMessage });
  }
};
