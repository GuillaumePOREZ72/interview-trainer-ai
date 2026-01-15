/**
 * Normalize markdown code blocks to ensure they are properly formatted
 * Fixes cases where AI puts language on separate line or text after closing ```
 */
export declare const normalizeCodeBlocks: (text: string) => string;
/**
 * Robustly clean and parse JSON from AI response
 * Handles common issues: markdown blocks, unescaped quotes, control characters
 */
export declare const cleanAndParseJSON: (rawText: string) => unknown;
