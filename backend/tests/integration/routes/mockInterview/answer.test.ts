/**
 * Mock Interview Answer Tests
 * 
 * Tests POST /api/mock-interview/:sessionId/answer endpoint
 * - Submitting audio answers with multipart/form-data
 * - File upload validation (size, type)
 * - Security checks (authorization, session ownership)
 */

import request from "supertest";
import { createApp } from "../../../../app.js";
import {
  createTestUser,
  authenticatedRequest,
  createMockInterviewSession,
  audioFixtures,
} from "../../../helpers/testUtils.js";
import MockInterviewSession from "../../../../models/MockInterviewSession.js";
import path from "path";
import fs from "fs";

const app = createApp();

describe("🎤 POST /api/mock-interview/:sessionId/answer", () => {
  const AUDIO_FIXTURES_DIR = path.join(__dirname, "../../../fixtures/audio");
  let testAudioWebm: string;
  let testAudioMp3: string;
  let testLargeAudio: string;
  let testInvalidFile: string;

  beforeAll(() => {
    // Generate audio fixtures
    testAudioWebm = audioFixtures.generateWebM("test-audio.webm", 8, AUDIO_FIXTURES_DIR);
    testAudioMp3 = audioFixtures.generateMP3("test-audio.mp3", 10, AUDIO_FIXTURES_DIR);
    testLargeAudio = audioFixtures.generateMP3("test-large.mp3", 6000, AUDIO_FIXTURES_DIR);
    testInvalidFile = audioFixtures.generateInvalid("test-invalid.txt", AUDIO_FIXTURES_DIR);
  });

  afterAll(() => {
    // Cleanup audio fixtures
    audioFixtures.cleanup(
      [testAudioWebm, testAudioMp3, testLargeAudio, testInvalidFile],
      AUDIO_FIXTURES_DIR
    );
  });

  afterEach(async () => {
    await MockInterviewSession.deleteMany({});
  });

  describe("✅ Success Cases", () => {
    it("should submit answer with audio file", async () => {
      // ARRANGE
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      // ACT
      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/answer`)
        .field("transcript", "I use React hooks for state management")
        .attach("audio", testAudioWebm, { contentType: "audio/webm" });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe("analyzing");

      // Verify DB
      const updatedSession = await MockInterviewSession.findById(session._id);
      expect(updatedSession?.status).toBe("analyzing");
      expect(updatedSession?.questions[0].userResponse?.transcript).toBe(
        "I use React hooks for state management"
      );
      expect(updatedSession?.questions[0].userResponse?.audioFile).toBeDefined();
    });

    it("should submit answer without audio (transcript only)", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/answer`)
        .field("transcript", "My answer without audio");

      expect(response.status).toBe(200);

      const updatedSession = await MockInterviewSession.findById(session._id);
      expect(updatedSession?.questions[0].userResponse?.audioFile).toBeUndefined();
    });

    it("should accept MP3 files", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/answer`)
        .field("transcript", "test")
        .attach("audio", testAudioMp3, { contentType: "audio/mpeg" });

      expect(response.status).toBe(200);
    });
  });

  describe("❌ Not Found Errors", () => {
    it("should return 404 for non-existent session", async () => {
      const { token } = await createTestUser();
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${fakeId}/answer`)
        .field("transcript", "test");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Session not found");
    });
  });

  describe("❌ Authorization Errors", () => {
    it("should not allow answering another user's session", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });
      const session = await createMockInterviewSession(user1.user._id);

      const response = await authenticatedRequest(app, user2.token)
        .post(`/api/mock-interview/${session._id}/answer`)
        .field("transcript", "test");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Session not found");
    });

    it("should reject completed sessions", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        status: "completed",
      });

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/answer`)
        .field("transcript", "test");

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("completed");
    });
  });

  describe("❌ File Upload Errors", () => {
    it("should reject files larger than 5MB", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/answer`)
        .field("transcript", "test")
        .attach("audio", testLargeAudio);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("too large");
    });

    it("should reject invalid file types", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/answer`)
        .field("transcript", "test")
        .attach("audio", testInvalidFile);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid");
    });
  });

  describe("❌ Authentication Errors", () => {
    it("should return 401 without authentication", async () => {
      const { user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      const response = await request(app)
        .post(`/api/mock-interview/${session._id}/answer`)
        .field("transcript", "test");

      expect(response.status).toBe(401);
    });
  });
});
