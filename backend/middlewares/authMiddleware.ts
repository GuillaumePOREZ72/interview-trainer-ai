import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { IUser } from "../models/User";
import { logger } from "../config/logger";

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
    let token = req.headers.authorization?.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : req.cookies?.token;

    if (!token) {
      logger.warn("Authentication failed: No token provided");
      res.status(401).json({ message: "Not authorized, no token" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      logger.warn("Authentication failed: User not found");
      res.status(401).json({ message: "User not found" });
      return;
    }

    next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Token failed";
    logger.error(`Authentication error: ${errorMessage} - IP: ${req.ip}`);
    res.status(401).json({ message: "Token failed", error: errorMessage });
  }
};
