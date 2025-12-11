import Question from "../models/Question";
import Session from "../models/Session";
import { Request, Response } from "express";
import { logger } from "../config/logger";

interface AddQuestionsRequest extends Request {
  body: {
    sessionId: string;
    questions: Array<{ question: string; answer: string }>;
  };
}

// Add additional questions to an existing session
export const addQuestionsToSession = async (
  req: AddQuestionsRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionId, questions } = req.body;

    if (!sessionId || !questions || !Array.isArray(questions)) {
      logger.warn(
        `Invalid input data for adding questions - Session: ${sessionId}`
      );
      res.status(400).json({ message: "Invalid input data" });
      return;
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      logger.warn(`Add questions - Session not found: ${sessionId}`);
      res.status(404).json({ message: "Session not found" });
      return;
    }

    const createdQuestions = await Question.insertMany(
      questions.map((q) => ({
        session: sessionId,
        question: q.question,
        answer: q.answer,
      }))
    );

    session.questions.push(...createdQuestions.map((q) => q._id));
    await session.save();

    logger.info(
      `➕ ${createdQuestions.length} questions added to session: ${sessionId}`
    );

    res.status(201).json(createdQuestions);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Add questions error: ${errorMessage}`);
    res.status(500).json({ message: "Server Error" });
  }
};

// Pin or unpin a question
export const togglePinQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      logger.warn(`Toggle pin - Question not found: ${req.params.id}`);
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    question.isPinned = !question.isPinned;
    await question.save();

    logger.info(
      `📌 Question ${question.isPinned ? "pinned" : "unpinned"}: ${
        req.params.id
      }`
    );

    res.status(200).json({ success: true, question });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Toggle pin error: ${errorMessage}`);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update a note for a question
export const updateQuestionNote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { note } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      logger.warn(`Update note - Question not found: ${req.params.id}`);
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    question.note = note || "";
    await question.save();

    logger.info(
      `📝 Note updated for question: ${req.params.id} - Length: ${
        note?.length || 0
      } chars`
    );

    res.status(200).json({ success: true, question });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Update note error: ${errorMessage}`);
    res.status(500).json({ message: "Server Error" });
  }
};
