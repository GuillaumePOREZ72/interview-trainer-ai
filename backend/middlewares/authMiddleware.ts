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

// Middleware to protect routes - Supporte Bearer tokens et Cookies
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Récupérer le token du header Bearer ou des cookies
    let token: string | undefined;
    
    // Essayer d'abord le header Bearer
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    
    // Fallback sur les cookies si pas de Bearer
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      logger.warn("Authentication failed: No token provided", {
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
