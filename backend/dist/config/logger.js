"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const { combine, timestamp, json, errors, align, printf, colorize } = winston_1.default.format;
// Get environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
// Define the transports array to hold different logging transports
const transports = [];
// Add console transport for all environments
if (NODE_ENV === "production") {
    // Production: JSON format for log aggregation services
    transports.push(new winston_1.default.transports.Console({
        format: combine(timestamp(), json()),
    }));
    // Add file transports for production
    const logsDir = path_1.default.join(__dirname, "..", "logs");
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logsDir, "error.log"),
        level: "error",
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logsDir, "combined.log"),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
else {
    // Development: colorized, human-readable format
    transports.push(new winston_1.default.transports.Console({
        format: combine(colorize({ all: true }), // Add colors to log level
        timestamp({ format: "YYYY-MM-DD hh:mm:ss A" }), // Add timestamp to logs
        align(), // Align log messages
        printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length
                ? `\n${JSON.stringify(meta, null, 2)}`
                : "";
            return `${timestamp} [${level}]: ${message}${metaStr}`;
        })),
    }));
}
// Create a looger instance using Winston
const logger = winston_1.default.createLogger({
    level: LOG_LEVEL || "info", // Set the default looging level to 'info'
    format: combine(timestamp(), errors({ stack: true }), json()), // Use JSON format for log messages
    transports,
    silent: NODE_ENV === "test", // Disable logging in test environment
});
exports.logger = logger;
