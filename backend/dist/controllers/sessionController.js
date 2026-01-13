"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSession = exports.getSessionById = exports.getMySessions = exports.createSession = void 0;
const Session_1 = __importDefault(require("../models/Session"));
const Question_1 = __importDefault(require("../models/Question"));
const logger_1 = require("../config/logger");
// Create a new session and linked questions
const createSession = async (req, res) => {
    try {
        const { role, experience, topicsToFocus, description, questions } = req.body;
        const userId = req.user?._id;
        const language = req.headers["accept-language"]
            ?.split(",")[0]
            ?.startsWith("fr")
            ? "fr"
            : "en";
        const session = await Session_1.default.create({
            user: userId,
            role,
            experience,
            topicsToFocus,
            description,
            language,
        });
        const questionDocs = await Promise.all(questions.map(async (q) => {
            const question = await Question_1.default.create({
                session: session._id,
                question: q.question,
                answer: q.answer,
            });
            return question._id;
        }));
        session.questions = questionDocs;
        await session.save();
        logger_1.logger.info(`✅ Session created: ${session._id} - Role: ${role} - User: ${userId} - Questions: ${questions.length}`);
        res.status(201).json({ success: true, session });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Server Error";
        logger_1.logger.error(`Session creation error: ${errorMessage}`);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.createSession = createSession;
// Get all sessions for the logged-in user
const getMySessions = async (req, res) => {
    try {
        const sessions = await Session_1.default.find({ user: req.user?._id })
            .sort({
            createdAt: -1,
        })
            .populate("questions");
        logger_1.logger.info(`📋 User ${req.user?._id} fetched ${sessions.length} sessions`);
        res.status(200).json(sessions);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Server Error";
        logger_1.logger.error(`Get sessions error: ${errorMessage}`);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.getMySessions = getMySessions;
// Get a session by ID with populated questions
const getSessionById = async (req, res) => {
    try {
        const session = await Session_1.default.findById(req.params.id)
            .populate({
            path: "questions",
            options: { sort: { isPinned: -1, createdAt: 1 } },
        })
            .exec();
        if (!session) {
            logger_1.logger.warn(`Session not found: ${req.params.id}`);
            res.status(404).json({ success: false, message: "Session not found" });
            return;
        }
        logger_1.logger.info(`📖 Session fetched: ${session._id} - User: ${req.user?._id}`);
        res.status(200).json({
            success: true,
            session,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Server Error";
        logger_1.logger.error(`Get session by ID error: ${errorMessage}`);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.getSessionById = getSessionById;
// Delete a session and its questions
const deleteSession = async (req, res) => {
    try {
        const session = await Session_1.default.findById(req.params.id);
        if (!session) {
            logger_1.logger.warn(`Delete attempt - Session not found: ${req.params.id}`);
            res.status(404).json({
                message: "Session not found",
            });
            return;
        }
        // Check if the logged-in user owns this session
        if (session.user.toString() !== req.user?._id?.toString()) {
            logger_1.logger.warn(`Unauthorized delete attempt - Session: ${req.params.id} - User: ${req.user?._id}`);
            res
                .status(401)
                .json({ message: "Not authorized to delete this session" });
            return;
        }
        // First, delete all the linked questions of the session
        await Question_1.default.deleteMany({ session: session._id });
        // Then, delete the session
        await Session_1.default.deleteOne({ _id: req.params.id });
        logger_1.logger.info(`🗑️ Session deleted: ${req.params.id} - User: ${req.user?._id}`);
        res.status(200).json({ message: "Session deleted successfully" });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Server Error";
        logger_1.logger.error(`Delete session error: ${errorMessage}`);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.deleteSession = deleteSession;
