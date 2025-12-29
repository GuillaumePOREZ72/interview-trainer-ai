/**
 * Auth Middleware Unit Tests
 *
 * WHAT THIS FILE TESTS:
 * ---------------------
 * Tests the `protect` middleware function in isolation.
 * This middleware guards protected routes by validating JWT tokens.
 *
 * TESTING PATTERN: Unit Testing with Mocks
 * -----------------------------------------
 * We mock Express Request/Response objects and the User model
 * to test the middleware logic without making real DB calls.
 *
 * WHY UNIT TEST THE MIDDLEWARE?
 * -----------------------------
 * 1. It's the security gate for all protected routes
 * 2. Edge cases (expired tokens, deleted users) are hard to test via integration
 * 3. Fast execution - no DB or network calls
 */
import { jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { protect } from "../../../middlewares/authMiddleware.js";
import User from "../../../models/User.js";
import {
  createTestUser,
  generateExpiredToken,
  generateInvalidToken,
} from "../../helpers/testUtils.js";

// ============================================================================
// MOCK HELPERS
// ============================================================================

/**
 * Create a mock Express Request object
 */
const createMockRequest = (authHeader?: string): Partial<Request> => ({
  headers: {
    authorization: authHeader,
  },
  ip: "127.0.0.1",
});

/**
 * Create a mock Express Response object with jest spies
 */
const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res) as unknown as Response["status"];
  res.json = jest.fn().mockReturnValue(res) as unknown as Response["json"];
  return res;
};

/**
 * Create a mock next function
 */
const createMockNext = (): NextFunction => jest.fn() as NextFunction;

// ============================================================================
// TESTS
// ============================================================================

describe("Auth Middleware - protect", () => {
  describe("Successful authentication", () => {
    it("should call next() with valid token and set req.user", async () => {
      // ARRANGE: Create a real user and get their token
      const { user, token } = await createTestUser({
        email: "middleware-test@example.com",
      });

      const req = createMockRequest(`Bearer ${token}`) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      // ACT: Call the middleware
      await protect(req, res, next);

      // ASSERT: next() should be called and user should be set
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?._id.toString()).toBe(user._id);
    });
  });

  describe("Missing or invalid authorization header", () => {
    it("should return 401 when no Authorization header is present", async () => {
      // ARRANGE: Request without auth header
      const req = createMockRequest(undefined) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      // ACT
      await protect(req, res, next);

      // ASSERT
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not authorized, no token",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when Authorization header is empty", async () => {
      const req = createMockRequest("") as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when Authorization header does not start with Bearer", async () => {
      const req = createMockRequest("Basic sometoken") as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not authorized, no token",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Invalid tokens", () => {
    it("should return 401 with expired token", async () => {
      // ARRANGE: Create user and expired token
      const { user } = await createTestUser({
        email: "expired-token@example.com",
      });
      const expiredToken = generateExpiredToken(user._id);

      const req = createMockRequest(`Bearer ${expiredToken}`) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      // ACT
      await protect(req, res, next);

      // ASSERT
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Token failed" })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 with token signed by wrong secret", async () => {
      const invalidToken = generateInvalidToken();

      const req = createMockRequest(`Bearer ${invalidToken}`) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 with malformed token", async () => {
      const req = createMockRequest("Bearer not-a-valid-jwt") as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

