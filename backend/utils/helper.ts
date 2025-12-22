// Helper function to clean and parse JSON from AI response
export const cleanAndParseJSON = (rawText: string): unknown => {
  // Remove markdown code blocks
  let cleaned = rawText
    .replace(/^```json\s*/, "")
    .replace(/```$/, "")
    .trim();

  // Fix common JSON issues: unescaped newlines inside strings
  // This regex finds strings in JSON and escapes control characters inside them
  cleaned = cleaned.replace(/"(?:[^\\"]|\\.)*"/g, (match: string) => {
    return (
      match
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
        // Remove other control characters that might break JSON
        .replace(/[\u0000-\u001f]/g, (char: string) => {
          const code = char.charCodeAt(0);
          // Keep allowed control chars if they were somehow missed (though replaced above)
          if (code === 10 || code === 13 || code === 9) return char;
          return "";
        })
    );
  });

  return JSON.parse(cleaned);
};
