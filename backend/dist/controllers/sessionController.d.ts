import { Request, Response } from "express";
interface CreateSessionRequest extends Request {
    body: {
        role: string;
        experience: string;
        topicsToFocus: string;
        description?: string;
        questions: Array<{
            question: string;
            answer: string;
        }>;
    };
}
export declare const createSession: (req: CreateSessionRequest, res: Response) => Promise<void>;
export declare const getMySessions: (req: Request, res: Response) => Promise<void>;
export declare const getSessionById: (req: Request, res: Response) => Promise<void>;
export declare const deleteSession: (req: Request, res: Response) => Promise<void>;
export {};
