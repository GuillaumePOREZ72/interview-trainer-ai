/**
 * Mock Interview Service
 * Core business logic for interview sessions
 * Handles question generation, follow-ups, analysis, and scoring
 * 
 * AI Model: Qwen 3 (32B) via Groq
 * - Superior performance for technical interviews
 * - Excellent French language support
 * - Consistent with existing app architecture
 */

import { logger } from "../config/logger";
import MockInterviewSession, {
  IMockInterviewSession,
  IQuestionResponse,
} from "../models/MockInterviewSession";
import ttsService from "./ttsService";
import { generateInterviewQuestions } from "../utils/prompts";
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Mock Interview Service
 * Manages the complete interview flow
 */
class MockInterviewService {
  /**
   * Generate initial interview question
   * Called when user starts a new mock interview
   * 
   * @param session - The mock interview session
   * @returns Generated question text
   */
  async generateInitialQuestion(session: IMockInterviewSession): Promise<string> {
    try {
      logger.info(
        `Generating initial question for session ${session._id} - ${session.role} (${session.language})`
      );

      // Check if we have cached TTS for this question
      const questionText = await this.callGroqForQuestion(session);
      
      // Generate TTS audio (or null if quota exceeded - fallback to text)
      const audioPath = await ttsService.synthesize(questionText, session.language as "fr" | "en");
      
      if (audioPath) {
        // Store in session cache
        const hash = this.generateHash(questionText, session.language);
        session.ttsAudioCache.set(hash, audioPath);
        await session.save();
      }

      return questionText;
    } catch (error) {
      logger.error(`Error generating initial question: ${error}`);
      throw new Error("Failed to generate interview question");
    }
  }

  /**
   * Generate follow-up question based on user's response
   * Analyzes the response and asks a contextual follow-up
   * 
   * @param session - Current session
   * @param responseText - User's transcribed response
   * @param originalQuestion - The question that was asked
   * @returns Follow-up question text
   */
  async generateFollowUpQuestion(
    session: IMockInterviewSession,
    responseText: string,
    originalQuestion: string
  ): Promise<string> {
    try {
      logger.info(`Generating follow-up for session ${session._id}`);

      const prompt = this.buildFollowUpPrompt(
        session,
        responseText,
        originalQuestion
      );

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an expert technical interviewer. Analyze the candidate's response and ask a relevant follow-up question that probes deeper into their knowledge.",
          },
          { role: "user", content: prompt },
        ],
        model: "qwen-qwq-32b",
        temperature: 0.7,
        max_tokens: 200,
      });

      const question = completion.choices[0]?.message?.content?.trim() || "";
      
      if (!question) {
        throw new Error("Empty response from Groq");
      }

      // Generate TTS for follow-up
      await ttsService.synthesize(question, session.language as "fr" | "en");

      return question;
    } catch (error) {
      logger.error(`Error generating follow-up: ${error}`);
      // Fallback: ask generic follow-up
      return session.language === "fr"
        ? "Pouvez-vous développer davantage votre réponse ?"
        : "Can you elaborate more on your answer?";
    }
  }

  /**
   * Analyze user's response
   * Calls Groq API to evaluate the answer quality
   * 
   * @param responseText - User's transcribed answer
   * @param questionText - The question asked
   * @param language - Language code
   * @returns Analysis object with scores and feedback
   */
  async analyzeResponse(
    responseText: string,
    questionText: string,
    language: string
  ): Promise<{
    accuracy: number;
    fillerWords: string[];
    sentiment: string;
    confidence: number;
    suggestions: string[];
  }> {
    try {
      logger.info(`Analyzing response (${language})`);

      const prompt = this.buildAnalysisPrompt(responseText, questionText, language);

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an expert interview coach. Analyze the candidate's response objectively.",
          },
          { role: "user", content: prompt },
        ],
        model: "qwen-qwq-32b",
        temperature: 0.3,
        max_tokens: 500,
      });

      const analysisText = completion.choices[0]?.message?.content || "";
      
      // Parse the analysis (expecting JSON)
      const analysis = this.parseAnalysisResponse(analysisText);
      
      return analysis;
    } catch (error) {
      logger.error(`Error analyzing response: ${error}`);
      // Return default analysis on error
      return {
        accuracy: 70,
        fillerWords: [],
        sentiment: "neutral",
        confidence: 70,
        suggestions: [language === "fr" 
          ? "Continuez à pratiquer pour vous améliorer"
          : "Keep practicing to improve"
        ],
      };
    }
  }

  /**
   * Generate final session report
   * Summarizes the entire interview with scores and recommendations
   * 
   * @param session - Completed session
   * @returns Report object
   */
  async generateSessionReport(session: IMockInterviewSession): Promise<{
    overallScore: number;
    feedback: string[];
    strengths: string[];
    improvementAreas: string[];
  }> {
    try {
      logger.info(`Generating report for session ${session._id}`);

      // Calculate scores from all questions
      let totalAccuracy = 0;
      let questionCount = 0;
      const allSuggestions: string[] = [];

      for (const q of session.questions) {
        if (q.analysis) {
          totalAccuracy += q.analysis.accuracy;
          questionCount++;
          allSuggestions.push(...q.analysis.suggestions);
        }

        if (q.followUpQuestion?.analysis) {
          totalAccuracy += q.followUpQuestion.analysis.accuracy;
          questionCount++;
          allSuggestions.push(...q.followUpQuestion.analysis.suggestions);
        }
      }

      const overallScore = questionCount > 0 
        ? Math.round(totalAccuracy / questionCount)
        : 0;

      // Generate AI-powered summary
      const prompt = this.buildReportPrompt(session, overallScore);
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert career coach. Provide actionable interview feedback.",
          },
          { role: "user", content: prompt },
        ],
        model: "qwen-qwq-32b",
        temperature: 0.5,
        max_tokens: 800,
      });

      const reportText = completion.choices[0]?.message?.content || "";
      const report = this.parseReportResponse(reportText);

      return {
        overallScore,
        feedback: allSuggestions.slice(0, 5), // Top 5 suggestions
        strengths: report.strengths,
        improvementAreas: report.improvementAreas,
      };
    } catch (error) {
      logger.error(`Error generating report: ${error}`);
      return {
        overallScore: 70,
        feedback: ["Continuez à pratiquer !"],
        strengths: ["Participation active"],
        improvementAreas: ["Structure des réponses"],
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async callGroqForQuestion(session: IMockInterviewSession): Promise<string> {
    const prompt = `
      Generate a professional interview question for a ${session.experience} level ${session.role}.
      Focus on: ${session.topicsToFocus}
      Language: ${session.language === "fr" ? "French" : "English"}
      
      The question should:
      - Be relevant to the role and experience level
      - Test both technical knowledge and problem-solving
      - Be open-ended to allow detailed response
      - Be suitable for a 30-second verbal answer
      
      Return ONLY the question text, nothing else.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "qwen-qwq-32b",
      temperature: 0.8,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content?.trim() || "Tell me about yourself";
  }

  private buildFollowUpPrompt(
    session: IMockInterviewSession,
    responseText: string,
    originalQuestion: string
  ): string {
    return `
      Original Question: "${originalQuestion}"
      Candidate's Response: "${responseText.substring(0, 500)}"
      
      Generate a follow-up question that:
      1. Probes deeper into a specific point from their answer
      2. Tests their depth of knowledge
      3. Is relevant to ${session.role} position
      
      Language: ${session.language === "fr" ? "French" : "English"}
    `;
  }

  private buildAnalysisPrompt(
    responseText: string,
    questionText: string,
    language: string
  ): string {
    return `
      Question: "${questionText}"
      Candidate's Answer: "${responseText.substring(0, 800)}"
      
      Analyze this interview response and provide:
      1. Accuracy score (0-100)
      2. List of filler words used ("um", "uh", "like", etc.)
      3. Sentiment (positive/neutral/negative)
      4. Confidence score (0-100)
      5. 3 specific suggestions for improvement
      
      Return as JSON:
      {
        "accuracy": number,
        "fillerWords": string[],
        "sentiment": string,
        "confidence": number,
        "suggestions": string[]
      }
      
      Language: ${language === "fr" ? "French" : "English"}
    `;
  }

  private buildReportPrompt(session: IMockInterviewSession, overallScore: number): string {
    return `
      Interview Summary:
      - Role: ${session.role}
      - Experience Level: ${session.experience}
      - Overall Score: ${overallScore}/100
      - Questions Answered: ${session.questions.length}
      
      Provide a brief interview report with:
      1. Key strengths (3 points)
      2. Areas for improvement (3 points)
      
      Format as JSON:
      {
        "strengths": string[],
        "improvementAreas": string[]
      }
      
      Language: ${session.language === "fr" ? "French" : "English"}
    `;
  }

  private parseAnalysisResponse(text: string): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      logger.warn("Failed to parse analysis JSON, using defaults");
    }

    return {
      accuracy: 70,
      fillerWords: [],
      sentiment: "neutral",
      confidence: 70,
      suggestions: ["Continue practicing"],
    };
  }

  private parseReportResponse(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      logger.warn("Failed to parse report JSON, using defaults");
    }

    return {
      strengths: ["Good participation"],
      improvementAreas: ["Response structure"],
    };
  }

  private generateHash(text: string, language: string): string {
    return require("crypto")
      .createHash("md5")
      .update(`${text}:${language}`)
      .digest("hex");
  }
}

// Export singleton
export default new MockInterviewService();
