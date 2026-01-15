"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanAndParseJSON = exports.normalizeCodeBlocks = void 0;
const logger_js_1 = require("../config/logger.js");
/**
 * Normalize markdown code blocks to ensure they are properly formatted
 * Fixes cases where AI puts language on separate line or text after closing ```
 */
const normalizeCodeBlocks = (text) => {
    let normalized = text;
    // Step 1: Fix case where language is on a separate line after ```
    // e.g., "```\ntypescript\ncode" -> "```typescript\ncode"
    normalized = normalized.replace(/```\s*\n(javascript|typescript|python|java|csharp|cpp|c|go|rust|ruby|php|swift|kotlin|html|css|scss|sass|sql|bash|shell|json|xml|yaml|markdown|text|jsx|tsx)\s*\n/gi, (match, lang) => "```" + lang.toLowerCase() + "\n");
    // Step 2: Fix case where text is directly after closing ``` without newline
    // e.g., "```This allows" -> "```\n\nThis allows"
    normalized = normalized.replace(/```([A-Z])/g, "```\n\n$1");
    // Step 3: Fix case where text is on same line as closing ``` with space
    // e.g., "``` This allows" -> "```\n\nThis allows"
    normalized = normalized.replace(/```\s+([A-Za-z])/g, "```\n\n$1");
    // Step 4: Ensure blank line before code blocks (if preceded by text)
    normalized = normalized.replace(/([^\n])\n(```\w*\n)/g, "$1\n\n$2");
    // Step 5: Ensure blank line after code blocks (if followed by text on next line)
    normalized = normalized.replace(/(```)\n([^\n`])/g, "$1\n\n$2");
    // Step 6: Clean up excessive newlines (more than 2)
    normalized = normalized.replace(/\n{3,}/g, "\n\n");
    // Step 7: Trim leading/trailing whitespace
    normalized = normalized.trim();
    return normalized;
};
exports.normalizeCodeBlocks = normalizeCodeBlocks;
/**
 * Recursively normalize code blocks in all string values of parsed JSON
 */
const normalizeCodeBlocksInObject = (obj) => {
    if (typeof obj === "string") {
        return (0, exports.normalizeCodeBlocks)(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(normalizeCodeBlocksInObject);
    }
    if (obj && typeof obj === "object") {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = normalizeCodeBlocksInObject(value);
        }
        return result;
    }
    return obj;
};
/**
 * Robustly clean and parse JSON from AI response
 * Handles common issues: markdown blocks, unescaped quotes, control characters
 */
const cleanAndParseJSON = (rawText) => {
    let cleaned = rawText;
    // Step 1: Extract JSON structure (find first [ or { to last ] or })
    const arrayStart = cleaned.indexOf("[");
    const objectStart = cleaned.indexOf("{");
    const start = arrayStart !== -1 && objectStart !== -1
        ? Math.min(arrayStart, objectStart)
        : Math.max(arrayStart, objectStart);
    const arrayEnd = cleaned.lastIndexOf("]");
    const objectEnd = cleaned.lastIndexOf("}");
    const end = Math.max(arrayEnd, objectEnd);
    if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
    }
    // Step 2: Try parsing as-is first (fastest path for well-formed JSON)
    try {
        const parsed = JSON.parse(cleaned);
        return normalizeCodeBlocksInObject(parsed);
    }
    catch {
        // Continue with sanitization
        logger_js_1.logger.debug("Initial JSON parse failed, attempting sanitization...");
    }
    // Step 3: Fix trailing commas before ] or }
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
    // Step 4: Fix control characters inside strings
    cleaned = fixControlCharactersInStrings(cleaned);
    // Step 5: Try parsing again
    try {
        const parsed = JSON.parse(cleaned);
        return normalizeCodeBlocksInObject(parsed);
    }
    catch {
        logger_js_1.logger.debug("Second JSON parse failed, attempting quote fix...");
    }
    // Step 6: Last resort - try to fix unescaped quotes in string values
    cleaned = fixUnescapedQuotesInValues(cleaned);
    // Step 7: Final attempt
    try {
        const parsed = JSON.parse(cleaned);
        return normalizeCodeBlocksInObject(parsed);
    }
    catch (finalError) {
        // Log the problematic content for debugging (first 500 chars)
        logger_js_1.logger.error(`JSON parsing failed after all sanitization attempts. Content preview: ${cleaned.substring(0, 500)}...`);
        throw new Error(`Failed to parse AI response as JSON: ${finalError instanceof Error ? finalError.message : "Unknown error"}`);
    }
};
exports.cleanAndParseJSON = cleanAndParseJSON;
/**
 * Fix control characters (newlines, tabs) inside JSON string values
 */
function fixControlCharactersInStrings(json) {
    let result = "";
    let inString = false;
    let escaped = false;
    for (let i = 0; i < json.length; i++) {
        const char = json[i];
        if (escaped) {
            result += char;
            escaped = false;
            continue;
        }
        if (char === "\\") {
            result += char;
            escaped = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            result += char;
            continue;
        }
        if (inString) {
            // Replace control characters with escaped versions
            const charCode = char.charCodeAt(0);
            if (charCode === 10) {
                // Literal newline character (LF)
                result += "\\n";
            }
            else if (charCode === 13) {
                // Literal carriage return (CR)
                result += "\\r";
            }
            else if (charCode === 9) {
                // Literal tab character
                result += "\\t";
            }
            else if (charCode < 32) {
                // Skip other control characters
                continue;
            }
            else {
                result += char;
            }
        }
        else {
            result += char;
        }
    }
    return result;
}
/**
 * Attempt to fix unescaped quotes inside JSON string values
 * This uses a heuristic approach for common patterns
 */
function fixUnescapedQuotesInValues(json) {
    let result = "";
    let inString = false;
    let escaped = false;
    let stringStart = -1;
    for (let i = 0; i < json.length; i++) {
        const char = json[i];
        if (escaped) {
            result += char;
            escaped = false;
            continue;
        }
        if (char === "\\") {
            result += char;
            escaped = true;
            continue;
        }
        if (char === '"') {
            if (!inString) {
                // Starting a string
                inString = true;
                stringStart = i;
                result += char;
            }
            else {
                // Potentially ending a string - check what comes next
                const nextNonSpace = getNextNonSpaceChar(json, i + 1);
                // Valid string terminators: , } ] or end of string
                if (nextNonSpace === "," ||
                    nextNonSpace === "}" ||
                    nextNonSpace === "]" ||
                    nextNonSpace === "" ||
                    nextNonSpace === ":") {
                    // This is a real string end
                    inString = false;
                    result += char;
                }
                else {
                    // This is an unescaped quote inside the string - escape it
                    result += '\\"';
                }
            }
        }
        else {
            result += char;
        }
    }
    return result;
}
/**
 * Get the next non-whitespace character in a string
 */
function getNextNonSpaceChar(str, startIndex) {
    for (let i = startIndex; i < str.length; i++) {
        const char = str[i];
        if (char !== " " && char !== "\n" && char !== "\r" && char !== "\t") {
            return char;
        }
    }
    return "";
}
