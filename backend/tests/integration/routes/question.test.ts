/**
 * Question Routes Integration Tests
 * 
 * WHAT THIS FILE TESTS:
 * ---------------------
 * Tests operations on individual questions within sessions:
 * - Adding new questions to an existing session
 * - Toggling the "pinned" status of a question
 * - Updating notes on a question
 * 
 * BUSINESS CONTEXT:
 * -----------------
 * Users can:
 * 1. Generate more questions for an existing session
 * 2. Pin important questions to keep them at the top
 * 3. Add personal notes to questions for study reference
 */
import request from "supertest";
import { createApp } from "../../../app.js";
import {
  createTestUser,
  createTestSession,
  createTestQuestion,
  authenticatedRequest,
} from "../../helpers/testUtils.js";

const app = createApp();

// ============================================================================
// QUESTION MANAGEMENT TESTS
// ============================================================================

describe("Question Routes", () => {
  /**
   * POST /api/questions/add
   * 
   * Tests adding new questions to an existing session.
   * This is used when users generate more questions via AI.
   */
  describe("POST /api/questions/add", () => {
    it("should add questions to an existing session", async () => {
      // ARRANGE: Create user and session
      const { token, user } = await createTestUser();
      const session = await createTestSession(user._id);

      const newQuestions = [
        { question: "New Q1?", answer: "Answer 1" },
        { question: "New Q2?", answer: "Answer 2" },
      ];

      // ACT: Add questions to session
      const response = await authenticatedRequest(app, token)
        .post("/api/questions/add")
        .send({
          sessionId: session!._id.toString(),
          questions: newQuestions,
        });

      // ASSERT: Questions were created
      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].question).toBe("New Q1?");
      expect(response.body[1].question).toBe("New Q2?");
    });

    it("should return 404 for non-existent session", async () => {
      const { token } = await createTestUser();
      const fakeSessionId = "507f1f77bcf86cd799439011";

      const response = await authenticatedRequest(app, token)
        .post("/api/questions/add")
        .send({
          sessionId: fakeSessionId,
          questions: [{ question: "Q?", answer: "A" }],
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Session not found");
    });

    it("should return 400 for invalid input data", async () => {
      const { token } = await createTestUser();

      // Missing sessionId
      const response = await authenticatedRequest(app, token)
        .post("/api/questions/add")
        .send({ questions: [{ question: "Q?", answer: "A" }] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid input data");
    });

    it("should return 400 if questions is not an array", async () => {
      const { token, user } = await createTestUser();
      const session = await createTestSession(user._id);

      const response = await authenticatedRequest(app, token)
        .post("/api/questions/add")
        .send({
          sessionId: session!._id.toString(),
          questions: "not an array",
        });

      expect(response.status).toBe(400);
    });
  });

  /**
   * POST /api/questions/:id/pin
   * 
   * Tests toggling the pinned status of a question.
   * Pinned questions appear at the top of the list for easy access.
   */
  describe("POST /api/questions/:id/pin", () => {
    it("should pin an unpinned question", async () => {
      // ARRANGE: Create question with isPinned = false
      const { token, user } = await createTestUser();
      const session = await createTestSession(user._id);
      const question = await createTestQuestion(session!._id.toString(), {
        isPinned: false,
      });

      // ACT: Toggle pin
      const response = await authenticatedRequest(app, token)
        .post(`/api/questions/${question._id}/pin`);

      // ASSERT: Question is now pinned
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.question.isPinned).toBe(true);
    });

    it("should unpin a pinned question", async () => {
      const { token, user } = await createTestUser();
      const session = await createTestSession(user._id);
      const question = await createTestQuestion(session!._id.toString(), {
        isPinned: true,
      });

      const response = await authenticatedRequest(app, token)
        .post(`/api/questions/${question._id}/pin`);

      expect(response.status).toBe(200);
      expect(response.body.question.isPinned).toBe(false);
    });

    it("should return 404 for non-existent question", async () => {
      const { token } = await createTestUser();
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await authenticatedRequest(app, token)
        .post(`/api/questions/${fakeId}/pin`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Question not found");
    });
  });

  /**
   * POST /api/questions/:id/note
   * 
   * Tests updating the personal note on a question.
   * Users can add study notes or reminders to questions.
   */
  describe("POST /api/questions/:id/note", () => {
    it("should update a question note", async () => {
      const { token, user } = await createTestUser();
      const session = await createTestSession(user._id);
      const question = await createTestQuestion(session!._id.toString());

      const response = await authenticatedRequest(app, token)
        .post(`/api/questions/${question._id}/note`)
        .send({ note: "Remember to study closures!" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.question.note).toBe("Remember to study closures!");
    });

    it("should clear a note when sending empty string", async () => {
      const { token, user } = await createTestUser();
      const session = await createTestSession(user._id);
      const question = await createTestQuestion(session!._id.toString(), {
        note: "Existing note",
      });

      const response = await authenticatedRequest(app, token)
        .post(`/api/questions/${question._id}/note`)
        .send({ note: "" });

      expect(response.status).toBe(200);
      expect(response.body.question.note).toBe("");
    });

    it("should return 404 for non-existent question", async () => {
      const { token } = await createTestUser();
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await authenticatedRequest(app, token)
        .post(`/api/questions/${fakeId}/note`)
        .send({ note: "Some note" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Question not found");
    });
  });
});

