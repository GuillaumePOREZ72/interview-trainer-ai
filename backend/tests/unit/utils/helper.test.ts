/**
 * Unit Tests for helper.ts - cleanAndParseJSON function
 * Tests various edge cases for AI response parsing
 */

import { cleanAndParseJSON } from "../../../utils/helper.js";

describe("cleanAndParseJSON", () => {
  describe("Valid JSON parsing", () => {
    it("should parse clean JSON array", () => {
      const input = '[{"question": "What is React?", "answer": "A library."}]';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual([
        { question: "What is React?", answer: "A library." },
      ]);
    });

    it("should parse clean JSON object", () => {
      const input = '{"title": "React Basics", "explanation": "React is..."}';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual({
        title: "React Basics",
        explanation: "React is...",
      });
    });
  });

  describe("Markdown code block removal", () => {
    it("should remove ```json code blocks", () => {
      const input = '```json\n[{"question": "Test?", "answer": "Yes."}]\n```';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual([{ question: "Test?", answer: "Yes." }]);
    });

    it("should remove ```javascript code blocks", () => {
      const input =
        '```javascript\n{"title": "JS", "explanation": "..."}\n```';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual({ title: "JS", explanation: "..." });
    });

    it("should handle text before and after JSON", () => {
      const input =
        'Here is the JSON:\n[{"question": "Q?", "answer": "A."}]\nDone!';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual([{ question: "Q?", answer: "A." }]);
    });
  });

  describe("Trailing comma handling", () => {
    it("should fix trailing comma in array", () => {
      const input = '[{"question": "Q?", "answer": "A."},]';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual([{ question: "Q?", answer: "A." }]);
    });

    it("should fix trailing comma in object", () => {
      const input = '{"title": "Test", "explanation": "...",}';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual({ title: "Test", explanation: "..." });
    });
  });

  describe("Control character handling", () => {
    it("should escape unescaped newlines in strings", () => {
      const input = '{"answer": "Line 1\nLine 2"}';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual({ answer: "Line 1\nLine 2" });
    });

    it("should escape tabs in strings", () => {
      const input = '{"answer": "Tab\there"}';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual({ answer: "Tab\there" });
    });

    it("should handle carriage returns", () => {
      const input = '{"answer": "Line\r\nBreak"}';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual({ answer: "Line\r\nBreak" });
    });
  });

  describe("Unescaped quote handling", () => {
    it("should fix unescaped quotes in middle of string", () => {
      const input = '{"answer": "Use \\"strict mode\\" in JavaScript"}';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual({ answer: 'Use "strict mode" in JavaScript' });
    });

    it("should handle already properly escaped quotes", () => {
      const input = '{"answer": "Say \\"Hello\\""}';
      const result = cleanAndParseJSON(input);
      expect(result).toEqual({ answer: 'Say "Hello"' });
    });
  });

  describe("Complex AI response scenarios", () => {
    it("should handle multi-line code examples in answers", () => {
      const input = `[{
        "question": "What is a closure?",
        "answer": "A closure is a function. Example:\\n\\nfunction outer() {\\n  let x = 10;\\n  return function inner() {\\n    return x;\\n  };\\n}"
      }]`;
      const result = cleanAndParseJSON(input) as Array<{
        question: string;
        answer: string;
      }>;
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe("What is a closure?");
      expect(result[0].answer).toContain("closure is a function");
    });

    it("should handle multiple questions in array", () => {
      const input = `[
        {"question": "Q1?", "answer": "A1."},
        {"question": "Q2?", "answer": "A2."}
      ]`;
      const result = cleanAndParseJSON(input) as Array<{
        question: string;
        answer: string;
      }>;
      expect(result).toHaveLength(2);
    });
  });

  describe("Error handling", () => {
    it("should throw error for completely invalid input", () => {
      const input = "This is not JSON at all";
      expect(() => cleanAndParseJSON(input)).toThrow();
    });

    it("should throw error for malformed structure", () => {
      const input = "[{broken json structure";
      expect(() => cleanAndParseJSON(input)).toThrow();
    });
  });
});

