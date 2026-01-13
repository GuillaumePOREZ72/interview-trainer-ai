import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User";
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
export declare const protect: (req: Request, res: Response, next: NextFunction) => Promise<void>;
