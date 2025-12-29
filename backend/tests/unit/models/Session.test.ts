/**
 * Session Model Unit Tests
 *
 * WHAT THIS FILE TESTS:
 * ---------------------
 * Tests the Session Mongoose model validation and constraints:
 * - Required fields validation (role, experience, topicsToFocus)
 * - Optional fields (description, user, questions)
 * - Relationships with User and Question models
 * - Timestamps
 *
 * WHY TEST MODELS?
 * ----------------
 * Sessions are the core entity of the application.
 * Ensuring proper validation prevents data corruption.
 */
import Session from "../../../models/Session.js";
import User from "../../../models/User.js";
import Question from "../../../models/Question.js";
import mongoose from "mongoose";

describe("Session Model", () => {
  // ============================================================================
  // REQUIRED FIELDS VALIDATION
  // ============================================================================

  describe("Required fields validation", () => {
    it("should require role field", async () => {
      // ARRANGE: Create session without role
      const session = new Session({
        experience: "3",
        topicsToFocus: "React, TypeScript",
      });

      // ACT & ASSERT
      await expect(session.validate()).rejects.toThrow();

      try {
        await session.validate();
      } catch (error) {
        const validationError = error as mongoose.Error.ValidationError;
        expect(validationError.errors.role).toBeDefined();
      }
    });

    it("should require experience field", async () => {
      // ARRANGE: Create session without experience
      const session = new Session({
        role: "Frontend Developer",
        topicsToFocus: "React, TypeScript",
      });

      // ACT & ASSERT
      await expect(session.validate()).rejects.toThrow();

      try {
        await session.validate();
      } catch (error) {
        const validationError = error as mongoose.Error.ValidationError;
        expect(validationError.errors.experience).toBeDefined();
      }
    });

    it("should require topicsToFocus field", async () => {
      // ARRANGE: Create session without topicsToFocus
      const session = new Session({
        role: "Frontend Developer",
        experience: "3",
      });

      // ACT & ASSERT
      await expect(session.validate()).rejects.toThrow();

      try {
        await session.validate();
      } catch (error) {
        const validationError = error as mongoose.Error.ValidationError;
        expect(validationError.errors.topicsToFocus).toBeDefined();
      }
    });

    it("should pass validation with all required fields", async () => {
      // ARRANGE
      const session = new Session({
        role: "Backend Developer",
        experience: "5",
        topicsToFocus: "Node.js, MongoDB, Express",
      });

      // ACT & ASSERT
      await expect(session.validate()).resolves.toBeUndefined();
    });
  });

  // ============================================================================
  // OPTIONAL FIELDS
  // ============================================================================

  describe("Optional fields", () => {
    it("should accept optional description field", async () => {
      // ARRANGE
      const session = new Session({
        role: "Full Stack Developer",
        experience: "4",
        topicsToFocus: "React, Node.js",
        description: "Preparing for senior position interview",
      });

      // ACT
      await session.save();

      // ASSERT
      expect(session.description).toBe("Preparing for senior position interview");
    });

    it("should work without description", async () => {
      // ARRANGE
      const session = new Session({
        role: "DevOps Engineer",
        experience: "2",
        topicsToFocus: "Docker, Kubernetes, AWS",
      });

      // ACT
      await session.save();

      // ASSERT
      expect(session.description).toBeUndefined();
    });

    it("should initialize questions as empty array", async () => {
      // ARRANGE
      const session = new Session({
        role: "QA Engineer",
        experience: "3",
        topicsToFocus: "Testing, Selenium",
      });

      // ACT
      await session.save();

      // ASSERT
      expect(session.questions).toBeDefined();
      expect(Array.isArray(session.questions)).toBe(true);
      expect(session.questions).toHaveLength(0);
    });
  });

  // ============================================================================
  // RELATIONSHIPS
  // ============================================================================

  describe("Relationships", () => {
    it("should accept valid user ObjectId", async () => {
      // ARRANGE: Create a user first
      const user = await User.create({
        name: "Session Owner",
        email: "session-owner@example.com",
        password: "hashedPassword123",
      });

      const session = new Session({
        user: user._id,
        role: "Data Scientist",
        experience: "3",
        topicsToFocus: "Python, ML, TensorFlow",
      });

      // ACT
      await session.save();

      // ASSERT
      expect(session.user.toString()).toBe(user._id.toString());
    });
  });

  // ============================================================================
  // TIMESTAMPS
  // ============================================================================

  describe("Timestamps", () => {
    it("should automatically set createdAt and updatedAt", async () => {
      // ARRANGE & ACT
      const session = await Session.create({
        role: "Mobile Developer",
        experience: "2",
        topicsToFocus: "React Native, iOS, Android",
      });

      // ASSERT
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
      expect(session.createdAt).toBeInstanceOf(Date);
    });
  });
});

