/**
 * AI Endpoints Integration Tests
 *
 * WHAT THIS FILE TESTS:
 * ---------------------
 * Tests the AI-powered question and explanation generation endpoints:
 * - POST /api/ai/generate-questions - Generate interview questions
 * - POST /api/ai/generate-explanation - Generate concept explanations
 *
 * MOCKING STRATEGY:
 * -----------------
 * We mock the global `fetch` function to intercept calls to Groq API.
 *
 * WHY MOCK?
 * ---------
 * 1. SPEED: Real API calls are slow (2-5 seconds each)
 * 2. COST: Each API call costs money
 * 3. RELIABILITY: Tests shouldn't fail due to network issues
 * 4. DETERMINISM: We control exactly what the "AI" returns
 *
 * PATTERN: Spy + Mock
 * -------------------
 * We use jest.fn() to intercept fetch calls and return controlled responses.
 * This tests our code's behavior without hitting the real API.
 *
 * NOTE ON ESM:
 * ------------
 * In ESM mode, we need to import jest from @jest/globals
 */
import { jest } from "@jest/globals";
import request from "supertest";
import { createApp } from "../../../app.js";
import {
  createTestUser,
  authenticatedRequest,
  generateMockQuestionsResponse,
  generateMockExplanationResponse,
} from "../../helpers/testUtils.js";

const app = createApp();

// ============================================================================
// MOCK HELPERS - Functions to create mock API responses
// ============================================================================

/**
 * Helper type for mocked fetch function
 */
type MockedFetch = jest.MockedFunction<typeof global.fetch>;

/**
 * Creates a mock Groq API response for questions
 *
 * The Groq API returns responses in this format:
 * { choices: [{ message: { content: "JSON string here" } }] }
 */
const createMockGroqQuestionsResponse = (count: number): Partial<Response> => {
  const questions = generateMockQuestionsResponse(count);
  return {
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify(questions),
          },
        },
      ],
    }),
  };
};

/**
 * Creates a mock Groq API response for explanations
 */
const createMockGroqExplanationResponse = (): Partial<Response> => {
  const explanation = generateMockExplanationResponse();
  return {
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify(explanation),
          },
        },
      ],
    }),
  };
};

/**
 * Creates a mock Groq API error response
 */
const createMockGroqErrorResponse = (
  errorMessage: string
): Partial<Response> => ({
  ok: false,
  json: async () => ({
    error: { message: errorMessage },
  }),
});

/**
 * Helper to create a mocked fetch function
 */
const mockFetch = (response: Partial<Response>): MockedFetch => {
  return jest.fn(() =>
    Promise.resolve(response as Response)
  ) as unknown as MockedFetch;
};

/**
 * Helper to create a mocked fetch that rejects
 */
const mockFetchReject = (error: Error): MockedFetch => {
  return jest.fn(() => Promise.reject(error)) as unknown as MockedFetch;
};

// ============================================================================
// AI GENERATION TESTS
// ============================================================================

describe("AI Routes", () => {
  // Store original fetch to restore later
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;
  });

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = originalFetch;
  });

  /**
   * POST /api/ai/generate-questions
   *
   * Tests interview question generation via Groq API.
   */
  describe("POST /api/ai/generate-questions", () => {
    it("should generate questions successfully with mocked API", async () => {
      // ARRANGE: Create user and mock the API
      const { token } = await createTestUser();

      // Mock fetch to return controlled response using our helper
      global.fetch = mockFetch(createMockGroqQuestionsResponse(5));

      // ACT: Call the endpoint
      const response = await authenticatedRequest(app, token)
        .post("/api/ai/generate-questions")
        .send({
          role: "Frontend Developer",
          experience: "3",
          topicsToFocus: "React, TypeScript",
          numberOfQuestions: 5,
        });

      // ASSERT: Response contains expected data
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(5);
      expect(response.body[0]).toHaveProperty("question");
      expect(response.body[0]).toHaveProperty("answer");

      // VERIFY: Fetch was called with correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.groq.com/openai/v1/chat/completions",
        expect.any(Object)
      );
    });

    it("should return 400 if required fields are missing", async () => {
      const { token } = await createTestUser();

      // Missing 'role' field
      const response = await authenticatedRequest(app, token)
        .post("/api/ai/generate-questions")
        .send({
          experience: "3",
          topicsToFocus: "React",
          numberOfQuestions: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Missing required fields.");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/ai/generate-questions")
        .send({
          role: "Developer",
          experience: "3",
          topicsToFocus: "JavaScript",
          numberOfQuestions: 5,
        });

      expect(response.status).toBe(401);
    });

    it("should handle Groq API errors gracefully", async () => {
      const { token } = await createTestUser();

      // Mock API to return error using our helper
      global.fetch = mockFetch(
        createMockGroqErrorResponse("Rate limit exceeded")
      );

      const response = await authenticatedRequest(app, token)
        .post("/api/ai/generate-questions")
        .send({
          role: "Developer",
          experience: "3",
          topicsToFocus: "JavaScript",
          numberOfQuestions: 5,
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to generate questions");
    });

    it("should handle network errors", async () => {
      const { token } = await createTestUser();

      // Mock fetch to throw network error using our helper
      global.fetch = mockFetchReject(new Error("Network error"));

      const response = await authenticatedRequest(app, token)
        .post("/api/ai/generate-questions")
        .send({
          role: "Developer",
          experience: "3",
          topicsToFocus: "JavaScript",
          numberOfQuestions: 5,
        });

      expect(response.status).toBe(500);
    });
  });

  /**
   * POST /api/ai/generate-explanation
   *
   * Tests concept explanation generation via Groq API.
   */
  describe("POST /api/ai/generate-explanation", () => {
    it("should generate explanation successfully with mocked API", async () => {
      const { token } = await createTestUser();

      // Use our mockFetch helper for type-safe mocking
      global.fetch = mockFetch(createMockGroqExplanationResponse());

      const response = await authenticatedRequest(app, token)
        .post("/api/ai/generate-explanation")
        .send({ question: "What is a closure in JavaScript?" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("title");
      expect(response.body).toHaveProperty("explanation");
      expect(response.body.title).toBe("Understanding JavaScript Closures");
    });

    it("should return 400 if question is missing", async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .post("/api/ai/generate-explanation")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Missing required fields.");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/ai/generate-explanation")
        .send({ question: "What is React?" });

      expect(response.status).toBe(401);
    });

    it("should handle Groq API errors gracefully", async () => {
      const { token } = await createTestUser();

      // Use our mockFetch helper
      global.fetch = mockFetch(
        createMockGroqErrorResponse("Service unavailable")
      );

      const response = await authenticatedRequest(app, token)
        .post("/api/ai/generate-explanation")
        .send({ question: "What is TypeScript?" });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to generate explanation");
    });
  });
});
