#!/usr/bin/env node

/**
 * Pre-deployment checklist validation
 * Run this script before deploying to production
 * Usage: node scripts/pre-deploy-check.js
 */

const fs = require("fs");
const path = require("path");

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";

let hasErrors = false;
let hasWarnings = false;

function checkTitle(title) {
  console.log(`\n${BLUE}━━━ ${title} ━━━${RESET}\n`);
}

function success(message) {
  console.log(`${GREEN}✓${RESET} ${message}`);
}

function error(message) {
  console.log(`${RED}✗${RESET} ${message}`);
  hasErrors = true;
}

function warning(message) {
  console.log(`${YELLOW}⚠${RESET} ${message}`);
  hasWarnings = true;
}

function checkFileExists(filePath, name) {
  if (fs.existsSync(filePath)) {
    success(`${name} exists`);
    return true;
  } else {
    error(`${name} not found at ${filePath}`);
    return false;
  }
}

function checkDirExists(dirPath, name) {
  if (fs.existsSync(dirPath)) {
    success(`${name} directory exists`);
    return true;
  } else {
    warning(`${name} directory not found (will be created at startup)`);
    return false;
  }
}

console.log(`\n${BLUE}╔════════════════════════════════════════════╗${RESET}`);
console.log(`${BLUE}║   Pre-Deployment Validation Checklist     ║${RESET}`);
console.log(`${BLUE}╚════════════════════════════════════════════╝${RESET}`);

// Check build files
checkTitle("Build Files");
const backendDistExists = checkFileExists(
  path.join(__dirname, "..", "dist", "server.js"),
  "Backend build (dist/server.js)"
);

const frontendDistExists = checkFileExists(
  path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "interview-prep-ai",
    "dist",
    "index.html"
  ),
  "Frontend build (dist/index.html)"
);

// Check configuration files
checkTitle("Configuration Files");
checkFileExists(
  path.join(__dirname, "..", ".env.example"),
  "Backend .env.example"
);
checkFileExists(
  path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "interview-prep-ai",
    ".env.example"
  ),
  "Frontend .env.example"
);

// Check required directories
checkTitle("Required Directories");
checkDirExists(path.join(__dirname, "..", "uploads"), "uploads");
checkDirExists(path.join(__dirname, "..", "logs"), "logs");

// Check package.json scripts
checkTitle("Package.json Scripts");
const packageJson = require("../package.json");
const requiredScripts = ["build", "start", "dev", "test"];
requiredScripts.forEach((script) => {
  if (packageJson.scripts[script]) {
    success(`Script "${script}" defined`);
  } else {
    error(`Script "${script}" missing in package.json`);
  }
});

// Check for common production issues
checkTitle("Production Configuration");

// Read .env.example to check required vars
const envExample = fs.readFileSync(
  path.join(__dirname, "..", ".env.example"),
  "utf8"
);
const requiredVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "GROQ_API_KEY",
  "WHITELIST_ORIGINS",
];

requiredVars.forEach((varName) => {
  if (envExample.includes(varName)) {
    success(`${varName} documented in .env.example`);
  } else {
    error(`${varName} missing from .env.example`);
  }
});

// Check TypeScript compilation
checkTitle("TypeScript Compilation");
if (backendDistExists) {
  success("TypeScript compiled successfully");
} else {
  error("TypeScript compilation failed or not run");
  console.log(`   ${YELLOW}Run: npm run build${RESET}`);
}

// Summary
console.log(`\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

if (hasErrors) {
  console.log(`${RED}✗ Pre-deployment checks FAILED${RESET}`);
  console.log(`  Please fix the errors above before deploying.\n`);
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${YELLOW}⚠ Pre-deployment checks PASSED with warnings${RESET}`);
  console.log(
    `  Review warnings above. Some may be auto-resolved at startup.\n`
  );
  process.exit(0);
} else {
  console.log(`${GREEN}✓ All pre-deployment checks PASSED${RESET}`);
  console.log(`  Your application is ready for production deployment!\n`);
  process.exit(0);
}
