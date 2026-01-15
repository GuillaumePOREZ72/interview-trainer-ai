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

  CRITICAL MARKDOWN FORMATTING RULES:
  1. Code blocks MUST be on their own lines, with a blank line before AND after.
  2. Code blocks MUST start with \`\`\` followed by the language name (e.g., \`\`\`javascript).
  3. Code blocks MUST end with \`\`\` on its own line.
  4. NEVER use inline code (\`code\`) for multi-line code. Always use fenced code blocks.
  5. DO NOT include explanatory text inside code blocks. Text goes OUTSIDE, code goes INSIDE.
  6. Use inline code (\`code\`) ONLY for short references like variable names, function names, or keywords (e.g., \`useState\`, \`async\`).
  
  Example of CORRECT formatting:
  
  We use the useState hook to manage state.
  
  \`\`\`javascript
  const [count, setCount] = useState(0);
  \`\`\`
  
  This creates a state variable called count.

  - Return a pure JSON array like:
  [
    {
      "question": "Question here?",
      "answer": "Answer here with proper markdown formatting."
    }
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

  CRITICAL MARKDOWN FORMATTING RULES:
  1. Code blocks MUST be on their own lines, with a blank line before AND after.
  2. Code blocks MUST start with \`\`\` followed by the language name (e.g., \`\`\`javascript).
  3. Code blocks MUST end with \`\`\` on its own line.
  4. NEVER use inline code (\`code\`) for multi-line code. Always use fenced code blocks.
  5. DO NOT include explanatory text inside code blocks. Text goes OUTSIDE, code goes INSIDE.
  6. Use inline code (\`code\`) ONLY for short references like variable names, function names, or keywords.
  
  Example of CORRECT formatting:
  
  We define a function to fetch data.
  
  \`\`\`typescript
  async function fetchData() {
    const response = await fetch('/api/data');
    return response.json();
  }
  \`\`\`
  
  This function returns a Promise.

  - Return the result as a valid JSON object in the following format:

  {
    "title": "Short title here",
    "explanation": "Explanation here with proper markdown formatting."
  }
  Important: Do NOT add any extra text outside the JSON format. Only return valid JSON.
  `;

export { questionAnswerPrompt, conceptExplainPrompt };
