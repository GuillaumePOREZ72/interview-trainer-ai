declare const questionAnswerPrompt: (role: string, experience: string, topicsToFocus: string, numberOfQuestions: number, language?: string) => string;
declare const conceptExplainPrompt: (question: string, language?: string) => string;
export { questionAnswerPrompt, conceptExplainPrompt };
