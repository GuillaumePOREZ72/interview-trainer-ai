"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conceptExplainPrompt = exports.questionAnswerPrompt = void 0;
const getLanguageInstruction = (language) => {
    return language.startsWith("fr")
        ? "IMPORTANT: You MUST write ALL content (questions, answers, explanations) in French."
        : "Write all content in English.";
};
const questionAnswerPrompt = (role, experience, topicsToFocus, numberOfQuestions, language = "en") => `
  You are an AI trained to generate technical interview questions and answers.
  ${getLanguageInstruction(language)}

  Task:
  - Role: ${role}
  - Candidate Experience: ${experience} years
  - Focus Topics: ${topicsToFocus}
  - Write ${numberOfQuestions} interviews questions
  - For each question, generate a detailed but beginner-friendly answer.

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

  - Return a pure JSON array like:
  [
    {
      "question": "Question here?",
      "answer": "Answer here with proper markdown formatting."
    }
  ]
  Important: Do NOT add any extra text. Only return valid JSON.
  `;
exports.questionAnswerPrompt = questionAnswerPrompt;
const conceptExplainPrompt = (question, language = "en") => `
  You are an AI trained to generate explanations for a given interview question.
  ${getLanguageInstruction(language)}
  
  Task:
  - Explain the following interview question and its concept in depth as if you're teaching a beginner developer.
  - Question: "${question}"
  - After the explanation, provide a short and clear title that summarizes the concept for the article or page header.

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

  - Return the result as a valid JSON object in the following format:

  {
    "title": "Short title here",
    "explanation": "Explanation here with proper markdown formatting."
  }
  Important: Do NOT add any extra text outside the JSON format. Only return valid JSON.
  `;
exports.conceptExplainPrompt = conceptExplainPrompt;
