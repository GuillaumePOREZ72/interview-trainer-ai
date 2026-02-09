const getLanguageInstruction = (language: string): string => {
  return language.startsWith("fr")
    ? "IMPORTANT: You MUST write ALL content (questions, answers, explanations) in French."
    : "Write all content in English.";
};

const questionAnswerPrompt = (
  role: string,
  experience: string,
  topicsToFocus: string,
  numberOfQuestions: number,
  language: string = "en",
): string => `
  You are an expert technical interviewer and senior software architect.
  ${getLanguageInstruction(language)}

  Task:
  - Role: ${role}
  - Candidate Experience: ${experience} years
  - Focus Topics: ${topicsToFocus}
  - Generate ${numberOfQuestions} high-quality interview questions.
  - For each question, provide a professional answer including code snippets where relevant, focusing on best practices, performance, and real-world scenarios.

  CRITICAL MARKDOWN FORMATTING RULES FOR CODE:
  1. Code blocks MUST have a blank line BEFORE the opening \`\`\`
  2. Code blocks MUST have a blank line AFTER the closing \`\`\`
  3. NEVER put any text on the same line as \`\`\` (before or after)
  4. The closing \`\`\` must be ALONE on its line, with NO text after it
  5. Any explanatory text must come AFTER the code block, separated by a blank line
  
  WRONG (text after closing):
  \`\`\`javascript
  const x = 1;
  \`\`\`This text is wrong here.
  
  CORRECT (blank line, then text):
  \`\`\`javascript
  const x = 1;
  \`\`\`

  This text is correct here.

  - Return EXCLUSIVELY a pure JSON array. No preamble, no post-text, and NO markdown code blocks around the JSON.
  
  Format:
  [
    {
      "question": "Question here?",
      "answer": "Answer here with proper markdown formatting."
    }
  ]
  `;

const conceptExplainPrompt = (
  question: string,
  language: string = "en",
): string => `
  You are a senior software engineering mentor and architect.
  ${getLanguageInstruction(language)}
  
  Task:
  - Explain the following interview question and its underlying concept in depth.
  - Question: "${question}"
  - Your explanation should cover: core principles, real-world application, common pitfalls, and optimization tips.
  - Provide a concise and professional title that summarizes the concept.

  CRITICAL MARKDOWN FORMATTING RULES FOR CODE:
  1. Code blocks MUST have a blank line BEFORE the opening \`\`\`
  2. Code blocks MUST have a blank line AFTER the closing \`\`\`
  3. NEVER put any text on the same line as \`\`\` (before or after)
  4. The closing \`\`\` must be ALONE on its line, with NO text after it
  5. Any explanatory text must come AFTER the code block, separated by a blank line
  
  WRONG (text after closing):
  \`\`\`typescript
  const x = 1;
  \`\`\`This text is wrong.
  
  CORRECT (blank line, then text):
  \`\`\`typescript
  const x = 1;
  \`\`\`

  This text is correct.

  - Return EXCLUSIVELY a valid JSON object. No preamble, no post-text, and NO markdown code blocks around the JSON.

  Format:
  {
    "title": "Short title here",
    "explanation": "Explanation here with proper markdown formatting."
  }
  `;

const vocalAnalysisPrompt = (
  transcript: string,
  originalQuestion: string,
  language: string = "en",
): string => `
  You are a technical interview evaluator. Analyze this candidate's vocal response.
  ${getLanguageInstruction(language)}

  Context:
  - Question: "${originalQuestion}"
  - Candidate Transcript: "${transcript}"

  Task:
  1. Evaluate the technical accuracy of the response (0-100 scale).
     - 0-30: Incorrect or irrelevant answer
     - 30-60: Partially correct, missing key points
     - 60-80: Good answer with minor gaps
     - 80-100: Excellent, comprehensive answer
  
  2. Identify ONLY filler words actually present in the transcript (e.g., "uhm", "like", "euh", "du coup", "enfin").
     - Return ONLY the words themselves, no explanations.
     - If none found, return an empty array [].
  
  3. Determine sentiment: "confident", "neutral", or "uncertain".
  
  4. Assess confidence level (0.0 to 1.0) based on speech clarity and coherence.

  CRITICAL: Return ONLY a valid JSON object. No explanations, no markdown, no extra text.
  
  Required format (strict):
  {
    "accuracy": 75,
    "fillerWords": ["euh", "du coup"],
    "sentiment": "confident",
    "confidence": 0.8
  }
  `;

// MOCK INTERVIEW PROMPTS

const getLanguageInstructionMock = (language: string): string => {
  return language.startsWith("fr")
    ? "LANGUE: Français. Génère tout le contenu en français."
    : "LANG: English. Generate all content in English.";
};

/**
 * 1. generateInitialQuestion - First interview question
 * Optimized for token efficiency (~150-200 tokens)
 */
const mockInterviewInitialQuestionPrompt = (
  role: string,
  experience: number,
  interviewType: "technical" | "behavioral",
  topicsToFocus: string,
  language: string = "en",
): string => {
  // Determine experience level based on years
  const getExperienceLevel = (years: number): string => {
    if (years < 2) return "junior";
    if (years < 5) return "mid-level";
    if (years < 8) return "senior";
    return "lead/principal";
  };

  const experienceLevel = getExperienceLevel(experience);

  return `
You are an expert interviewer conducting a ${interviewType} interview.
${getLanguageInstructionMock(language)}

CONTEXT:
- Role: ${role}
- Experience: ${experience} years (${experienceLevel})
- Focus: ${topicsToFocus}

TASK:
Generate ONE opening interview question that:
1. Assesses core competencies for the role
2. Matches ${experienceLevel} level difficulty
3. ${interviewType === "technical" ? "Tests practical knowledge with real-world scenarios" : "Evaluates soft skills and past experiences"}
4. Is open-ended to encourage detailed response

OUTPUT JSON:
{
  "question": "The interview question",
  "category": "${interviewType}",
  "difficulty": "${experienceLevel}",
  "expectedDuration": "3-5 minutes",
  "keyPointsToAssess": ["point1", "point2", "point3"]
}
`;
};

/**
 * 2. generateFollowUpQuestion - Contextual follow-up
 * Optimized for token efficiency (~200-250 tokens)
 */
const mockInterviewFollowUpPrompt = (
  previousResponse: string,
  originalQuestion: string,
  questionHistory: string[],
  language: string = "en",
): string => `
You are an expert interviewer conducting a dynamic interview.
${getLanguageInstructionMock(language)}

CONTEXT:
- Original Question: "${originalQuestion.substring(0, 200)}"
- Candidate Response: "${previousResponse.substring(0, 500)}"
- Previous Questions Asked: ${questionHistory.length > 0 ? JSON.stringify(questionHistory.slice(-3)) : "[First follow-up]"}

TASK:
Generate ONE contextual follow-up question that:
1. Probes deeper into gaps or unclear areas from the response
2. OR challenges the candidate to justify their approach
3. OR asks for specific examples/clarification
4. Maintains natural conversation flow

OUTPUT JSON:
{
  "question": "The follow-up question",
  "type": "probing|challenge|clarification|extension",
  "rationale": "Brief reason for asking this (1 sentence)",
  "difficultyAdjustment": 0
}
`;

/**
 * 3. analyzeResponse - Score and feedback
 * Optimized for token efficiency (~250-300 tokens)
 */
const mockInterviewAnalysisPrompt = (
  userResponse: string,
  question: string,
  interviewType: "technical" | "behavioral",
  language: string = "en",
): string => `
You are an expert interview evaluator.
${getLanguageInstructionMock(language)}

CONTEXT:
- Question: "${question.substring(0, 300)}"
- Type: ${interviewType}
- Response: "${userResponse.substring(0, 800)}"

TASK:
Evaluate the response on these criteria:

SCORING (0-100 each):
1. relevance: How well did they answer the specific question?
2. clarity: Was the communication clear and structured?
3. depth: Did they demonstrate deep understanding?
4. examples: Did they provide concrete examples? (0 if none)

OVERALL: Calculate weighted average

OUTPUT JSON:
{
  "scores": {
    "relevance": 0-100,
    "clarity": 0-100,
    "depth": 0-100,
    "examples": 0-100
  },
  "overallScore": 0-100,
  "feedback": {
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "actionableTip": "One specific tip for next question (1 sentence)"
  },
  "followUpSuggested": true|false
}
`;

/**
 * 4. generateSessionReport - Final summary
 * Optimized for token efficiency (~300-350 tokens)
 */
const mockInterviewSessionReportPrompt = (
  sessionData: {
    role: string;
    experience: number;
    interviewType: string;
    totalQuestions: number;
    averageScore: number;
    responses: Array<{
      question: string;
      score: number;
      strengths: string[];
      improvements: string[];
    }>;
  },
  language: string = "en",
): string => {
  // Determine experience level based on years
  const getExperienceLevel = (years: number): string => {
    if (years < 2) return "junior";
    if (years < 5) return "mid-level";
    if (years < 8) return "senior";
    return "lead/principal";
  };

  const experienceLevel = getExperienceLevel(sessionData.experience);

  return `
You are an expert career coach summarizing a mock interview session.
${getLanguageInstructionMock(language)}

SESSION DATA:
- Role: ${sessionData.role}
- Experience: ${sessionData.experience} years (${experienceLevel})
- Type: ${sessionData.interviewType}
- Questions: ${sessionData.totalQuestions}
- Average Score: ${sessionData.averageScore}/100

PERFORMANCE SUMMARY:
${JSON.stringify(
  sessionData.responses.map((r, i) => ({
    q: i + 1,
    score: r.score,
    strengths: r.strengths.slice(0, 2),
    improvements: r.improvements.slice(0, 2),
  })),
)}

TASK:
Generate comprehensive session report with:
1. Overall performance summary (2-3 sentences)
2. Key strengths demonstrated across session
3. Priority areas for improvement
4. Specific action items (3-5 bullet points)
5. Readiness assessment for real interview

OUTPUT JSON:
{
  "summary": "Overall assessment paragraph",
  "overallScore": ${sessionData.averageScore},
  "percentile": "above average|average|below average",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvementAreas": ["area1", "area2"],
  "actionItems": [
    {"priority": "high|medium|low", "action": "specific task", "timeframe": "1 week|1 month"}
  ],
  "readiness": {
    "level": "ready|nearly ready|needs practice",
    "confidence": 0.0-1.0,
    "recommendation": "Next steps advice"
  },
  "topResponse": "Brief highlight of best answer",
  "focusForNext": "What to focus on in next practice"
}
`;
};

// Export all prompts
export {
  questionAnswerPrompt,
  conceptExplainPrompt,
  vocalAnalysisPrompt,
  mockInterviewInitialQuestionPrompt,
  mockInterviewFollowUpPrompt,
  mockInterviewAnalysisPrompt,
  mockInterviewSessionReportPrompt,
};
