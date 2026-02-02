import { logger } from "../config/logger";
import { cleanAndParseJSON } from "../utils/helper";
import { vocalAnalysisPrompt } from "../utils/prompts";

interface VocalAnalysisResult {
  accuracy: number;
  fillerWords: string[];
  sentiment: string;
  confidence: number;
}

class VocalAnalysisService {
  /**
   * Analyzes a vocal transcript using Groq AI
   * @param transcript The speech-to-text result
   * @param originalQuestion The question being answered
   * @param language The language of the interview
   */
  async analyzeVocalTranscript(
    transcript: string,
    originalQuestion: string,
    language: string = "en",
  ): Promise<VocalAnalysisResult> {
    try {
      logger.info(`🎙️ AIService: Analyzing vocal response (${language})`);

      const prompt = vocalAnalysisPrompt(
        transcript,
        originalQuestion,
        language,
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
            response_format: { type: "json_object" },
            temperature: 0.1,
          }),
        },
      );

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        error?: { message: string };
      };

      if (data.error) {
        throw new Error(`Groq API Error: ${data.error.message}`);
      }

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response choices returned from AI");
      }

      // Extraction and parsing via the helper
      const result = cleanAndParseJSON(
        data.choices[0].message.content,
      ) as VocalAnalysisResult;

      return result;
    } catch (error) {
      logger.error("❌ VocalAnalysisService Error:", error);
      throw new Error("Failed to analyze vocal transcript");
    }
  }
}

export default new VocalAnalysisService();
