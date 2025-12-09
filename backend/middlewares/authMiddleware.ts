import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import { IUser } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Middleware to protect routes
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer")) {
      token = token.split(" ")[1]; // Extract token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } else {
      res.status(401).json({ message: "Not authorized, no token" });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Token failed";
    res.status(401).json({ message: "Token failed", error: errorMessage });
  }
};
