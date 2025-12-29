/**
 * User Model Unit Tests
 *
 * WHAT THIS FILE TESTS:
 * ---------------------
 * Tests the User Mongoose model validation and constraints:
 * - Required fields validation (name, email, password)
 * - Unique email constraint
 * - Default values
 * - Timestamps
 *
 * WHY TEST MODELS?
 * ----------------
 * 1. Ensure data integrity at the database level
 * 2. Catch validation errors before they reach controllers
 * 3. Document expected model behavior
 */
import User from "../../../models/User.js";
import mongoose from "mongoose";

describe("User Model", () => {
  // ============================================================================
  // REQUIRED FIELDS VALIDATION
  // ============================================================================

  describe("Required fields validation", () => {
    it("should require name field", async () => {
      // ARRANGE: Create user without name
      const user = new User({
        email: "test@example.com",
        password: "hashedPassword123",
      });

      // ACT & ASSERT: Validation should fail
      await expect(user.validate()).rejects.toThrow();

      try {
        await user.validate();
      } catch (error) {
        expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
        const validationError = error as mongoose.Error.ValidationError;
        expect(validationError.errors.name).toBeDefined();
      }
    });

    it("should require email field", async () => {
      // ARRANGE: Create user without email
      const user = new User({
        name: "Test User",
        password: "hashedPassword123",
      });

      // ACT & ASSERT
      await expect(user.validate()).rejects.toThrow();

      try {
        await user.validate();
      } catch (error) {
        const validationError = error as mongoose.Error.ValidationError;
        expect(validationError.errors.email).toBeDefined();
      }
    });

    it("should require password field", async () => {
      // ARRANGE: Create user without password
      const user = new User({
        name: "Test User",
        email: "test@example.com",
      });

      // ACT & ASSERT
      await expect(user.validate()).rejects.toThrow();

      try {
        await user.validate();
      } catch (error) {
        const validationError = error as mongoose.Error.ValidationError;
        expect(validationError.errors.password).toBeDefined();
      }
    });

    it("should pass validation with all required fields", async () => {
      // ARRANGE: Create valid user
      const user = new User({
        name: "Valid User",
        email: "valid@example.com",
        password: "hashedPassword123",
      });

      // ACT & ASSERT: Should not throw
      await expect(user.validate()).resolves.toBeUndefined();
    });
  });

  // ============================================================================
  // DEFAULT VALUES
  // ============================================================================

  describe("Default values", () => {
    it("should set profileImageUrl to null by default", async () => {
      // ARRANGE
      const user = new User({
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword123",
      });

      // ACT
      await user.save();

      // ASSERT
      expect(user.profileImageUrl).toBeNull();
    });

    it("should accept custom profileImageUrl", async () => {
      // ARRANGE
      const imageUrl = "https://example.com/avatar.png";
      const user = new User({
        name: "Test User",
        email: "custom-image@example.com",
        password: "hashedPassword123",
        profileImageUrl: imageUrl,
      });

      // ACT
      await user.save();

      // ASSERT
      expect(user.profileImageUrl).toBe(imageUrl);
    });
  });

  // ============================================================================
  // UNIQUE CONSTRAINTS
  // ============================================================================

  describe("Unique email constraint", () => {
    it("should enforce unique email", async () => {
      // ARRANGE: Create first user
      await User.create({
        name: "First User",
        email: "unique-test@example.com",
        password: "hashedPassword123",
      });

      // ACT: Try to create second user with same email
      const duplicateUser = new User({
        name: "Second User",
        email: "unique-test@example.com",
        password: "differentPassword",
      });

      // ASSERT: Should throw duplicate key error
      await expect(duplicateUser.save()).rejects.toThrow();
    });
  });

  // ============================================================================
  // TIMESTAMPS
  // ============================================================================

  describe("Timestamps", () => {
    it("should automatically set createdAt and updatedAt", async () => {
      // ARRANGE & ACT
      const user = await User.create({
        name: "Timestamp User",
        email: "timestamp@example.com",
        password: "hashedPassword123",
      });

      // ASSERT
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});

