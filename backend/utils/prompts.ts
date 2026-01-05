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
  language: string = "en"
): string => `
  You are an AI trained to generate technical interview questions and answers.
  ${getLanguageInstruction(language)}

  Task:
  - Role: ${role}
  - Candidate Experience: ${experience} years
  - Focus Topics: ${topicsToFocus}
  - Write ${numberOfQuestions} interviews questions
  - For each question, generate a detailed but beginner-friendly answer.
  - IMPORTANT: If the answer includes code, you MUST put code blocks on their own lines with a blank line before and after. Example:
    
    Some explanation text.
    
    \`\`\`javascript
    const example = true;
    \`\`\`
    
    More text after.
  - Keep formatting very clean.
  - Return a pure JSON array like:
  [
    {
      "question": "Question here?",
      "answer": "Answer here."
    },
    ...
  ]
    Important: Do NOT add any extra text. Only return valid JSON.
  `;

const conceptExplainPrompt = (
  question: string,
  language: string = "en"
): string => `
  You are an AI trained to generate explanations for a given interview question.
  ${getLanguageInstruction(language)}
  
  Task:

  - Explain the following interview question and its concept in depth as if you're teaching a beginner developer.
  - Question: "${question}"
  - After the explanation, provide a short and clear title that summarizes the concept for the article or page header.
  - If the explanation includes a code example, use Markdown code blocks with the appropriate language tag (e.g., \`\`\`javascript ... \`\`\`).
  - Keep the formatting very clean and clear.
  - Return the result as a valid JSON object in the following format:

  {
    "title": "Short title here?",
    "explanation": "Explanation here."
  }
  Important: Do NOT add any extra text outside the JSON format. Only return valid JSON.
  `;

export { questionAnswerPrompt, conceptExplainPrompt };
