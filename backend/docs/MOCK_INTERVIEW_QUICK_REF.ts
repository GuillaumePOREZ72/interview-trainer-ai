/**
 * Mock Interview Prompts - Quick Reference
 * 
 * Import and use these prompts for Groq API integration in Mock Interview feature.
 * 
 * Usage:
 * ```typescript
 * import {
 *   mockInterviewInitialQuestionPrompt,
 *   mockInterviewFollowUpPrompt,
 *   mockInterviewAnalysisPrompt,
 *   mockInterviewSessionReportPrompt,
 * } from "../utils/prompts";
 * ```
 */

// ============================================================================
// 1. INITIAL QUESTION
// ============================================================================

/**
 * Expected Output Structure:
 */
interface InitialQuestionOutput {
  question: string;
  category: "technical" | "behavioral";
  difficulty: "junior" | "mid" | "senior" | "lead";
  expectedDuration: string;
  keyPointsToAssess: string[];
}

/**
 * Default fallback value:
 */
export const defaultInitialQuestion: InitialQuestionOutput = {
  question: "Can you tell me about your background and experience?",
  category: "behavioral",
  difficulty: "junior",
  expectedDuration: "3-5 minutes",
  keyPointsToAssess: ["Communication", "Experience relevance"],
};

// ============================================================================
// 2. FOLLOW-UP QUESTION
// ============================================================================

/**
 * Expected Output Structure:
 */
interface FollowUpQuestionOutput {
  question: string;
  type: "probing" | "challenge" | "clarification" | "extension";
  rationale: string;
  difficultyAdjustment: number; // -10 to +10
}

/**
 * Default fallback value:
 */
export const defaultFollowUpQuestion: FollowUpQuestionOutput = {
  question: "Could you elaborate on that point?",
  type: "clarification",
  rationale: "Need more detail",
  difficultyAdjustment: 0,
};

// ============================================================================
// 3. RESPONSE ANALYSIS
// ============================================================================

/**
 * Expected Output Structure:
 */
interface ResponseAnalysisOutput {
  scores: {
    relevance: number;  // 0-100
    clarity: number;    // 0-100
    depth: number;      // 0-100
    examples: number;   // 0-100
  };
  overallScore: number; // 0-100
  feedback: {
    strengths: string[];      // Max 3
    improvements: string[];   // Max 3
    actionableTip: string;  // 1 sentence
  };
  followUpSuggested: boolean;
}

/**
 * Default fallback value:
 */
export const defaultResponseAnalysis: ResponseAnalysisOutput = {
  scores: {
    relevance: 70,
    clarity: 70,
    depth: 70,
    examples: 70,
  },
  overallScore: 70,
  feedback: {
    strengths: ["Good attempt"],
    improvements: ["Could provide more detail"],
    actionableTip: "Practice structuring your answers with the STAR method.",
  },
  followUpSuggested: true,
};

// ============================================================================
// 4. SESSION REPORT
// ============================================================================

/**
 * Expected Output Structure:
 */
interface SessionReportOutput {
  summary: string;
  overallScore: number;
  percentile: "above average" | "average" | "below average";
  strengths: string[];        // Top 3
  improvementAreas: string[]; // Top 2
  actionItems: Array<{
    priority: "high" | "medium" | "low";
    action: string;
    timeframe: "1 week" | "2 weeks" | "1 month";
  }>;
  readiness: {
    level: "ready" | "nearly ready" | "needs practice";
    confidence: number; // 0.0-1.0
    recommendation: string;
  };
  topResponse: string;
  focusForNext: string;
}

/**
 * Default fallback value:
 */
export const defaultSessionReport: SessionReportOutput = {
  summary: "You completed the mock interview session. Review your responses and practice areas for improvement.",
  overallScore: 70,
  percentile: "average",
  strengths: ["Completed all questions", "Demonstrated effort"],
  improvementAreas: ["Technical depth", "Communication clarity"],
  actionItems: [
    {
      priority: "high",
      action: "Review technical fundamentals",
      timeframe: "1 week",
    },
  ],
  readiness: {
    level: "needs practice",
    confidence: 0.5,
    recommendation: "Continue practicing with more mock interviews",
  },
  topResponse: "Your introductory response set a good foundation.",
  focusForNext: "Focus on providing more detailed technical answers",
};

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Install zod: npm install zod
 * 
 * Usage:
 * ```typescript
 * import { z } from "zod";
 * const result = InitialQuestionSchema.safeParse(jsonData);
 * ```
 */

export const zodSchemas = {
  InitialQuestion: `z.object({
    question: z.string().min(10),
    category: z.enum(["technical", "behavioral"]),
    difficulty: z.enum(["junior", "mid", "senior", "lead"]),
    expectedDuration: z.string(),
    keyPointsToAssess: z.array(z.string()).min(1).max(5),
  })`,

  FollowUp: `z.object({
    question: z.string().min(10),
    type: z.enum(["probing", "challenge", "clarification", "extension"]),
    rationale: z.string(),
    difficultyAdjustment: z.number().min(-10).max(10),
  })`,

  Analysis: `z.object({
    scores: z.object({
      relevance: z.number().min(0).max(100),
      clarity: z.number().min(0).max(100),
      depth: z.number().min(0).max(100),
      examples: z.number().min(0).max(100),
    }),
    overallScore: z.number().min(0).max(100),
    feedback: z.object({
      strengths: z.array(z.string()).min(0).max(3),
      improvements: z.array(z.string()).min(0).max(3),
      actionableTip: z.string(),
    }),
    followUpSuggested: z.boolean(),
  })`,

  SessionReport: `z.object({
    summary: z.string(),
    overallScore: z.number().min(0).max(100),
    percentile: z.enum(["above average", "average", "below average"]),
    strengths: z.array(z.string()).min(1).max(3),
    improvementAreas: z.array(z.string()).min(1).max(2),
    actionItems: z.array(z.object({
      priority: z.enum(["high", "medium", "low"]),
      action: z.string(),
      timeframe: z.enum(["1 week", "2 weeks", "1 month"]),
    })),
    readiness: z.object({
      level: z.enum(["ready", "nearly ready", "needs practice"]),
      confidence: z.number().min(0).max(1),
      recommendation: z.string(),
    }),
    topResponse: z.string(),
    focusForNext: z.string(),
  })`,
};

// ============================================================================
// GROQ API CALL CONFIGURATION
// ============================================================================

export const groqConfig = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  model: "llama-3.3-70b-versatile",
  temperature: {
    initialQuestion: 0.5,
    followUp: 0.3,
    analysis: 0.2,
    sessionReport: 0.4,
  },
  maxRetries: 3,
  timeoutMs: 10000,
  backoffMultiplier: 2,
};

// ============================================================================
// TOKEN OPTIMIZATION HELPERS
// ============================================================================

/**
 * Truncate text to max length for cost optimization
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
};

/**
 * Input truncation limits (characters)
 */
export const truncationLimits = {
  previousResponse: 500,
  currentResponse: 800,
  questionHistory: 3, // Keep last 3 questions only
  questionText: 300,
};

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 chars)
 */
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

// ============================================================================
// COST ESTIMATES (per Groq pricing as of 2024)
// ============================================================================

export const costEstimates = {
  // Based on llama-3.3-70b-versatile pricing: ~$0.70/M tokens input, ~$0.80/M tokens output
  perRequest: {
    initialQuestion: { input: 200, output: 150, costUSD: 0.002 },
    followUp: { input: 250, output: 100, costUSD: 0.003 },
    analysis: { input: 300, output: 200, costUSD: 0.004 },
    sessionReport: { input: 350, output: 400, costUSD: 0.006 },
  },
  perSession: {
    // 5 question session
    typical: { costUSD: 0.025, tokenCount: 3000 },
    // 10 question session
    extended: { costUSD: 0.05, tokenCount: 6000 },
  },
};

// ============================================================================
// LANGUAGE DETECTION
// ============================================================================

export const detectLanguage = (acceptLanguage: string): "en" | "fr" => {
  const lang = acceptLanguage?.split(",")[0]?.toLowerCase() || "en";
  return lang.startsWith("fr") ? "fr" : "en";
};

// ============================================================================
// EXAMPLE INTEGRATION
// ============================================================================

/**
 * Example service implementation:
 * 
 * ```typescript
 * class MockInterviewService {
 *   async generateInitialQuestion(
 *     userProfile: UserProfile,
 *     language: string
 *   ): Promise<InitialQuestionOutput> {
 *     const prompt = mockInterviewInitialQuestionPrompt(
 *       userProfile.role,
 *       userProfile.experience,
 *       userProfile.interviewType,
 *       userProfile.topicsToFocus,
 *       language
 *     );
 *     
 *     const response = await fetch(groqConfig.endpoint, {
 *       method: "POST",
 *       headers: {
 *         "Content-Type": "application/json",
 *         "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
 *       },
 *       body: JSON.stringify({
 *         model: groqConfig.model,
 *         messages: [{ role: "user", content: prompt.replace(/\\n/g, " ").trim() }],
 *         response_format: { type: "json_object" },
 *         temperature: groqConfig.temperature.initialQuestion,
 *       }),
 *     });
 *     
 *     const data = await response.json();
 *     const content = data.choices[0]?.message?.content;
 *     
 *     return safeParseWithFallback(content, defaultInitialQuestion);
 *   }
 * }
 * ```
 */
