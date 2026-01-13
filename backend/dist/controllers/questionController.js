"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuestionNote = exports.togglePinQuestion = exports.addQuestionsToSession = void 0;
const Question_1 = __importDefault(require("../models/Question"));
const Session_1 = __importDefault(require("../models/Session"));
const logger_1 = require("../config/logger");
// Add additional questions to an existing session
const addQuestionsToSession = async (req, res) => {
    try {
        const { sessionId, questions } = req.body;
        if (!sessionId || !questions || !Array.isArray(questions)) {
            logger_1.logger.warn(`Invalid input data for adding questions - Session: ${sessionId}`);
            res.status(400).json({ message: "Invalid input data" });
            return;
        }
        const session = await Session_1.default.findById(sessionId);
        if (!session) {
            logger_1.logger.warn(`Add questions - Session not found: ${sessionId}`);
            res.status(404).json({ message: "Session not found" });
            return;
        }
        const createdQuestions = await Question_1.default.insertMany(questions.map((q) => ({
            session: sessionId,
            question: q.question,
            answer: q.answer,
        })));
        session.questions.push(...createdQuestions.map((q) => q._id));
        await session.save();
        logger_1.logger.info(`➕ ${createdQuestions.length} questions added to session: ${sessionId}`);
        res.status(201).json(createdQuestions);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Server Error";
        logger_1.logger.error(`Add questions error: ${errorMessage}`);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.addQuestionsToSession = addQuestionsToSession;
// Pin or unpin a question
const togglePinQuestion = async (req, res) => {
    try {
        const question = await Question_1.default.findById(req.params.id);
        if (!question) {
            logger_1.logger.warn(`Toggle pin - Question not found: ${req.params.id}`);
            res.status(404).json({ success: false, message: "Question not found" });
            return;
        }
        question.isPinned = !question.isPinned;
        await question.save();
        logger_1.logger.info(`📌 Question ${question.isPinned ? "pinned" : "unpinned"}: ${req.params.id}`);
        res.status(200).json({ success: true, question });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Server Error";
        logger_1.logger.error(`Toggle pin error: ${errorMessage}`);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.togglePinQuestion = togglePinQuestion;
// Update a note for a question
const updateQuestionNote = async (req, res) => {
    try {
        const { note } = req.body;
        const question = await Question_1.default.findById(req.params.id);
        if (!question) {
            logger_1.logger.warn(`Update note - Question not found: ${req.params.id}`);
            res.status(404).json({ success: false, message: "Question not found" });
            return;
        }
        question.note = note || "";
        await question.save();
        logger_1.logger.info(`📝 Note updated for question: ${req.params.id} - Length: ${note?.length || 0} chars`);
        res.status(200).json({ success: true, question });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Server Error";
        logger_1.logger.error(`Update note error: ${errorMessage}`);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.updateQuestionNote = updateQuestionNote;
