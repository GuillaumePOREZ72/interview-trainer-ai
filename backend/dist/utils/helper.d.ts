/**
 * Normalize markdown code blocks to ensure they are on their own lines
 * This fixes cases where the AI puts code blocks inline with text
 */
export declare const normalizeCodeBlocks: (text: string) => string;
/**
 * Robustly clean and parse JSON from AI response
 * Handles common issues: markdown blocks, unescaped quotes, control characters
 */
export declare const cleanAndParseJSON: (rawText: string) => unknown;
