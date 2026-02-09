/**
 * Mock Interview Complete Tests
 * 
 * Tests POST /api/mock-interview/:sessionId/complete endpoint
 * - Finalizing interview sessions
 * - Generating session reports
 * - Handling edge cases (empty sessions, errors)
 */

import request from "supertest";
import { createApp } from "../../../../app.js";
import {
  createTestUser,
  authenticatedRequest,
  createMockInterviewSession,
  generateMockGroqReportResponse,
} from "../../../helpers/testUtils.js";
import MockInterviewSession from "../../../../models/MockInterviewSession.js";

const app = createApp();

describe("🎤 POST /api/mock-interview/:sessionId/complete", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  afterAll(async () => {
    await MockInterviewSession.deleteMany({});
  });

  describe("✅ Success Cases", () => {
    it("should complete interview and generate report", async () => {
      // ARRANGE
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        questions: [
          {
            questionIndex: 0,
            questionText: "Q1",
            analysis: {
              accuracy: 80,
              fillerWords: [],
              sentiment: "positive",
              confidence: 85,
              suggestions: ["Good job"],
            },
          },
          {
            questionIndex: 1,
            questionText: "Q2",
            analysis: {
              accuracy: 75,
              fillerWords: ["um"],
              sentiment: "neutral",
              confidence: 70,
              suggestions: ["Good", "Could improve"],
            },
          },
        ],
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify(generateMockGroqReportResponse()),
                },
              },
            ],
          }),
        })
      ) as jest.Mock;

      // ACT
      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/complete`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report.overallScore).toBeDefined();
      expect(response.body.report.feedback).toBeDefined();
      expect(response.body.report.strengths).toBeDefined();
      expect(response.body.report.improvementAreas).toBeDefined();
      expect(response.body.report.duration).toBeDefined();

      // Verify DB
      const completedSession = await MockInterviewSession.findById(session._id);
      expect(completedSession?.status).toBe("completed");
      expect(completedSession?.completedAt).toBeDefined();
      expect(completedSession?.overallScore).toBe(77.5); // Average of 80 and 75
    });

    it("should calculate correct overall score from all questions", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        questions: [
          {
            questionIndex: 0,
            questionText: "Q1",
            analysis: { accuracy: 100, fillerWords: [], sentiment: "positive", confidence: 95, suggestions: [] },
          },
          {
            questionIndex: 1,
            questionText: "Q2",
            analysis: { accuracy: 50, fillerWords: [], sentiment: "neutral", confidence: 50, suggestions: [] },
          },
        ],
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify(generateMockGroqReportResponse()) } }],
          }),
        })
      ) as jest.Mock;

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/complete`);

      expect(response.body.report.overallScore).toBe(75); // Average of 100 and 50
    });

    it("should handle empty session (no answers)", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        questions: [],
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify(generateMockGroqReportResponse()) } }],
          }),
        })
      ) as jest.Mock;

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.report.overallScore).toBe(0);
    });

    it("should handle questions without analysis", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        questions: [
          { questionIndex: 0, questionText: "Q1" }, // No analysis
          {
            questionIndex: 1,
            questionText: "Q2",
            analysis: { accuracy: 80, fillerWords: [], sentiment: "positive", confidence: 85, suggestions: [] },
          },
        ],
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify(generateMockGroqReportResponse()) } }],
          }),
        })
      ) as jest.Mock;

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.report.overallScore).toBe(80); // Only question with analysis
    });
  });

  describe("❌ Not Found Errors", () => {
    it("should return 404 for non-existent session", async () => {
      const { token } = await createTestUser();
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${fakeId}/complete`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Session not found");
    });
  });

  describe("❌ Authorization Errors", () => {
    it("should reject unauthorized users", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });
      const session = await createMockInterviewSession(user1.user._id);

      const response = await authenticatedRequest(app, user2.token)
        .post(`/api/mock-interview/${session._id}/complete`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Session not found");
    });

    it("should return 401 without authentication", async () => {
      const { user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      const response = await request(app)
        .post(`/api/mock-interview/${session._id}/complete`);

      expect(response.status).toBe(401);
    });
  });

  describe("❌ API Errors", () => {
    it("should handle Groq API errors gracefully", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        questions: [
          {
            questionIndex: 0,
            questionText: "Q1",
            analysis: { accuracy: 80, fillerWords: [], sentiment: "positive", confidence: 85, suggestions: [] },
          },
        ],
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({ ok: false, status: 500 })
      ) as jest.Mock;

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/complete`);

      expect(response.status).toBe(500);
      expect(response.body.message).toContain("Failed");
    });

    it("should handle network errors", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        questions: [
          {
            questionIndex: 0,
            questionText: "Q1",
            analysis: { accuracy: 80, fillerWords: [], sentiment: "positive", confidence: 85, suggestions: [] },
          },
        ],
      });

      global.fetch = jest.fn(() =>
        Promise.reject(new Error("Network error"))
      ) as jest.Mock;

      const response = await authenticatedRequest(app, token)
        .post(`/api/mock-interview/${session._id}/complete`);

      expect(response.status).toBe(500);
    });
  });
});
