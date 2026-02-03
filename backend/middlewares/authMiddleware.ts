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

// Middleware to protect routes - Standardisé sur Bearer tokens uniquement
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Standardisé : Utiliser uniquement Bearer token dans le header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Authentication failed: No Bearer token provided", {
        ip: req.ip,
        correlationId: req.correlationId,
      });
      res.status(401).json({ message: "Not authorized, Bearer token required" });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      logger.warn("Authentication failed: Empty token", {
        ip: req.ip,
        correlationId: req.correlationId,
      });
      res.status(401).json({ message: "Not authorized, no token" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      logger.warn("Authentication failed: User not found", {
        userId: decoded.id,
        correlationId: req.correlationId,
      });
      res.status(401).json({ message: "User not found" });
      return;
    }

    next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Token failed";
    logger.error(`Authentication error: ${errorMessage}`, {
      ip: req.ip,
      correlationId: req.correlationId,
    });
    res.status(401).json({ message: "Token failed", error: errorMessage });
  }
};
