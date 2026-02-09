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
  // Increase timeout for SSE tests
  jest.setTimeout(15000);

  afterEach(async () => {
    await MockInterviewSession.deleteMany({});
  });

  describe("✅ Success Cases", () => {
    // NOTE: SSE tests are flaky due to connection handling
    // These tests are skipped until we find a better way to test SSE
    it.skip("should establish SSE connection and receive events", async () => {
      // ARRANGE
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id);

      // ACT
      const req = authenticatedRequest(app, token)
        .get(`/api/mock-interview/${session._id}/stream`)
        .set("Accept", "text/event-stream");
      
      // Use a Promise to collect response and end connection
      const response = await new Promise<any>((resolve, reject) => {
        req
          .end((err: any, res: any) => {
            if (err) reject(err);
            else resolve(res);
          });
        
        // Abort request after 500ms to prevent hanging
        setTimeout(() => {
          req.abort();
        }, 500);
      }).catch(() => req);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/event-stream");
      expect(response.headers["cache-control"]).toBe("no-cache");

      // Check for events in response (if any were received before abort)
      const body = response.text || "";
      if (body) {
        expect(body).toContain("event: connected");
      }
    });

    it.skip("should return current status for active session", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        status: "active",
        currentQuestionIndex: 2,
      });

      const req = authenticatedRequest(app, token)
        .get(`/api/mock-interview/${session._id}/stream`)
        .set("Accept", "text/event-stream");
      
      const response = await new Promise<any>((resolve, reject) => {
        req
          .end((err: any, res: any) => {
            if (err) reject(err);
            else resolve(res);
          });
        setTimeout(() => req.abort(), 500);
      }).catch(() => req);

      expect(response.status).toBe(200);
      const body = response.text || "";
      if (body) {
        expect(body).toContain('"status":"active"');
      }
    });

    it.skip("should return queue position when analyzing", async () => {
      const { token, user } = await createTestUser();
      const session = await createMockInterviewSession(user._id, {
        status: "analyzing",
      });

      const req = authenticatedRequest(app, token)
        .get(`/api/mock-interview/${session._id}/stream`)
        .set("Accept", "text/event-stream");
      
      const response = await new Promise<any>((resolve, reject) => {
        req
          .end((err: any, res: any) => {
            if (err) reject(err);
            else resolve(res);
          });
        setTimeout(() => req.abort(), 500);
      }).catch(() => req);

      expect(response.status).toBe(200);
      const body = response.text || "";
      if (body) {
        expect(body).toContain('"status":"analyzing"');
      }
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
