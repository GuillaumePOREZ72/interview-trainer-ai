import Session from "../models/Session";
import { Request, Response } from "express";
import { logger } from "../config/logger";
import SessionService from "../services/SessionService";

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
  res: Response,
): Promise<void> => {
  try {
    const { role, experience, topicsToFocus, description, questions } =
      req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const language = req.headers["accept-language"]
      ?.split(",")[0]
      ?.startsWith("fr")
      ? "fr"
      : "en";

    const session = await SessionService.createSession({
      user: userId.toString(),
      role,
      experience,
      topicsToFocus,
      description,
      language,
      questions,
    });

    logger.info(`✅ Session created: ${session._id} - User: ${userId}`);
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
  res: Response,
): Promise<void> => {
  try {
    const sessions = await Session.find({ user: req.user?._id })
      .sort({ createdAt: -1 })
      .populate("questions");

    logger.info(`📋 User ${req.user?._id} fetched ${sessions.length} sessions`);
    res.status(200).json(sessions);
  } catch (error) {
    logger.error(
      `Get sessions error: ${error instanceof Error ? error.message : "Server Error"}`,
    );
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get a session by ID
export const getSessionById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user?._id,
    })
      .populate({
        path: "questions",
        options: { sort: { isPinned: -1, createdAt: 1 } },
      })
      .exec();

    if (!session) {
      res.status(404).json({ success: false, message: "Session not found" });
      return;
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete a session
export const deleteSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await SessionService.deleteSession(req.params.id, userId.toString());

    logger.info(`🗑️ Session deleted: ${req.params.id} - User: ${userId}`);
    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server Error";
    logger.error(`Delete session error: ${errorMessage}`);
    const status = errorMessage.includes("not found")
      ? 404
      : errorMessage.includes("authorized")
        ? 401
        : 500;
    res.status(status).json({ message: errorMessage });
  }
};
