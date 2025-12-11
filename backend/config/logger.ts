import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, json, errors, align, printf, colorize } =
  winston.format;

// Get environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// Define the transports array to hold different logging transports
const transports: winston.transport[] = [];

// Add console transport for all environments
if (NODE_ENV === "production") {
  // Production: JSON format for log aggregation services
  transports.push(
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    })
  );

  // Add file transports for production
  const logsDir = path.join(__dirname, "..", "logs");

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
} else {
  // Development: colorized, human-readable format
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }), // Add colors to log level
        timestamp({ format: "YYYY-MM-DD hh:mm:ss A" }), // Add timestamp to logs
        align(), // Align log messages
        printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? `\n${JSON.stringify(meta, null, 2)}`
            : "";

          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    })
  );
}

// Create a looger instance using Winston
const logger = winston.createLogger({
  level: LOG_LEVEL || "info", // Set the default looging level to 'info'
  format: combine(timestamp(), errors({ stack: true }), json()), // Use JSON format for log messages
  transports,
  silent: NODE_ENV === "test", // Disable logging in test environment
});

export { logger };
