import { Request, Response } from "express";
interface GenerateQuestionsRequest extends Request {
    body: {
        role: string;
        experience: string;
        topicsToFocus: string;
        numberOfQuestions: number;
    };
}
interface GenerateExplanationRequest extends Request {
    body: {
        question: string;
    };
}
declare const generateInterviewQuestions: (req: GenerateQuestionsRequest, res: Response) => Promise<void>;
declare const generateConceptExplanation: (req: GenerateExplanationRequest, res: Response) => Promise<void>;
export { generateInterviewQuestions, generateConceptExplanation };
