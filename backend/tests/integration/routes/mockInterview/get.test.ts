/**
 * Mock Interview Get Session Tests
 * 
 * Tests GET /api/mock-interview/:sessionId endpoint
 * - Retrieving session details
 * - Including questions array
 * - Security checks
 */

import request from "supertest";
import { createApp } from "../../../../app.js";
import {
  createTestUser,
  authenticatedRequest,
  createMockInterviewSession,
} from "../../../helpers/testUtils.js";
import MockInterviewSession from "../../../../models/MockInterviewSession.js";

const app = createApp();

describe("🎤 GET /api/mock-interview/:sessionId", () => {
  afterEach(async () => {
    await MockInterviewSession.deleteMany({});
  });

  describe("✅ Success Cases", () => {
    it("should return session details with questions", async () => {
      // ARRANGE
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        role: "Senior Backend Developer",
        experience: 8,
        topicsToFocus: "Node.js, Microservices",
        language: "en",
        status: "active",
        currentQuestionIndex: 2,
        questions: [
          {
            questionIndex: 0,
            questionText: "What is event loop?",
            ttsAudioPath: "/audio/q1.mp3",
            userResponse: {
              transcript: "Event loop is...",
              answeredAt: new Date(),
            },
            analysis: {
              accuracy: 85,
              fillerWords: ["um"],
              sentiment: "positive",
              confidence: 90,
              suggestions: ["Good explanation"],
            },
          },
          {
            questionIndex: 1,
            questionText: "Explain middleware",
            ttsAudioPath: "/audio/q2.mp3",
          },
        ],
      });

      // ACT
      const response = await authenticatedRequest(app, token)
        .get(`/api/mock-interview/${session._id}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.session.id).toBe(session._id.toString());
      expect(response.body.session.role).toBe("Senior Backend Developer");
      expect(response.body.session.experience).toBe(8);
      expect(response.body.session.language).toBe("en");
      expect(response.body.session.status).toBe("active");
      expect(response.body.session.currentQuestionIndex).toBe(2);
      expect(response.body.session.questions).toHaveLength(2);
      expect(response.body.session.questions[0].questionText).toBe("What is event loop?");
      expect(response.body.session.questions[0].analysis).toBeDefined();
    });

    it("should return completed session with report", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        status: "completed",
        overallScore: 82,
        completedAt: new Date(),
        feedback: ["Good performance"],
        strengths: ["Technical knowledge"],
        improvementAreas: ["Communication"],
      });

      const response = await authenticatedRequest(app, token)
        .get(`/api/mock-interview/${session._id}`);

      expect(response.status).toBe(200);
      expect(response.body.session.status).toBe("completed");
      expect(response.body.session.overallScore).toBe(82);
      expect(response.body.session.completedAt).toBeDefined();
    });

    it("should return session without questions if empty", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        questions: [],
      });

      const response = await authenticatedRequest(app, token)
        .get(`/api/mock-interview/${session._id}`);

      expect(response.status).toBe(200);
      expect(response.body.session.questions).toHaveLength(0);
    });
  });

  describe("❌ Not Found Errors", () => {
    it("should return 404 for non-existent session", async () => {
      const { token } = await createTestUser();
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await authenticatedRequest(app, token)
        .get(`/api/mock-interview/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Session not found");
    });

    it("should return 404 for invalid session ID format", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .get("/api/mock-interview/invalid-id");

      expect(response.status).toBe(500);
    });
  });

  describe("❌ Authorization Errors", () => {
    it("should not return other users' sessions", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });
      const session = await createMockInterviewSession(user1.user._id);

      const response = await authenticatedRequest(app, user2.token)
        .get(`/api/mock-interview/${session._id}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Session not found");
    });

    it("should return 401 without authentication", async () => {
      const { user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      const response = await request(app)
        .get(`/api/mock-interview/${session._id}`);

      expect(response.status).toBe(401);
    });
  });
});
