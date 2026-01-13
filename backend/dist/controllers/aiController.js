"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateConceptExplanation = exports.generateInterviewQuestions = void 0;
const prompts_1 = require("../utils/prompts");
const helper_1 = require("../utils/helper");
const logger_1 = require("../config/logger");
// Generate interview questions and answers using Groq
const generateInterviewQuestions = async (req, res) => {
    try {
        const { role, experience, topicsToFocus, numberOfQuestions } = req.body;
        if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
            logger_1.logger.warn(`AI generation - Missing fields - User: ${req.user?._id}`);
            res.status(400).json({ message: "Missing required fields." });
            return;
        }
        const language = req.headers["accept-language"]?.split(",")[0] || "en";
        logger_1.logger.info(`🤖 Generating ${numberOfQuestions} questions - Role: ${role} - Experience: ${experience} - Language: ${language} - User: ${req.user?._id}`);
        const prompt = (0, prompts_1.questionAnswerPrompt)(role, experience, topicsToFocus, numberOfQuestions, language);
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user",
                        content: prompt.replace(/\n/g, " ").trim(),
                    },
                ],
                temperature: 0.7,
            }),
        });
        const data = (await response.json());
        if (!response.ok) {
            const errorMsg = data.error?.message || "Groq API error";
            logger_1.logger.error(`Groq API error: ${errorMsg} - User: ${req.user?._id}`);
            throw new Error(errorMsg);
        }
        const parsedData = (0, helper_1.cleanAndParseJSON)(data.choices[0].message.content);
        logger_1.logger.info(`✅ Questions generated successfully - User: ${req.user?._id} - Count: ${numberOfQuestions}`);
        res.status(200).json(parsedData);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to generate questions";
        logger_1.logger.error(`AI generation error: ${errorMessage} - User: ${req.user?._id}`);
        res
            .status(500)
            .json({ message: "Failed to generate questions", error: errorMessage });
    }
};
exports.generateInterviewQuestions = generateInterviewQuestions;
// Generate explanations for an interview question
const generateConceptExplanation = async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            logger_1.logger.warn(`AI explanation - Missing question - User: ${req.user?._id}`);
            res.status(400).json({ message: "Missing required fields." });
            return;
        }
        const language = req.headers["accept-language"]?.split(",")[0] || "en";
        logger_1.logger.info(`🤖 Generating explanation - Question: "${question.substring(0, 50)}..." - Language: ${language} - User: ${req.user?._id}`);
        const prompt = (0, prompts_1.conceptExplainPrompt)(question, language);
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user",
                        content: prompt.replace(/\n/g, " ").trim(),
                    },
                ],
                temperature: 0.7,
            }),
        });
        const data = (await response.json());
        if (!response.ok) {
            const errorMsg = data.error?.message || "Groq API error";
            logger_1.logger.error(`Groq API error (explanation): ${errorMsg} - User: ${req.user?._id}`);
            throw new Error(errorMsg);
        }
        const parsedData = (0, helper_1.cleanAndParseJSON)(data.choices[0].message.content);
        logger_1.logger.info(`✅ Explanation generated successfully - User: ${req.user?._id}`);
        res.status(200).json(parsedData);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to generate explanation";
        logger_1.logger.error(`AI explanation error: ${errorMessage} - User: ${req.user?._id}`);
        res
            .status(500)
            .json({ message: "Failed to generate explanation", error: errorMessage });
    }
};
exports.generateConceptExplanation = generateConceptExplanation;
