import { conceptExplainPrompt, questionAnswerPrompt } from "../utils/prompts";
import { cleanAndParseJSON } from "../utils/helper";
import { Request, Response } from "express";
import { logger } from "../config/logger";

interface GenerateQuestionsRequest extends Request {
  body: {
    role: string;
    experience: string;
    topicsToFocus: string;
    numberOfQuestions: number;
  };
}

interface GenerateExplanationRequest extends Request {
  body: {
    question: string;
  };
}

// Generate interview questions and answers using Groq
const generateInterviewQuestions = async (
  req: GenerateQuestionsRequest,
  res: Response
): Promise<void> => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      logger.warn(`AI generation - Missing fields - User: ${req.user?._id}`);
      res.status(400).json({ message: "Missing required fields." });
      return;
    }

    logger.info(
      `🤖 Generating ${numberOfQuestions} questions - Role: ${role} - Experience: ${experience} - User: ${req.user?._id}`
    );

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions
    );

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
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
      }
    );

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      error?: { message: string };
    };

    if (!response.ok) {
      const errorMsg = data.error?.message || "Groq API error";
      logger.error(`Groq API error: ${errorMsg} - User: ${req.user?._id}`);
      throw new Error(errorMsg);
    }

    const parsedData = cleanAndParseJSON(data.choices[0].message.content);

    logger.info(
      `✅ Questions generated successfully - User: ${req.user?._id} - Count: ${numberOfQuestions}`
    );

    res.status(200).json(parsedData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate questions";
    logger.error(
      `AI generation error: ${errorMessage} - User: ${req.user?._id}`
    );
    res
      .status(500)
      .json({ message: "Failed to generate questions", error: errorMessage });
  }
};

// Generate explanations for an interview question
const generateConceptExplanation = async (
  req: GenerateExplanationRequest,
  res: Response
): Promise<void> => {
  try {
    const { question } = req.body;

    if (!question) {
      logger.warn(`AI explanation - Missing question - User: ${req.user?._id}`);
      res.status(400).json({ message: "Missing required fields." });
      return;
    }

    logger.info(
      `🤖 Generating explanation - Question: "${question.substring(
        0,
        50
      )}..." - User: ${req.user?._id}`
    );

    const prompt = conceptExplainPrompt(question);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
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
      }
    );

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      error?: { message: string };
    };

    if (!response.ok) {
      const errorMsg = data.error?.message || "Groq API error";
      logger.error(
        `Groq API error (explanation): ${errorMsg} - User: ${req.user?._id}`
      );
      throw new Error(errorMsg);
    }

    const parsedData = cleanAndParseJSON(data.choices[0].message.content);

    logger.info(
      `✅ Explanation generated successfully - User: ${req.user?._id}`
    );

    res.status(200).json(parsedData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate explanation";
    logger.error(
      `AI explanation error: ${errorMessage} - User: ${req.user?._id}`
    );
    res
      .status(500)
      .json({ message: "Failed to generate explanation", error: errorMessage });
  }
};

export { generateInterviewQuestions, generateConceptExplanation };
