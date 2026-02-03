import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Middleware de gestion des Correlation IDs
 * Permet de tracer les requêtes à travers le système pour le debugging et l'audit
 */

// Étendre l'interface Request pour inclure correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export const correlationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Récupérer le correlation ID du header ou en générer un nouveau
  const correlationId = req.headers["x-request-id"] as string || uuidv4();
  
  // Attacher à la requête
  req.correlationId = correlationId;
  
  // Ajouter à la réponse pour que le client puisse le référencer
  res.setHeader("X-Request-ID", correlationId);
  res.setHeader("X-Correlation-ID", correlationId);
  
  next();
};

// Middleware pour ajouter le correlation ID aux logs
export const correlationLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.correlationId) {
    // Attacher le correlation ID à l'objet res.locals pour qu'il soit accessible dans les logs
    res.locals.correlationId = req.correlationId;
  }
  next();
};
