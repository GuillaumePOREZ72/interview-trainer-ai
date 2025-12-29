/**
 * Rate Limiter Integration Tests
 *
 * WHAT THIS FILE TESTS:
 * ---------------------
 * Tests the rate limiting middleware behavior:
 * - Requests under limit are accepted
 * - Requests over limit are blocked (429)
 * - Health check endpoint is excluded from rate limiting
 *
 * TESTING STRATEGY:
 * -----------------
 * We create a special app instance WITH rate limiting enabled
 * (normally disabled in test environment) to test the limiter behavior.
 *
 * IMPORTANT NOTE:
 * ---------------
 * The default config limits to 60 requests per minute.
 * Testing the actual limit would be slow, so we test the behavior
 * with a custom lower limit for faster tests.
 */
import request from "supertest";
import express, { Express } from "express";
import { rateLimit } from "express-rate-limit";

// ============================================================================
// TEST APP FACTORY - Create app with custom rate limiter for testing
// ============================================================================

/**
 * Create a test app with a very low rate limit for fast testing
 */
const createTestAppWithRateLimit = (limit: number = 3): Express => {
  const app = express();

  // Create a test rate limiter with low limit
  const testLimiter = rateLimit({
    windowMs: 60000, // 1 minute window
    limit: limit, // Very low limit for testing
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error:
        "You have sent too many requests in a given amount of time. Please try again later.",
    },
    skip: (req) => {
      // Skip rate limiting for health check endpoint
      return req.path === "/";
    },
  });

  // Apply rate limiter
  app.use(testLimiter);

  // Health check endpoint (skipped from rate limiting)
  app.get("/", (req, res) => {
    res.json({ status: "healthy" });
  });

  // Test endpoint (rate limited)
  app.get("/api/test", (req, res) => {
    res.json({ message: "OK" });
  });

  return app;
};

// ============================================================================
// TESTS
// ============================================================================

describe("Rate Limiter", () => {
  describe("Basic rate limiting behavior", () => {
    it("should allow requests under the limit", async () => {
      // ARRANGE: Create app with limit of 5 requests
      const app = createTestAppWithRateLimit(5);

      // ACT & ASSERT: Make 3 requests, all should succeed
      for (let i = 0; i < 3; i++) {
        const response = await request(app).get("/api/test");
        expect(response.status).toBe(200);
      }
    });

    it("should block requests over the limit with 429", async () => {
      // ARRANGE: Create app with very low limit
      const app = createTestAppWithRateLimit(2);

      // ACT: Make requests until we hit the limit
      await request(app).get("/api/test"); // Request 1 - OK
      await request(app).get("/api/test"); // Request 2 - OK

      // ASSERT: Third request should be blocked
      const response = await request(app).get("/api/test");
      expect(response.status).toBe(429);
      expect(response.body.error).toContain("too many requests");
    });

    it("should include rate limit headers in response", async () => {
      // ARRANGE
      const app = createTestAppWithRateLimit(10);

      // ACT
      const response = await request(app).get("/api/test");

      // ASSERT: Check for rate limit headers (draft-8 standard)
      expect(response.status).toBe(200);
      // Note: express-rate-limit with draft-8 uses combined 'ratelimit' header
      // Format: "10-in-1min"; r=9; t=60
      expect(response.headers).toHaveProperty("ratelimit");
      expect(response.headers).toHaveProperty("ratelimit-policy");
    });
  });

  describe("Health check endpoint exclusion", () => {
    it("should skip rate limiting for health check endpoint", async () => {
      // ARRANGE: Create app with limit of 2
      const app = createTestAppWithRateLimit(2);

      // ACT: Exhaust the rate limit on a regular endpoint
      await request(app).get("/api/test");
      await request(app).get("/api/test");

      // Verify rate limit is exhausted
      const blockedResponse = await request(app).get("/api/test");
      expect(blockedResponse.status).toBe(429);

      // ASSERT: Health check should still work (it's skipped)
      const healthResponse = await request(app).get("/");
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.status).toBe("healthy");
    });

    it("should not count health check requests towards limit", async () => {
      // ARRANGE: Create app with limit of 3
      const app = createTestAppWithRateLimit(3);

      // ACT: Make many health check requests (should not count)
      for (let i = 0; i < 10; i++) {
        await request(app).get("/");
      }

      // ASSERT: Regular endpoint should still work (limit not reached)
      const response = await request(app).get("/api/test");
      expect(response.status).toBe(200);
    });
  });

  describe("Rate limit reset", () => {
    it("should track remaining requests correctly via ratelimit header", async () => {
      // ARRANGE
      const limit = 5;
      const app = createTestAppWithRateLimit(limit);

      // ACT: Make first request
      const response1 = await request(app).get("/api/test");

      // ASSERT: Check the combined ratelimit header exists
      // Format: "5-in-1min"; r=4; t=60 (where r is remaining)
      expect(response1.status).toBe(200);
      const rateLimitHeader = response1.headers["ratelimit"] as string;
      expect(rateLimitHeader).toBeDefined();
      // Extract remaining from the header (r=X)
      const remainingMatch = rateLimitHeader.match(/r=(\d+)/);
      expect(remainingMatch).not.toBeNull();
      const remaining = parseInt(remainingMatch![1], 10);
      expect(remaining).toBe(limit - 1);
    });
  });
});
