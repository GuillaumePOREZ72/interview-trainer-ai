/**
 * Session Routes Integration Tests
 * 
 * WHAT THIS FILE TESTS:
 * ---------------------
 * Tests the complete CRUD (Create, Read, Update, Delete) operations for sessions.
 * Sessions are the core feature of InterviewPrep AI - they store interview prep data.
 * 
 * TESTING PATTERN USED: Integration Testing
 * -----------------------------------------
 * - We test the full HTTP request/response cycle
 * - The database is a real MongoDB (in-memory for speed)
 * - We verify both successful operations AND error cases
 * 
 * WHY INTEGRATION TESTS FOR CRUD?
 * -------------------------------
 * CRUD operations involve multiple layers (route → controller → model → DB)
 * Testing them at the API level ensures everything works together correctly.
 */
import request from "supertest";
import { createApp } from "../../../app.js";
import {
  createTestUser,
  createTestSession,
  authenticatedRequest,
  defaultTestSession,
} from "../../helpers/testUtils.js";

// Create the Express app instance for testing
const app = createApp();

// ============================================================================
// SESSION CRUD TESTS
// ============================================================================

describe("Session Routes", () => {
  /**
   * POST /api/sessions/create
   * 
   * Tests creating a new interview prep session with questions.
   * This is the main entry point for users starting interview prep.
   */
  describe("POST /api/sessions/create", () => {
    it("should create a new session with questions", async () => {
      // ARRANGE: Create an authenticated user
      const { token } = await createTestUser();

      // ACT: Send request to create session
      const response = await authenticatedRequest(app, token)
        .post("/api/sessions/create")
        .send(defaultTestSession);

      // ASSERT: Verify the response
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.session).toHaveProperty("_id");
      expect(response.body.session.role).toBe(defaultTestSession.role);
      expect(response.body.session.experience).toBe(defaultTestSession.experience);
      expect(response.body.session.topicsToFocus).toBe(defaultTestSession.topicsToFocus);
      // Verify questions were linked to the session
      expect(response.body.session.questions).toHaveLength(2);
    });

    it("should return 401 without authentication", async () => {
      // ACT: Try to create session without token
      const response = await request(app)
        .post("/api/sessions/create")
        .send(defaultTestSession);

      // ASSERT: Should be rejected
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Not authorized, no token");
    });

    it("should create session with empty questions array", async () => {
      const { token } = await createTestUser();

      const sessionWithoutQuestions = {
        role: "Backend Developer",
        experience: "5",
        topicsToFocus: "Node.js, Databases",
        questions: [],
      };

      const response = await authenticatedRequest(app, token)
        .post("/api/sessions/create")
        .send(sessionWithoutQuestions);

      expect(response.status).toBe(201);
      expect(response.body.session.questions).toHaveLength(0);
    });
  });

  /**
   * GET /api/sessions/my-sessions
   * 
   * Tests retrieving all sessions for the authenticated user.
   * Users should only see their own sessions, not other users'.
   */
  describe("GET /api/sessions/my-sessions", () => {
    it("should return all sessions for the authenticated user", async () => {
      // ARRANGE: Create user and multiple sessions
      const { token, user } = await createTestUser();
      await createTestSession(user._id);
      await createTestSession(user._id, { role: "Backend Developer" });

      // ACT: Fetch all sessions
      const response = await authenticatedRequest(app, token)
        .get("/api/sessions/my-sessions");

      // ASSERT: Should return both sessions
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it("should return empty array if user has no sessions", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .get("/api/sessions/my-sessions");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("should not return sessions from other users", async () => {
      // ARRANGE: Create two different users
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });

      // Create session for user1 only
      await createTestSession(user1.user._id);

      // ACT: User2 tries to fetch sessions
      const response = await authenticatedRequest(app, user2.token)
        .get("/api/sessions/my-sessions");

      // ASSERT: User2 should see no sessions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("should return sessions sorted by creation date (newest first)", async () => {
      const { token, user } = await createTestUser();

      // Create sessions with slight delay to ensure different timestamps
      await createTestSession(user._id, { role: "First Session" });
      await createTestSession(user._id, { role: "Second Session" });

      const response = await authenticatedRequest(app, token)
        .get("/api/sessions/my-sessions");

      expect(response.status).toBe(200);
      // Newest should be first
      expect(response.body[0].role).toBe("Second Session");
      expect(response.body[1].role).toBe("First Session");
    });
  });

  /**
   * GET /api/sessions/:id
   * 
   * Tests retrieving a specific session by its ID.
   * Questions should be populated and sorted (pinned first).
   */
  describe("GET /api/sessions/:id", () => {
    it("should return a session by ID with populated questions", async () => {
      // ARRANGE
      const { token, user } = await createTestUser();
      const session = await createTestSession(user._id);

      // ACT
      const response = await authenticatedRequest(app, token)
        .get(`/api/sessions/${session!._id}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.session._id).toBe(session!._id.toString());
      expect(response.body.session.questions).toHaveLength(2);
      // Verify questions are populated (not just IDs)
      expect(response.body.session.questions[0]).toHaveProperty("question");
      expect(response.body.session.questions[0]).toHaveProperty("answer");
    });

    it("should return 404 for non-existent session", async () => {
      const { token } = await createTestUser();
      const fakeId = "507f1f77bcf86cd799439011"; // Valid MongoDB ObjectId format

      const response = await authenticatedRequest(app, token)
        .get(`/api/sessions/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Session not found");
    });

    it("should return 500 for invalid session ID format", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .get("/api/sessions/invalid-id");

      // MongoDB throws an error for invalid ObjectId format
      expect(response.status).toBe(500);
    });
  });

  /**
   * DELETE /api/sessions/:id
   * 
   * Tests deleting a session and its associated questions.
   * Important: Only the session owner can delete their session.
   */
  describe("DELETE /api/sessions/:id", () => {
    it("should delete a session and its questions", async () => {
      // ARRANGE
      const { token, user } = await createTestUser();
      const session = await createTestSession(user._id);
      const sessionId = session!._id.toString();

      // ACT: Delete the session
      const deleteResponse = await authenticatedRequest(app, token)
        .delete(`/api/sessions/${sessionId}`);

      // ASSERT: Delete was successful
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe("Session deleted successfully");

      // VERIFY: Session no longer exists
      const getResponse = await authenticatedRequest(app, token)
        .get(`/api/sessions/${sessionId}`);
      expect(getResponse.status).toBe(404);
    });

    it("should return 404 when deleting non-existent session", async () => {
      const { token } = await createTestUser();
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await authenticatedRequest(app, token)
        .delete(`/api/sessions/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Session not found");
    });

    it("should not allow deleting another user's session", async () => {
      // ARRANGE: Create two users
      const user1 = await createTestUser({ email: "owner@test.com" });
      const user2 = await createTestUser({ email: "attacker@test.com" });

      // Create session owned by user1
      const session = await createTestSession(user1.user._id);

      // ACT: User2 tries to delete user1's session
      const response = await authenticatedRequest(app, user2.token)
        .delete(`/api/sessions/${session!._id}`);

      // ASSERT: Should be rejected
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Not authorized to delete this session");
    });
  });
});

