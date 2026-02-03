import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

/**
 * Middleware d'audit pour tracer les opérations sensibles
 * Logue les actions importantes pour la sécurité et le debugging
 */

interface AuditLog {
  action: string;
  userId?: string;
  ip: string | undefined;
  method: string;
  path: string;
  params?: Record<string, any>;
  body?: Record<string, any>;
  statusCode: number;
  timestamp: string;
  userAgent?: string;
  correlationId?: string;
  duration?: number;
}

// Actions sensibles qui doivent être loguées
const SENSITIVE_ACTIONS = [
  "SESSION_CREATE",
  "SESSION_DELETE",
  "QUESTION_ADD",
  "QUESTION_PIN",
  "QUESTION_NOTE_UPDATE",
  "USER_LOGIN",
  "USER_LOGOUT",
  "USER_REGISTER",
  "PASSWORD_RESET",
  "PASSWORD_CHANGE",
  "AI_GENERATE",
  "VOCAL_ANALYSIS",
];

export const auditMiddleware = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;

    // Fonction pour loguer l'audit
    const logAudit = (statusCode: number) => {
      const duration = Date.now() - startTime;
      
      const auditLog: AuditLog = {
        action,
        userId: req.user?._id?.toString(),
        ip: req.ip,
        method: req.method,
        path: req.path,
        params: req.params,
        statusCode,
        timestamp: new Date().toISOString(),
        userAgent: req.headers["user-agent"],
        correlationId: (req as any).correlationId,
        duration,
      };

      // Ne pas loguer les données sensibles
      if (req.body && !action.includes("PASSWORD")) {
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.token;
        delete sanitizedBody.refreshToken;
        auditLog.body = sanitizedBody;
      }

      // Loguer en fonction du niveau de sévérité
      if (statusCode >= 400) {
        logger.warn(`AUDIT: ${action} failed`, auditLog);
      } else {
        logger.info(`AUDIT: ${action} success`, auditLog);
      }
    };

    // Intercepter res.send
    res.send = function(body: any) {
      logAudit(res.statusCode);
      return originalSend.call(this, body);
    };

    // Intercepter res.json
    res.json = function(body: any) {
      logAudit(res.statusCode);
      return originalJson.call(this, body);
    };

    next();
  };
};

// Middleware générique pour loguer toutes les requêtes sensibles
export const auditAllRequests = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Déterminer si cette requête doit être auditée
  const shouldAudit = SENSITIVE_ACTIONS.some((action) =>
    req.path.toLowerCase().includes(action.toLowerCase().replace("_", ""))
  );

  if (shouldAudit) {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function(body: any) {
      const duration = Date.now() - startTime;
      
      logger.info(`AUDIT: Request to ${req.path}`, {
        userId: req.user?._id?.toString(),
        ip: req.ip,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
      });

      return originalSend.call(this, body);
    };
  }

  next();
};
