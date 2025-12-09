import Question from "../models/Question.js";
import Session from "../models/Session.js";
import { Request, Response } from "express";

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
      res.status(400).json({ message: "Invalid input data" });
      return;
    }

    const session = await Session.findById(sessionId);

    if (!session) {
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

    res.status(201).json(createdQuestions);
  } catch (error) {
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
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    question.isPinned = !question.isPinned;
    await question.save();

    res.status(200).json({ success: true, question });
  } catch (error) {
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
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    question.note = note || "";
    await question.save();

    res.status(200).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
