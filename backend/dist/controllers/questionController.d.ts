import { Request, Response } from "express";
interface AddQuestionsRequest extends Request {
    body: {
        sessionId: string;
        questions: Array<{
            question: string;
            answer: string;
        }>;
    };
}
export declare const addQuestionsToSession: (req: AddQuestionsRequest, res: Response) => Promise<void>;
export declare const togglePinQuestion: (req: Request, res: Response) => Promise<void>;
export declare const updateQuestionNote: (req: Request, res: Response) => Promise<void>;
export {};
