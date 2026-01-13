import { Request, Response } from "express";
declare const registerUser: (req: Request, res: Response) => Promise<void>;
declare const loginUser: (req: Request, res: Response) => Promise<void>;
declare const refreshAccessToken: (req: Request, res: Response) => Promise<void>;
declare const getUserProfile: (req: Request, res: Response) => Promise<void>;
export { registerUser, loginUser, getUserProfile, refreshAccessToken };
