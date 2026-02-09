/**
 * Text-to-Speech Service
 * Uses ElevenLabs API for natural voice synthesis
 * Implements filesystem caching to minimize API calls
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { logger } from "../config/logger";

/**
 * TTS Service configuration
 */
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

// Voice IDs from ElevenLabs
const VOICE_IDS = {
  fr: "XB0fDUnXU5powFXDhCwa", // Bella - French female
  en: "21m00Tcm4TlvDq8ikWAM", // Rachel - English female
};

// Cache directories
const CACHE_DIR = path.join(process.cwd(), "uploads", "audio", "tts-cache");

/**
 * TTS Service class
 * Handles text-to-speech synthesis with intelligent caching
 */
class TTSService {
  /**
   * Generate speech from text using ElevenLabs API
   * Returns cached audio file path if available
   * 
   * @param text - Text to synthesize
   * @param language - Language code ("fr" or "en")
   * @returns Promise<string> - Path to audio file
   * @throws Error if synthesis fails or quota exceeded
   */
  async synthesize(text: string, language: "fr" | "en"): Promise<string | null> {
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        logger.warn("TTS: Empty text provided");
        return null;
      }

      // Check cache first
      const cachePath = this.getCachePath(text, language);
      if (fs.existsSync(cachePath)) {
        logger.info(`TTS: Cache hit for hash ${this.generateHash(text, language)}`);
        return cachePath;
      }

      // Call ElevenLabs API
      logger.info(`TTS: Cache miss, calling ElevenLabs API`);
      const audioBuffer = await this.callElevenLabsAPI(text, language);
      
      if (!audioBuffer) {
        return null; // Quota exceeded or error
      }

      // Save to cache
      fs.writeFileSync(cachePath, audioBuffer);
      logger.info(`TTS: Audio cached at ${cachePath}`);

      return cachePath;
    } catch (error) {
      logger.error(`TTS: Error synthesizing speech: ${error}`);
      return null; // Return null to trigger text fallback
    }
  }

  /**
   * Call ElevenLabs API to synthesize speech
   * 
   * @param text - Text to synthesize
   * @param language - Language code
   * @returns Promise<Buffer> - Audio data or null if failed
   */
  private async callElevenLabsAPI(
    text: string,
    language: "fr" | "en"
  ): Promise<Buffer | null> {
    const voiceId = VOICE_IDS[language];
    const url = `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle quota exceeded (429)
      if (response.status === 429) {
        logger.warn("TTS: ElevenLabs quota exceeded, falling back to text mode");
        return null;
      }
      
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  }

  /**
   * Get cache file path for text+language combination
   * 
   * @param text - Text to synthesize
   * @param language - Language code
   * @returns string - Absolute path to cache file
   */
  private getCachePath(text: string, language: string): string {
    const hash = this.generateHash(text, language);
    const langDir = path.join(CACHE_DIR, language);
    
    // Ensure directory exists
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }
    
    return path.join(langDir, `${hash}.mp3`);
  }

  /**
   * Generate MD5 hash of text+language for cache key
   * 
   * @param text - Text to synthesize
   * @param language - Language code
   * @returns string - MD5 hash
   */
  private generateHash(text: string, language: string): string {
    return crypto
      .createHash("md5")
      .update(`${text}:${language}`)
      .digest("hex");
  }

  /**
   * Clear TTS cache (useful for maintenance)
   * Removes audio files older than specified days
   * 
   * @param maxAgeDays - Maximum age in days (default: 7)
   */
  async clearCache(maxAgeDays: number = 7): Promise<void> {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const lang of ["fr", "en"]) {
      const langDir = path.join(CACHE_DIR, lang);
      
      if (!fs.existsSync(langDir)) continue;

      const files = fs.readdirSync(langDir);
      
      for (const file of files) {
        const filePath = path.join(langDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAgeMs) {
          fs.unlinkSync(filePath);
          logger.info(`TTS: Removed old cache file ${file}`);
        }
      }
    }
  }
}

// Export singleton instance
export default new TTSService();
