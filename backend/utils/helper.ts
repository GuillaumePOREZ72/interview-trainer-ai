import { logger } from "../config/logger.js";

/**
 * Normalize markdown code blocks to ensure they are on their own lines
 * This fixes cases where the AI puts code blocks inline with text
 */
export const normalizeCodeBlocks = (text: string): string => {
  // Match complete code blocks: ```language\ncode\n``` and ensure proper spacing
  // This regex captures: opening ```, optional language, code content, closing ```
  let normalized = text.replace(/(```(\w*)\n[\s\S]*?```)/g, (match) => {
    return "\n\n" + match + "\n\n";
  });

  // Clean up excessive newlines (more than 2)
  normalized = normalized.replace(/\n{3,}/g, "\n\n");

  // Trim leading/trailing whitespace
  normalized = normalized.trim();

  return normalized;
};

/**
 * Recursively normalize code blocks in all string values of parsed JSON
 */
const normalizeCodeBlocksInObject = (obj: unknown): unknown => {
  if (typeof obj === "string") {
    return normalizeCodeBlocks(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeCodeBlocksInObject);
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
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
export const cleanAndParseJSON = (rawText: string): unknown => {
  let cleaned = rawText;

  // Step 1: Extract JSON structure (find first [ or { to last ] or })
  const arrayStart = cleaned.indexOf("[");
  const objectStart = cleaned.indexOf("{");
  const start =
    arrayStart !== -1 && objectStart !== -1
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
  } catch {
    // Continue with sanitization
    logger.debug("Initial JSON parse failed, attempting sanitization...");
  }

  // Step 3: Fix trailing commas before ] or }
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  // Step 4: Fix control characters inside strings
  cleaned = fixControlCharactersInStrings(cleaned);

  // Step 5: Try parsing again
  try {
    const parsed = JSON.parse(cleaned);
    return normalizeCodeBlocksInObject(parsed);
  } catch {
    logger.debug("Second JSON parse failed, attempting quote fix...");
  }

  // Step 6: Last resort - try to fix unescaped quotes in string values
  cleaned = fixUnescapedQuotesInValues(cleaned);

  // Step 7: Final attempt
  try {
    const parsed = JSON.parse(cleaned);
    return normalizeCodeBlocksInObject(parsed);
  } catch (finalError) {
    // Log the problematic content for debugging (first 500 chars)
    logger.error(
      `JSON parsing failed after all sanitization attempts. Content preview: ${cleaned.substring(
        0,
        500
      )}...`
    );
    throw new Error(
      `Failed to parse AI response as JSON: ${
        finalError instanceof Error ? finalError.message : "Unknown error"
      }`
    );
  }
};

/**
 * Fix control characters (newlines, tabs) inside JSON string values
 */
function fixControlCharactersInStrings(json: string): string {
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
      } else if (charCode === 13) {
        // Literal carriage return (CR)
        result += "\\r";
      } else if (charCode === 9) {
        // Literal tab character
        result += "\\t";
      } else if (charCode < 32) {
        // Skip other control characters
        continue;
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Attempt to fix unescaped quotes inside JSON string values
 * This uses a heuristic approach for common patterns
 */
function fixUnescapedQuotesInValues(json: string): string {
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
      } else {
        // Potentially ending a string - check what comes next
        const nextNonSpace = getNextNonSpaceChar(json, i + 1);

        // Valid string terminators: , } ] or end of string
        if (
          nextNonSpace === "," ||
          nextNonSpace === "}" ||
          nextNonSpace === "]" ||
          nextNonSpace === "" ||
          nextNonSpace === ":"
        ) {
          // This is a real string end
          inString = false;
          result += char;
        } else {
          // This is an unescaped quote inside the string - escape it
          result += '\\"';
        }
      }
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Get the next non-whitespace character in a string
 */
function getNextNonSpaceChar(str: string, startIndex: number): string {
  for (let i = startIndex; i < str.length; i++) {
    const char = str[i];
    if (char !== " " && char !== "\n" && char !== "\r" && char !== "\t") {
      return char;
    }
  }
  return "";
}
