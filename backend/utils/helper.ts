import { logger } from "../config/logger.js";

/**
 * Robustly clean and parse JSON from AI response
 * Handles common issues: markdown blocks, unescaped quotes, control characters
 */
export const cleanAndParseJSON = (rawText: string): unknown => {
  let cleaned = rawText;

  // Step 2: Extract JSON structure (find first [ or { to last ] or })
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

  // Step 3: Try parsing as-is first (fastest path for well-formed JSON)
  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue with sanitization
    logger.debug("Initial JSON parse failed, attempting sanitization...");
  }

  // Step 4: Fix trailing commas before ] or }
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  // Step 5: Fix control characters inside strings
  cleaned = fixControlCharactersInStrings(cleaned);

  // Step 6: Try parsing again
  try {
    return JSON.parse(cleaned);
  } catch {
    logger.debug("Second JSON parse failed, attempting quote fix...");
  }

  // Step 7: Last resort - try to fix unescaped quotes in string values
  cleaned = fixUnescapedQuotesInValues(cleaned);

  // Step 8: Final attempt
  try {
    return JSON.parse(cleaned);
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
      if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else if (char.charCodeAt(0) < 32) {
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
