/**
 * Mock Interview Start Tests
 * 
 * Tests POST /api/mock-interview/start endpoint
 * - Creating new mock interview sessions
 * - Validation of input data
 * - Authentication checks
 * - Groq API integration
 */

import request from "supertest";
import { createApp } from "../../../../app.js";
import {
  createTestUser,
  authenticatedRequest,
  generateMockGroqQuestionResponse,
} from "../../../helpers/testUtils.js";
import MockInterviewSession from "../../../../models/MockInterviewSession.js";

const app = createApp();

describe("🎤 POST /api/mock-interview/start", () => {
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
    it("should create session with generated question", async () => {
      // ARRANGE
      const { token } = await createTestUser();
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify(generateMockGroqQuestionResponse()),
                },
              },
            ],
          }),
        })
      ) as jest.Mock;

      // ACT
      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Frontend Developer",
          experience: 5,
          topicsToFocus: ["React", "TypeScript"],
          language: "en",
        });

      // ASSERT
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.sessionId).toBeDefined();
      expect(response.body.question.text).toBeDefined();
      expect(response.body.question.index).toBe(0);

      // Verify DB
      const session = await MockInterviewSession.findById(response.body.sessionId);
      expect(session).toBeTruthy();
      expect(session?.status).toBe("active");
      expect(session?.role).toBe("Frontend Developer");
      expect(session?.experience).toBe(5);
    });

    it("should create session with French language", async () => {
      const { token } = await createTestUser();
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    question: "Quelle est la différence entre let et const ?",
                    category: "technical",
                    difficulty: "junior",
                    expectedDuration: "2-3 minutes",
                    keyPointsToAssess: ["Déclaration", "Portée"],
                  }),
                },
              },
            ],
          }),
        })
      ) as jest.Mock;

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Développeur Frontend",
          experience: 3,
          topicsToFocus: ["React", "JavaScript"],
          language: "fr",
        });

      expect(response.status).toBe(201);
      expect(response.body.question.text).toContain("différence");

      const session = await MockInterviewSession.findById(response.body.sessionId);
      expect(session?.language).toBe("fr");
    });

    it("should default to English language if not specified", async () => {
      const { token } = await createTestUser();
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify(generateMockGroqQuestionResponse()),
                },
              },
            ],
          }),
        })
      ) as jest.Mock;

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Backend Developer",
          experience: 2,
          topicsToFocus: ["Node.js"],
        });

      expect(response.status).toBe(201);

      const session = await MockInterviewSession.findById(response.body.sessionId);
      expect(session?.language).toBe("en");
    });
  });

  describe("❌ Authentication Errors", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/mock-interview/start")
        .send({
          role: "Developer",
          experience: 5,
          topicsToFocus: ["JavaScript"],
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Not authorized, no token");
    });
  });

  describe("❌ Validation Errors", () => {
    it("should validate experience is a number", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Developer",
          experience: "senior",
          topicsToFocus: ["JavaScript"],
        });

      expect(response.status).toBe(400);
      expect(response.body.errors || response.body.message).toBeDefined();
    });

    it("should validate experience range 0-50", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Developer",
          experience: 100,
          topicsToFocus: ["JavaScript"],
        });

      expect(response.status).toBe(400);
    });

    it("should reject negative experience", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Developer",
          experience: -5,
          topicsToFocus: ["JavaScript"],
        });

      expect(response.status).toBe(400);
    });

    it("should validate topicsToFocus is an array", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Developer",
          experience: 5,
          topicsToFocus: "React",
        });

      expect(response.status).toBe(400);
    });

    it("should validate topicsToFocus has at least 1 item", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Developer",
          experience: 5,
          topicsToFocus: [],
        });

      expect(response.status).toBe(400);
    });

    it("should validate topicsToFocus has at most 10 items", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Developer",
          experience: 5,
          topicsToFocus: Array(11).fill("Topic"),
        });

      expect(response.status).toBe(400);
    });

    it("should validate language is fr or en", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Developer",
          experience: 5,
          topicsToFocus: ["JavaScript"],
          language: "de",
        });

      expect(response.status).toBe(400);
    });

    it("should require role field", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          experience: 5,
          topicsToFocus: ["JavaScript"],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("❌ API Errors", () => {
    it("should handle Groq API errors gracefully", async () => {
      const { token } = await createTestUser();
      global.fetch = jest.fn(() =>
        Promise.resolve({ ok: false, status: 500 })
      ) as jest.Mock;

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Developer",
          experience: 5,
          topicsToFocus: ["JavaScript"],
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toContain("Failed");
    });

    it("should handle network errors", async () => {
      const { token } = await createTestUser();
      global.fetch = jest.fn(() =>
        Promise.reject(new Error("Network error"))
      ) as jest.Mock;

      const response = await authenticatedRequest(app, token)
        .post("/api/mock-interview/start")
        .send({
          role: "Developer",
          experience: 5,
          topicsToFocus: ["JavaScript"],
        });

      expect(response.status).toBe(500);
    });
  });
});
