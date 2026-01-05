import Session from "../models/Session";
import Question from "../models/Question";
import { Request, Response } from "express";
import { logger } from "../config/logger";

interface CreateSessionRequest extends Request {
  body: {
    role: string;
    experience: string;
    topicsToFocus: string;
    description?: string;
    questions: Array<{ question: string; answer: string }>;
  };
}

// Create a new session and linked questions
export const createSession = async (
  req: CreateSessionRequest,
  res: Response
): Promise<void> => {
  try {
    const { role, experience, topicsToFocus, description, questions } =
      req.body;
    const userId = req.user?._id;
    const language = req.headers["accept-language"]
      ?.split(",")[0]
      ?.startsWith("fr")
      ? "fr"
      : "en";

    const session = await Session.create({
      user: userId,
      role,
      experience,
      topicsToFocus,
      description,
      language,
    });

    const questionDocs = await Promise.all(
      questions.map(async (q) => {
        const question = await Question.create({
          session: session._id,
          question: q.question,
          answer: q.answer,
        });
        return question._id;
      })
    );

    session.questions = questionDocs;
    await session.save();

    logger.info(
      `✅ Session created: ${session._id} - Role: ${role} - User: ${userId} - Questions: ${questions.length}`
    );

    res.status(201).json({ success: true, session });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Session creation error: ${errorMessage}`);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get all sessions for the logged-in user
export const getMySessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sessions = await Session.find({ user: req.user?._id })
      .sort({
        createdAt: -1,
      })
      .populate("questions");

    logger.info(`📋 User ${req.user?._id} fetched ${sessions.length} sessions`);

    res.status(200).json(sessions);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Get sessions error: ${errorMessage}`);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get a session by ID with populated questions
export const getSessionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const session = await Session.findById(req.params.id)
      .populate({
        path: "questions",
        options: { sort: { isPinned: -1, createdAt: 1 } },
      })
      .exec();

    if (!session) {
      logger.warn(`Session not found: ${req.params.id}`);
      res.status(404).json({ success: false, message: "Session not found" });
      return;
    }

    logger.info(`📖 Session fetched: ${session._id} - User: ${req.user?._id}`);

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Get session by ID error: ${errorMessage}`);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete a session and its questions
export const deleteSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      logger.warn(`Delete attempt - Session not found: ${req.params.id}`);
      res.status(404).json({
        message: "Session not found",
      });
      return;
    }

    // Check if the logged-in user owns this session
    if (session.user.toString() !== req.user?._id?.toString()) {
      logger.warn(
        `Unauthorized delete attempt - Session: ${req.params.id} - User: ${req.user?._id}`
      );
      res
        .status(401)
        .json({ message: "Not authorized to delete this session" });
      return;
    }

    // First, delete all the linked questions of the session
    await Question.deleteMany({ session: session._id });

    // Then, delete the session
    await Session.deleteOne({ _id: req.params.id });

    logger.info(
      `🗑️ Session deleted: ${req.params.id} - User: ${req.user?._id}`
    );

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Delete session error: ${errorMessage}`);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
