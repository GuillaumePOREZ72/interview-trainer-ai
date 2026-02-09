/**
 * Mock Interview History Tests
 * 
 * Tests GET /api/mock-interview/history endpoint
 * - Retrieving completed sessions only
 * - Pagination with limit parameter
 * - Sorting by completion date
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

describe("🎤 GET /api/mock-interview/history", () => {
  afterEach(async () => {
    await MockInterviewSession.deleteMany({});
  });

  describe("✅ Success Cases", () => {
    it("should return only completed sessions", async () => {
      // ARRANGE
      const { token, user } = await createTestUser();

      // Create 3 completed sessions
      for (let i = 0; i < 3; i++) {
        await createMockInterviewSession(user._id, {
          role: `Completed Session ${i}`,
          status: "completed",
          completedAt: new Date(Date.now() - i * 1000), // Different timestamps
          overallScore: 70 + i * 5,
        });
      }

      // Create 2 active sessions (should NOT appear)
      for (let i = 0; i < 2; i++) {
        await createMockInterviewSession(user._id, {
          role: `Active Session ${i}`,
          status: "active",
        });
      }

      // ACT
      const response = await authenticatedRequest(app, token)
        .get("/api/mock-interview/history");

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessions).toHaveLength(3);

      // All returned sessions should be completed
      response.body.sessions.forEach((session: any) => {
        expect(session.status).toBe("completed");
        expect(session.completedAt).toBeDefined();
      });
    });

    it("should return sessions sorted by completion date (newest first)", async () => {
      const { token, user } = await createTestUser();

      // Create sessions with different completion dates
      await createMockInterviewSession(user._id, {
        role: "Oldest",
        status: "completed",
        completedAt: new Date("2024-01-01"),
      });

      await createMockInterviewSession(user._id, {
        role: "Middle",
        status: "completed",
        completedAt: new Date("2024-06-01"),
      });

      await createMockInterviewSession(user._id, {
        role: "Newest",
        status: "completed",
        completedAt: new Date("2024-12-01"),
      });

      const response = await authenticatedRequest(app, token)
        .get("/api/mock-interview/history");

      expect(response.body.sessions).toHaveLength(3);
      expect(response.body.sessions[0].role).toBe("Newest");
      expect(response.body.sessions[1].role).toBe("Middle");
      expect(response.body.sessions[2].role).toBe("Oldest");
    });

    it("should respect limit parameter", async () => {
      const { token, user } = await createTestUser();

      // Create 5 completed sessions
      for (let i = 0; i < 5; i++) {
        await createMockInterviewSession(user._id, {
          role: `Session ${i}`,
          status: "completed",
          completedAt: new Date(Date.now() - i * 1000),
        });
      }

      const response = await authenticatedRequest(app, token)
        .get("/api/mock-interview/history?limit=2");

      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(2);
    });

    it("should default to 10 sessions if no limit specified", async () => {
      const { token, user } = await createTestUser();

      // Create 15 completed sessions
      for (let i = 0; i < 15; i++) {
        await createMockInterviewSession(user._id, {
          status: "completed",
          completedAt: new Date(Date.now() - i * 1000),
        });
      }

      const response = await authenticatedRequest(app, token)
        .get("/api/mock-interview/history");

      expect(response.body.sessions).toHaveLength(10); // Default limit
    });

    it("should return empty array if no completed sessions", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .get("/api/mock-interview/history");

      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(0);
      expect(Array.isArray(response.body.sessions)).toBe(true);
    });

    it("should include session summary fields only", async () => {
      const { token, user } = await createTestUser();
      await createMockInterviewSession(user._id, {
        role: "Frontend Developer",
        experience: 5,
        status: "completed",
        completedAt: new Date(),
        overallScore: 82,
      });

      const response = await authenticatedRequest(app, token)
        .get("/api/mock-interview/history");

      expect(response.status).toBe(200);
      const session = response.body.sessions[0];
      expect(session.role).toBe("Frontend Developer");
      expect(session.experience).toBe(5);
      expect(session.overallScore).toBe(82);
      expect(session.completedAt).toBeDefined();
      // Should NOT include full questions array
      expect(session.questions).toBeUndefined();
    });
  });

  describe("❌ Authentication Errors", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .get("/api/mock-interview/history");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Not authorized, no token");
    });
  });

  describe("❌ Security Checks", () => {
    it("should not return other users' sessions", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });

      // Create completed session for user1
      await createMockInterviewSession(user1.user._id, {
        status: "completed",
        completedAt: new Date(),
      });

      // User2 requests history
      const response = await authenticatedRequest(app, user2.token)
        .get("/api/mock-interview/history");

      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(0);
    });
  });

  describe("❌ Validation Errors", () => {
    it("should validate limit is a positive integer", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .get("/api/mock-interview/history?limit=invalid");

      expect(response.status).toBe(400);
    });

    it("should reject limit greater than 100", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .get("/api/mock-interview/history?limit=200");

      expect(response.status).toBe(400);
    });

    it("should reject negative limit", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .get("/api/mock-interview/history?limit=-5");

      expect(response.status).toBe(400);
    });
  });
});
