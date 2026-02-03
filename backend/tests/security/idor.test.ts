import request from "supertest";
import app from "../../app";
import { createTestUser } from "../helpers/testUtils";
import Session from "../../models/Session";
import Question from "../../models/Question";

describe("🔒 IDOR Vulnerability Tests - Broken Access Control", () => {
  let user1: any, token1: string, user2: any, token2: string;
  let session1: any, question1: any;

  beforeEach(async () => {
    // Créer 2 utilisateurs distincts
    const auth1 = await createTestUser();
    user1 = auth1.user;
    token1 = auth1.token;

    const auth2 = await createTestUser();
    user2 = auth2.user;
    token2 = auth2.token;

    // Créer une session pour user1
    session1 = await Session.create({
      user: user1._id,
      role: "Developer",
      experience: "Senior",
      topicsToFocus: "React",
      questions: [],
    });

    // Créer une question dans la session
    question1 = await Question.create({
      session: session1._id,
      question: "What is React?",
      answer: "A JS library",
    });
  });

  describe("🎯 Session Access Control", () => {
    it("should NOT allow user2 to access user1's session (IDOR - getSessionById)", async () => {
      const res = await request(app)
        .get(`/api/sessions/${session1._id}`)
        .set("Authorization", `Bearer ${token2}`);

      expect(res.status).toBe(404); // 404 plutôt que 403 pour ne pas révéler l'existence
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not found");
    });

    it("should allow user1 to access their own session", async () => {
      const res = await request(app)
        .get(`/api/sessions/${session1._id}`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.session._id.toString()).toBe(session1._id.toString());
    });

    it("should NOT allow user2 to delete user1's session", async () => {
      const res = await request(app)
        .delete(`/api/sessions/${session1._id}`)
        .set("Authorization", `Bearer ${token2}`);

      expect(res.status).toBe(401); // ou 403 selon l'implémentation
      expect(res.body.message).toMatch(/not authorized|unauthorized/i);
    });
  });

  describe("🎯 Question Modification Control", () => {
    it("should NOT allow user2 to pin user1's question (IDOR - togglePinQuestion)", async () => {
      const res = await request(app)
        .put(`/api/questions/${question1._id}/pin`)
        .set("Authorization", `Bearer ${token2}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Not authorized");
    });

    it("should NOT allow user2 to update note on user1's question", async () => {
      const res = await request(app)
        .put(`/api/questions/${question1._id}/note`)
        .set("Authorization", `Bearer ${token2}`)
        .send({ note: "Malicious note" });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Not authorized");
    });

    it("should NOT allow user2 to add questions to user1's session", async () => {
      const res = await request(app)
        .post("/api/questions/add")
        .set("Authorization", `Bearer ${token2}`)
        .send({
          sessionId: session1._id,
          questions: [{ question: "New?", answer: "Yes" }],
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Not authorized");
    });

    it("should allow user1 to pin their own question", async () => {
      const res = await request(app)
        .put(`/api/questions/${question1._id}/pin`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("🎯 Authentication Edge Cases", () => {
    it("should reject requests without Bearer token", async () => {
      const res = await request(app)
        .get(`/api/sessions/${session1._id}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Bearer token required");
    });

    it("should reject requests with malformed Bearer token", async () => {
      const res = await request(app)
        .get(`/api/sessions/${session1._id}`)
        .set("Authorization", "InvalidTokenFormat");

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Bearer token required");
    });

    it("should reject requests with expired token", async () => {
      // Simuler un token expiré (à implémenter selon votre logique)
      const expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      
      const res = await request(app)
        .get(`/api/sessions/${session1._id}`)
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });
});
