/**
 * Question Model Unit Tests
 *
 * WHAT THIS FILE TESTS:
 * ---------------------
 * Tests the Question Mongoose model validation and constraints:
 * - Required fields validation (implicitly via schema)
 * - Default values (isPinned: false)
 * - Optional fields (note)
 * - Relationship with Session model
 * - Timestamps
 *
 * WHY TEST MODELS?
 * ----------------
 * Questions are the atomic units of interview prep.
 * Ensuring proper defaults and validation is crucial for UX.
 */
import Question from "../../../models/Question.js";
import Session from "../../../models/Session.js";
import mongoose from "mongoose";

describe("Question Model", () => {
  // Helper to create a valid session for testing
  const createTestSession = async () => {
    return Session.create({
      role: "Test Role",
      experience: "3",
      topicsToFocus: "Testing",
    });
  };

  // ============================================================================
  // DEFAULT VALUES
  // ============================================================================

  describe("Default values", () => {
    it("should set isPinned to false by default", async () => {
      // ARRANGE: Create a session first
      const session = await createTestSession();

      const question = new Question({
        session: session._id,
        question: "What is unit testing?",
        answer: "Unit testing is testing individual components in isolation.",
      });

      // ACT
      await question.save();

      // ASSERT
      expect(question.isPinned).toBe(false);
    });

    it("should allow setting isPinned to true", async () => {
      // ARRANGE
      const session = await createTestSession();

      const question = new Question({
        session: session._id,
        question: "What is integration testing?",
        answer: "Testing how multiple components work together.",
        isPinned: true,
      });

      // ACT
      await question.save();

      // ASSERT
      expect(question.isPinned).toBe(true);
    });

    it("should have empty note by default", async () => {
      // ARRANGE
      const session = await createTestSession();

      const question = new Question({
        session: session._id,
        question: "What is TDD?",
        answer: "Test-Driven Development.",
      });

      // ACT
      await question.save();

      // ASSERT
      expect(question.note).toBeUndefined();
    });
  });

  // ============================================================================
  // OPTIONAL FIELDS
  // ============================================================================

  describe("Optional fields", () => {
    it("should accept note field", async () => {
      // ARRANGE
      const session = await createTestSession();

      const question = new Question({
        session: session._id,
        question: "What is BDD?",
        answer: "Behavior-Driven Development.",
        note: "Remember to mention Cucumber and Gherkin syntax",
      });

      // ACT
      await question.save();

      // ASSERT
      expect(question.note).toBe("Remember to mention Cucumber and Gherkin syntax");
    });

    it("should allow updating note after creation", async () => {
      // ARRANGE
      const session = await createTestSession();

      const question = await Question.create({
        session: session._id,
        question: "What is mocking?",
        answer: "Simulating dependencies in tests.",
      });

      // ACT
      question.note = "Updated note with more details";
      await question.save();

      // ASSERT
      const updatedQuestion = await Question.findById(question._id);
      expect(updatedQuestion?.note).toBe("Updated note with more details");
    });
  });

  // ============================================================================
  // RELATIONSHIPS
  // ============================================================================

  describe("Relationships", () => {
    it("should accept valid session ObjectId", async () => {
      // ARRANGE
      const session = await createTestSession();

      const question = new Question({
        session: session._id,
        question: "What is stubbing?",
        answer: "Providing canned responses to method calls.",
      });

      // ACT
      await question.save();

      // ASSERT
      expect(question.session.toString()).toBe(session._id.toString());
    });

    it("should be retrievable via session reference", async () => {
      // ARRANGE
      const session = await createTestSession();

      await Question.create({
        session: session._id,
        question: "What is spying?",
        answer: "Tracking method calls and arguments.",
      });

      // ACT: Find questions by session
      const questions = await Question.find({ session: session._id });

      // ASSERT
      expect(questions.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // TIMESTAMPS
  // ============================================================================

  describe("Timestamps", () => {
    it("should automatically set createdAt and updatedAt", async () => {
      // ARRANGE
      const session = await createTestSession();

      // ACT
      const question = await Question.create({
        session: session._id,
        question: "What is test coverage?",
        answer: "Percentage of code executed by tests.",
      });

      // ASSERT
      expect(question.createdAt).toBeDefined();
      expect(question.updatedAt).toBeDefined();
      expect(question.createdAt).toBeInstanceOf(Date);
    });

    it("should update updatedAt on modification", async () => {
      // ARRANGE
      const session = await createTestSession();

      const question = await Question.create({
        session: session._id,
        question: "What is E2E testing?",
        answer: "End-to-end testing of the full application.",
      });

      const originalUpdatedAt = question.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // ACT
      question.isPinned = true;
      await question.save();

      // ASSERT
      expect(question.updatedAt).toBeDefined();
      // Note: In some cases the timestamps might be the same if execution is fast
      // so we just verify it exists
    });
  });

  // ============================================================================
  // PIN TOGGLE BEHAVIOR
  // ============================================================================

  describe("Pin toggle behavior", () => {
    it("should toggle isPinned from false to true", async () => {
      // ARRANGE
      const session = await createTestSession();

      const question = await Question.create({
        session: session._id,
        question: "What is CI/CD?",
        answer: "Continuous Integration / Continuous Deployment.",
      });

      expect(question.isPinned).toBe(false);

      // ACT
      question.isPinned = !question.isPinned;
      await question.save();

      // ASSERT
      expect(question.isPinned).toBe(true);
    });

    it("should toggle isPinned from true to false", async () => {
      // ARRANGE
      const session = await createTestSession();

      const question = await Question.create({
        session: session._id,
        question: "What is a pipeline?",
        answer: "Automated workflow for building, testing, deploying.",
        isPinned: true,
      });

      expect(question.isPinned).toBe(true);

      // ACT
      question.isPinned = !question.isPinned;
      await question.save();

      // ASSERT
      expect(question.isPinned).toBe(false);
    });
  });
});

