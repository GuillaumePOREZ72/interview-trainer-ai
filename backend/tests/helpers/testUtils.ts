/**
 * Test Utilities and Helpers
 *
 * This file contains reusable helper functions for testing.
 *
 * WHY USE HELPERS?
 * ----------------
 * 1. DRY (Don't Repeat Yourself) - Common setup code is written once
 * 2. Consistency - All tests use the same data creation patterns
 * 3. Maintainability - If a model changes, update only the helper
 * 4. Readability - Tests focus on behavior, not setup boilerplate
 */
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Express } from "express";
import User from "../../models/User.js";
import Session from "../../models/Session.js";
import Question from "../../models/Question.js";

// ============================================================================
// INTERFACES - Type definitions for test data
// ============================================================================

/**
 * Interface for test user data
 */
export interface TestUserData {
  name: string;
  email: string;
  password: string;
}

/**
 * Interface for authenticated user response
 */
export interface AuthenticatedUser {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  token: string;
  refreshToken: string;
}

/**
 * Interface for test session data
 */
export interface TestSessionData {
  role: string;
  experience: string;
  topicsToFocus: string;
  description?: string;
  questions?: Array<{ question: string; answer: string }>;
}

/**
 * Interface for test question data
 */
export interface TestQuestionData {
  question: string;
  answer: string;
  note?: string;
  isPinned?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique email for testing
 * Prevents duplicate key errors when multiple tests create users
 */
let testUserCounter = 0;
export const generateUniqueEmail = (): string => {
  testUserCounter++;
  return `testuser_${Date.now()}_${testUserCounter}@example.com`;
};

/**
 * Reset the test counter (useful in beforeAll)
 */
export const resetTestCounter = (): void => {
  testUserCounter = 0;
};

// ============================================================================
// DEFAULT TEST DATA - Realistic test fixtures
// ============================================================================

/**
 * Default test user data
 * Use this for quick user creation in tests
 */
export const defaultTestUser: TestUserData = {
  name: "Test User",
  email: "testuser@example.com",
  password: "TestPassword123!",
};

/**
 * Default test session data
 * Represents a typical interview prep session
 */
export const defaultTestSession: TestSessionData = {
  role: "Frontend Developer",
  experience: "3",
  topicsToFocus: "React, TypeScript, CSS",
  description: "Interview prep for senior frontend position",
  questions: [
    {
      question: "What is React?",
      answer: "React is a JavaScript library for building user interfaces.",
    },
    {
      question: "What is TypeScript?",
      answer: "TypeScript is a typed superset of JavaScript.",
    },
  ],
};

/**
 * Default test question data
 */
export const defaultTestQuestion: TestQuestionData = {
  question: "What is a closure in JavaScript?",
  answer:
    "A closure is a function that has access to variables from its outer scope.",
};

// ============================================================================
// USER HELPERS - Functions for creating and authenticating users
// ============================================================================

/**
 * Create a test user directly in the database
 *
 * USE CASE: When you need an authenticated user for protected routes
 *
 * @param userData - Optional partial user data to override defaults
 * @returns Promise with user object and JWT tokens
 */
export const createTestUser = async (
  userData: Partial<TestUserData> = {}
): Promise<AuthenticatedUser> => {
  // Generate unique email if not provided
  const data = { 
    ...defaultTestUser, 
    email: generateUniqueEmail(),
    ...userData 
  };

  // Hash password (same as registration flow)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  // Create user in database
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  // Generate tokens (same as login flow)
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!, {
    expiresIn: "10m",
  });

  const refreshToken = jwt.sign(
    { id: user._id.toString() },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d" }
  );

  return {
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    token,
    refreshToken,
  };
};

/**
 * Register a test user via API
 *
 * USE CASE: Testing the registration endpoint itself
 */
export const registerTestUser = async (
  app: Express,
  userData: Partial<TestUserData> = {}
): Promise<request.Response> => {
  const data = { 
    ...defaultTestUser, 
    email: generateUniqueEmail(),
    ...userData 
  };

  return request(app).post("/api/auth/register").send(data);
};

/**
 * Login a test user via API
 *
 * USE CASE: Testing the login endpoint itself
 */
export const loginTestUser = async (
  app: Express,
  credentials: { email: string; password: string }
): Promise<request.Response> => {
  return request(app).post("/api/auth/login").send(credentials);
};

// ============================================================================
// SESSION HELPERS - Functions for creating test sessions
// ============================================================================

/**
 * Create a test session directly in the database
 *
 * USE CASE: When you need a session for testing session/question operations
 *
 * @param userId - The user ID who owns this session
 * @param sessionData - Optional partial session data to override defaults
 * @returns Promise with the created session (with questions populated)
 */
export const createTestSession = async (
  userId: string,
  sessionData: Partial<TestSessionData> = {}
) => {
  const data = { ...defaultTestSession, ...sessionData };

  // Create the session first
  const session = await Session.create({
    user: userId,
    role: data.role,
    experience: data.experience,
    topicsToFocus: data.topicsToFocus,
    description: data.description,
  });

  // Create questions if provided
  if (data.questions && data.questions.length > 0) {
    const questionDocs = await Question.insertMany(
      data.questions.map((q) => ({
        session: session._id,
        question: q.question,
        answer: q.answer,
      }))
    );

    // Link questions to session
    session.questions = questionDocs.map((q) => q._id);
    await session.save();
  }

  // Return session with populated questions
  return Session.findById(session._id).populate("questions");
};

/**
 * Create a test question directly in the database
 *
 * USE CASE: When you need a specific question for testing pin/note operations
 */
export const createTestQuestion = async (
  sessionId: string,
  questionData: Partial<TestQuestionData> = {}
) => {
  const data = { ...defaultTestQuestion, ...questionData };

  return Question.create({
    session: sessionId,
    question: data.question,
    answer: data.answer,
    note: data.note || "",
    isPinned: data.isPinned || false,
  });
};

// ============================================================================
// REQUEST HELPERS - Utilities for making authenticated HTTP requests
// ============================================================================

/**
 * Create authenticated request helper
 *
 * USE CASE: Making requests to protected routes with a valid token
 *
 * EXAMPLE:
 *   const { token } = await createTestUser();
 *   const response = await authenticatedRequest(app, token)
 *     .post('/api/sessions/create')
 *     .send(sessionData);
 */
export const authenticatedRequest = (app: Express, token: string) => ({
  get: (url: string) =>
    request(app).get(url).set("Authorization", `Bearer ${token}`),
  post: (url: string) =>
    request(app).post(url).set("Authorization", `Bearer ${token}`),
  put: (url: string) =>
    request(app).put(url).set("Authorization", `Bearer ${token}`),
  delete: (url: string) =>
    request(app).delete(url).set("Authorization", `Bearer ${token}`),
});

// ============================================================================
// TOKEN HELPERS - Utilities for testing token validation
// ============================================================================

/**
 * Generate expired token for testing
 *
 * USE CASE: Testing that expired tokens are properly rejected
 */
export const generateExpiredToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: "-1s", // Already expired
  });
};

/**
 * Generate invalid token for testing
 *
 * USE CASE: Testing that tokens signed with wrong secret are rejected
 */
export const generateInvalidToken = (): string => {
  return jwt.sign({ id: "fake-user-id" }, "wrong-secret-key", {
    expiresIn: "10m",
  });
};

// ============================================================================
// MOCK DATA GENERATORS - For AI response mocking
// ============================================================================

/**
 * Generate mock AI questions response
 *
 * USE CASE: Mocking Groq API response for generate-questions endpoint
 */
export const generateMockQuestionsResponse = (count: number = 3) => {
  const questions = [];
  for (let i = 1; i <= count; i++) {
    questions.push({
      question: `Mock Question ${i}: What is concept ${i}?`,
      answer: `Mock Answer ${i}: This is the explanation for concept ${i}.`,
    });
  }
  return questions;
};

/**
 * Generate mock AI explanation response
 *
 * USE CASE: Mocking Groq API response for generate-explanation endpoint
 */
export const generateMockExplanationResponse = () => ({
  title: "Understanding JavaScript Closures",
  explanation:
    "A closure is a function that captures variables from its lexical scope...",
});

// ============================================================================
// MOCK INTERVIEW HELPERS - For testing mock interview feature
// ============================================================================

/**
 * Generate mock Groq API response for mock interview initial question
 *
 * USE CASE: Mocking Groq API response for mock interview question generation
 */
export const generateMockGroqQuestionResponse = () => ({
  question: "What is the difference between let and const in JavaScript?",
  category: "technical",
  difficulty: "junior",
  expectedDuration: "2-3 minutes",
  keyPointsToAssess: ["Variable declaration", "Scope understanding", "Best practices"],
});

/**
 * Generate mock Groq API response for mock interview analysis
 *
 * USE CASE: Mocking Groq API response for response analysis
 */
export const generateMockGroqAnalysisResponse = () => ({
  scores: {
    relevance: 85,
    clarity: 80,
    depth: 75,
    examples: 90,
  },
  overallScore: 82,
  feedback: {
    strengths: ["Good technical knowledge", "Clear explanation"],
    improvements: ["Could provide more examples"],
    actionableTip: "Practice with real-world scenarios",
  },
  followUpSuggested: true,
});

/**
 * Generate mock Groq API response for mock interview session report
 *
 * USE CASE: Mocking Groq API response for final report generation
 */
export const generateMockGroqReportResponse = () => ({
  summary: "Good performance overall",
  overallScore: 82,
  percentile: "above average",
  strengths: ["Technical knowledge", "Communication"],
  improvementAreas: ["Depth of examples"],
  actionItems: [
    { priority: "medium", action: "Practice more", timeframe: "1 week" },
  ],
  readiness: {
    level: "nearly ready",
    confidence: 0.75,
    recommendation: "Keep practicing",
  },
  topResponse: "Your hooks explanation was excellent",
  focusForNext: "Add more concrete examples",
});

/**
 * Create a mock interview session directly in the database
 *
 * USE CASE: When you need a mock interview session for testing
 *
 * @param userId - The user ID who owns this session
 * @param sessionData - Optional partial session data to override defaults
 * @returns Promise with the created mock interview session
 */
export const createMockInterviewSession = async (
  userId: string,
  sessionData: Partial<any> = {}
) => {
  const MockInterviewSession = (await import("../../models/MockInterviewSession.js")).default;
  
  // Default questions if not provided
  const defaultQuestions = [
    {
      questionIndex: 0,
      questionText: "What is React?",
      ttsAudioPath: "/audio/q1.mp3",
    }
  ];
  
  return MockInterviewSession.create({
    user: userId,
    role: sessionData.role || "Frontend Developer",
    experience: sessionData.experience || 5,
    topicsToFocus: sessionData.topicsToFocus || ["React", "TypeScript"],
    language: sessionData.language || "en",
    status: sessionData.status || "active",
    questions: sessionData.questions !== undefined ? sessionData.questions : defaultQuestions,
    currentQuestionIndex: sessionData.currentQuestionIndex || 0,
    completedAt: sessionData.completedAt,
    ...sessionData
  });
};

/**
 * Audio fixtures generator for mock interview tests
 *
 * USE CASE: Generate fake audio files for testing file uploads
 */
export const audioFixtures = {
  /**
   * Generate fake WebM audio file
   */
  generateWebM: (filename: string, sizeKB: number, dir: string): string => {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(dir, filename);
    const header = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]); // WebM magic number
    const dummyData = Buffer.alloc(sizeKB * 1024 - header.length, 0);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, Buffer.concat([header, dummyData]));
    return filePath;
  },

  /**
   * Generate fake MP3 audio file
   */
  generateMP3: (filename: string, sizeKB: number, dir: string): string => {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(dir, filename);
    // Minimal valid MP3 frame header
    const header = Buffer.from([0xFF, 0xFB, 0x90, 0x00]);
    const dummyData = Buffer.alloc(sizeKB * 1024 - header.length, 0);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, Buffer.concat([header, dummyData]));
    return filePath;
  },

  /**
   * Generate invalid file (text file pretending to be audio)
   */
  generateInvalid: (filename: string, dir: string): string => {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(dir, filename);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, "This is not an audio file");
    return filePath;
  },

  /**
   * Cleanup audio fixtures
   */
  cleanup: (files: string[], dir: string): void => {
    const fs = require("fs");
    files.forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
  },
};
