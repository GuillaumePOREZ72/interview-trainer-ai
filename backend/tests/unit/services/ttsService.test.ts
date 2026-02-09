/**
 * TTS Service Unit Tests
 * Tests ElevenLabs integration and caching logic
 */

import ttsService from "../../../services/ttsService";
import fs from "fs";
import path from "path";

describe("🔊 TTSService", () => {
  const testText = "Bonjour, ceci est un test";
  const testLanguage = "fr" as const;
  
  describe("Cache Management", () => {
    it("should generate consistent hash for same text+language", () => {
      // Access private method through any type
      const hash1 = (ttsService as any).generateHash(testText, testLanguage);
      const hash2 = (ttsService as any).generateHash(testText, testLanguage);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(32); // MD5 hash length
    });

    it("should generate different hashes for different texts", () => {
      const hash1 = (ttsService as any).generateHash("Texte 1", "fr");
      const hash2 = (ttsService as any).generateHash("Texte 2", "fr");
      
      expect(hash1).not.toBe(hash2);
    });

    it("should generate different hashes for different languages", () => {
      const hash1 = (ttsService as any).generateHash(testText, "fr");
      const hash2 = (ttsService as any).generateHash(testText, "en");
      
      expect(hash1).not.toBe(hash2);
    });

    it("should return correct cache path", () => {
      const cachePath = (ttsService as any).getCachePath(testText, testLanguage);
      
      expect(cachePath).toContain("uploads/audio/tts-cache/fr");
      expect(cachePath).toContain(".mp3");
    });
  });

  describe("Synthesize", () => {
    it("should return null for empty text", async () => {
      const result = await ttsService.synthesize("", "fr");
      expect(result).toBeNull();
    });

    it("should return null for whitespace-only text", async () => {
      const result = await ttsService.synthesize("   ", "fr");
      expect(result).toBeNull();
    });

    // Note: Actual API call tests would require mocking fetch
    // and are covered in integration tests
  });

  describe("Clear Cache", () => {
    it("should not throw when clearing cache", async () => {
      await expect(ttsService.clearCache(7)).resolves.not.toThrow();
    });
  });
});
