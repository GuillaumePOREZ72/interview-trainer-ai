#!/usr/bin/env node

/**
 * Generate strong JWT secrets for production
 * Usage: node generate-secrets.js
 */

const crypto = require("crypto");

console.log("🔐 Generating strong JWT secrets for production...\n");

const jwtSecret = crypto.randomBytes(32).toString("hex");
const refreshTokenSecret = crypto.randomBytes(32).toString("hex");

console.log("Copy these values to your .env file:\n");
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`REFRESH_TOKEN_SECRET=${refreshTokenSecret}`);
console.log("\n✅ Secrets generated successfully!");
console.log(
  "⚠️  Keep these secrets secure and never commit them to version control.\n"
);
