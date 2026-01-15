#!/usr/bin/env node

/**
 * Log Viewer Script for Production Diagnostics
 *
 * USAGE:
 *   node scripts/view-logs.js                    # Show all recent logs
 *   node scripts/view-logs.js --upload           # Show only upload-related logs
 *   node scripts/view-logs.js --error            # Show only errors
 *   node scripts/view-logs.js --tail 50          # Show last 50 lines
 *   node scripts/view-logs.js --since "2024-01-10"  # Show logs since date
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(path.dirname(__dirname), "logs");

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  filter: null as string | null, // 'upload' | 'error' | 'all'
  tail: 100, // Default: show last 100 lines
  since: null as string | null, // Date string
};

args.forEach((arg) => {
  if (arg === "--upload") options.filter = "upload";
  else if (arg === "--error") options.filter = "error";
  else if (arg.startsWith("--tail=")) options.tail = parseInt(arg.split("=")[1]);
  else if (arg.startsWith("--since=")) options.since = arg.split("=")[1];
});

/**
 * Get all log files sorted by modification time
 */
const getLogFiles = () => {
  if (!fs.existsSync(LOGS_DIR)) {
    console.log("❌ Logs directory not found:", LOGS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(LOGS_DIR).filter((file) => file.endsWith(".log"));

  return files
    .map((file) => ({
      name: file,
      path: path.join(LOGS_DIR, file),
      mtime: fs.statSync(path.join(LOGS_DIR, file)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
};

/**
 * Parse log line and extract relevant info
 */
const parseLogLine = (line: string) => {
  const uploadKeywords = [
    "upload",
    "Upload",
    "multer",
    "Multer",
    "📤",
    "📦",
    "📁",
    "📝",
    "🔍",
  ];
  const errorKeywords = [
    "error",
    "Error",
    "ERROR",
    "❌",
    "failed",
    "Failed",
    "FAIL",
  ];

  return {
    isUpload: uploadKeywords.some((kw) => line.includes(kw)),
    isError: errorKeywords.some((kw) => line.includes(kw)),
    timestamp: extractTimestamp(line),
  };
};

/**
 * Extract timestamp from log line (simplified)
 */
const extractTimestamp = (line: string) => {
  const timestampMatch = line.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
  return timestampMatch ? timestampMatch[0] : null;
};

/**
 * Filter log lines based on options
 */
const shouldIncludeLine = (line: string): boolean => {
  if (!line.trim()) return false;

  const parsed = parseLogLine(line);

  if (options.filter === "upload") return parsed.isUpload;
  if (options.filter === "error") return parsed.isError;

  return true;
};

/**
 * Check if line is after specified date
 */
const isAfterDate = (line: string, dateStr: string): boolean => {
  const timestamp = extractTimestamp(line);
  if (!timestamp) return true; // Include lines without timestamp

  const lineDate = new Date(timestamp);
  const sinceDate = new Date(dateStr);

  return lineDate >= sinceDate;
};

/**
 * Display logs
 */
const displayLogs = () => {
  const logFiles = getLogFiles();

  if (logFiles.length === 0) {
    console.log("❌ No log files found");
    process.exit(0);
  }

  console.log(`\n📊 Log Files Found: ${logFiles.length}`);
  console.log(`   Most recent: ${logFiles[0].name}`);
  console.log(`   Filter: ${options.filter || "all"}`);
  console.log(`   Tail: ${options.tail} lines\n`);

  let allLines: string[] = [];

  // Read all log files and combine lines
  logFiles.forEach((file) => {
    const content = fs.readFileSync(file.path, "utf-8");
    const lines = content.split("\n");
    allLines = [...allLines, ...lines];
  });

  // Filter lines
  let filteredLines = allLines.filter(shouldIncludeLine);

  // Filter by date if specified
  if (options.since) {
    filteredLines = filteredLines.filter((line) => isAfterDate(line, options.since));
  }

  // Get last N lines
  const linesToShow = filteredLines.slice(-options.tail);

  if (linesToShow.length === 0) {
    console.log("❌ No matching log lines found\n");
    process.exit(0);
  }

  // Display lines with color coding
  linesToShow.forEach((line) => {
    const parsed = parseLogLine(line);

    if (parsed.isError) {
      console.log(`\x1b[31m${line}\x1b[0m`); // Red for errors
    } else if (parsed.isUpload) {
      console.log(`\x1b[36m${line}\x1b[0m`); // Cyan for upload
    } else {
      console.log(line);
    }
  });

  console.log(`\n✅ Showing ${linesToShow.length} lines\n`);
};

// Run the script
displayLogs();
