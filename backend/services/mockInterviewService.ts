/**
 * Mock Interview Service
 * Core business logic for interview sessions
 * Handles question generation, follow-ups, analysis, and scoring
 * 
 * AI Model: qwen/qwen3-32b via Groq
 * - Same model as existing AI services (aiController.ts)
 * - Superior performance for technical interviews
 * - Excellent French language support
 */

import { logger } from "../config/logger";
import MockInterviewSession, {
  IMockInterviewSession,
  IQuestionResponse,
} from "../models/MockInterviewSession";
import ttsService from "./ttsService";
import {
  mockInterviewInitialQuestionPrompt,
  mockInterviewFollowUpPrompt,
  mockInterviewAnalysisPrompt,
  mockInterviewSessionReportPrompt,
} from "../utils/prompts";

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

      const questionHistory = session.questions.map(q => q.questionText);
      const prompt = mockInterviewFollowUpPrompt(
        responseText,
        originalQuestion,
        questionHistory,
        session.language
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
            model: "qwen/qwen3-32b",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert technical interviewer. Analyze the candidate's response and ask a relevant follow-up question that probes deeper into their knowledge.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 200,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      const content = data.choices[0]?.message?.content?.trim() || "";
      
      if (!content) {
        throw new Error("Empty response from Groq");
      }

      // Try to parse JSON response
      let question: string;
      try {
        const parsed = JSON.parse(content);
        question = parsed.question || content;
      } catch {
        question = content;
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

      const prompt = mockInterviewAnalysisPrompt(
        responseText,
        questionText,
        "technical",
        language
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
            model: "qwen/qwen3-32b",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert interview coach. Analyze the candidate's response objectively.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      const analysisText = data.choices[0]?.message?.content || "";
      
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
      const responses = session.questions.map(q => ({
        question: q.questionText,
        score: q.analysis?.accuracy || 0,
        strengths: q.analysis?.suggestions.slice(0, 2) || [],
        improvements: q.analysis?.suggestions.slice(2, 4) || [],
      }));

      const prompt = mockInterviewSessionReportPrompt(
        {
          role: session.role,
          experience: session.experience,
          interviewType: "technical",
          totalQuestions: session.questions.length,
          averageScore: overallScore,
          responses,
        },
        session.language
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
            model: "qwen/qwen3-32b",
            messages: [
              {
                role: "system",
                content: "You are an expert career coach. Provide actionable interview feedback.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.5,
            max_tokens: 800,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      const reportText = data.choices[0]?.message?.content || "";
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
    const prompt = mockInterviewInitialQuestionPrompt(
      session.role,
      session.experience,
      "technical",
      session.topicsToFocus,
      session.language
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
          model: "qwen/qwen3-32b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 150,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices[0]?.message?.content?.trim();
    
    if (!content) {
      return "Tell me about yourself";
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content);
      return parsed.question || content;
    } catch {
      return content;
    }
  }

  private parseAnalysisResponse(text: string): {
    accuracy: number;
    fillerWords: string[];
    sentiment: string;
    confidence: number;
    suggestions: string[];
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Handle new format (with scores and feedback)
        if (parsed.scores && parsed.overallScore !== undefined) {
          return {
            accuracy: parsed.overallScore,
            fillerWords: [], // New format doesn't track filler words
            sentiment: "neutral", // Default sentiment
            confidence: parsed.scores.clarity || 70, // Use clarity as confidence
            suggestions: [
              ...(parsed.feedback?.strengths?.map((s: string) => `Strength: ${s}`) || []),
              ...(parsed.feedback?.improvements || []),
              parsed.feedback?.actionableTip,
            ].filter(Boolean),
          };
        }
        
        // Handle old format (direct properties)
        return {
          accuracy: parsed.accuracy ?? 70,
          fillerWords: parsed.fillerWords ?? [],
          sentiment: parsed.sentiment ?? "neutral",
          confidence: parsed.confidence ?? 70,
          suggestions: parsed.suggestions ?? ["Continue practicing"],
        };
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
