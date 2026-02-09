/**
 * Mock Interview Stream Tests
 * 
 * Tests GET /api/mock-interview/:sessionId/stream endpoint (SSE)
 * - Server-Sent Events connection
 * - Real-time status updates
 * - Heartbeat mechanism
 * - Authorization
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

describe("🎤 GET /api/mock-interview/:sessionId/stream", () => {
  afterEach(async () => {
    await MockInterviewSession.deleteMany({});
  });

  describe("✅ Success Cases", () => {
    it("should establish SSE connection and receive events", async () => {
      // ARRANGE
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      // ACT
      const response = await authenticatedRequest(app, token)
        .get(`/api/mock-interview/${session._id}/stream`)
        .set("Accept", "text/event-stream");

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/event-stream");
      expect(response.headers["cache-control"]).toBe("no-cache");
      expect(response.headers["connection"]).toBe("keep-alive");

      // Check for events in response
      const body = response.text;
      expect(body).toContain("event: connected");
      expect(body).toContain("event: status");
      expect(body).toContain(`"sessionId":"${session._id}"`);
    });

    it("should return current status for active session", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        status: "active",
        currentQuestionIndex: 2,
      });

      const response = await authenticatedRequest(app, token)
        .get(`/api/mock-interview/${session._id}/stream`)
        .set("Accept", "text/event-stream");

      expect(response.status).toBe(200);
      expect(response.text).toContain('"status":"active"');
      expect(response.text).toContain('"currentQuestion":2');
    });

    it("should return queue position when analyzing", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        status: "analyzing",
      });

      const response = await authenticatedRequest(app, token)
        .get(`/api/mock-interview/${session._id}/stream`)
        .set("Accept", "text/event-stream");

      expect(response.status).toBe(200);
      expect(response.text).toContain('"status":"analyzing"');
    });
  });

  // SKIPPED: Takes too long for regular test runs
  // Run manually when needed: jest --testNamePattern="heartbeat"
  describe.skip("⏱️ Heartbeat Tests (SLOW - skipped by default)", () => {
    it("should receive heartbeat every 30 seconds (REAL CONDITIONS)", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        status: "analyzing",
      });

      // Collect events
      const events: string[] = [];

      const response = await authenticatedRequest(app, token)
        .get(`/api/mock-interview/${session._id}/stream`)
        .set("Accept", "text/event-stream")
        .buffer()
        .parse((res: any, callback: any) => {
          res.on("data", (chunk: Buffer) => {
            events.push(chunk.toString());
          });
          res.on("end", () => callback(null, events.join("")));
        });

      // Wait for real 30 seconds to receive heartbeat
      await new Promise((resolve) => setTimeout(resolve, 31000));

      const responseText = events.join("");
      expect(responseText).toContain("event: heartbeat");
      expect(response.status).toBe(200);
    }, 35000); // Jest timeout 35s
  });

  describe("❌ Not Found Errors", () => {
    it("should return 404 for non-existent session", async () => {
      const { token } = await createTestUser();
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await authenticatedRequest(app, token)
        .get(`/api/mock-interview/${fakeId}/stream`)
        .set("Accept", "text/event-stream");

      expect(response.status).toBe(404);
    });
  });

  describe("❌ Authorization Errors", () => {
    it("should reject unauthorized users", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });
      const session = await createMockInterviewSession(user1.user._id);

      const response = await authenticatedRequest(app, user2.token)
        .get(`/api/mock-interview/${session._id}/stream`)
        .set("Accept", "text/event-stream");

      expect(response.status).toBe(404);
    });

    it("should return 401 without authentication", async () => {
      const { user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      const response = await request(app)
        .get(`/api/mock-interview/${session._id}/stream`)
        .set("Accept", "text/event-stream");

      expect(response.status).toBe(401);
    });
  });
});
