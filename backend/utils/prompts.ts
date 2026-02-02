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
  Analyze this interview response transcript.
  ${getLanguageInstruction(language)}

  Context:
  - Question: "${originalQuestion}"
  - Candidate Transcript: "${transcript}"

  Task:
  - Evaluate the technical accuracy of the response relative to the question.
  - Identify specific filler words or speech patterns (e.g., "uhm", "like", "du coup", "enfin").
  - Determine the candidate's sentiment and confidence level.

  Return ONLY a valid JSON object. No preamble, no post-text, and NO markdown code blocks around the JSON.

  Format:
  {
    "accuracy": (number 0-100),
    "fillerWords": (array of strings),
    "sentiment": (one of: "confident", "neutral", "uncertain"),
    "confidence": (number 0-1 from transcript clarity)
  }
  `;

export { questionAnswerPrompt, conceptExplainPrompt, vocalAnalysisPrompt };
