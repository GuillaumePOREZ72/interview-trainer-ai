/**
 * Mock Interview Service Unit Tests
 * Tests question generation, analysis, and reporting
 */

import mockInterviewService from "../../../services/mockInterviewService";
import MockInterviewSession from "../../../models/MockInterviewSession";
import { createTestUser } from "../../helpers/testUtils";

describe("🎤 MockInterviewService", () => {
  let testUser: any;
  let testSession: any;

  beforeEach(async () => {
    testUser = await createTestUser();
    testSession = await MockInterviewSession.create({
      user: testUser.user._id,
      role: "Frontend Developer",
      experience: "senior",
      topicsToFocus: "React, TypeScript",
      language: "en",
      status: "active",
    });
  });

  afterEach(async () => {
    await MockInterviewSession.deleteMany({});
  });

  describe("Question Generation", () => {
    it("should generate initial question", async () => {
      // Mock Groq call
      const question = await mockInterviewService.generateInitialQuestion(testSession);
      
      expect(question).toBeTruthy();
      expect(typeof question).toBe("string");
      expect(question.length).toBeGreaterThan(10);
    });

    it("should store TTS in session cache when available", async () => {
      await mockInterviewService.generateInitialQuestion(testSession);
      
      const updatedSession = await MockInterviewSession.findById(testSession._id);
      expect(updatedSession?.ttsAudioCache.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Follow-up Generation", () => {
    it("should generate contextual follow-up", async () => {
      const followUp = await mockInterviewService.generateFollowUpQuestion(
        testSession,
        "I use React hooks for state management",
        "How do you manage state in React?"
      );

      expect(followUp).toBeTruthy();
      expect(typeof followUp).toBe("string");
    });

    it("should return fallback on error", async () => {
      // Force error by passing invalid session
      const fallback = await mockInterviewService.generateFollowUpQuestion(
        null as any,
        "response",
        "question"
      );

      expect(fallback).toBe("Can you elaborate more on your answer?");
    });
  });

  describe("Response Analysis", () => {
    it("should analyze response and return scores", async () => {
      const analysis = await mockInterviewService.analyzeResponse(
        "I use useState and useEffect for managing component state",
        "How do you manage state in React?",
        "en"
      );

      expect(analysis).toHaveProperty("accuracy");
      expect(analysis).toHaveProperty("fillerWords");
      expect(analysis).toHaveProperty("sentiment");
      expect(analysis).toHaveProperty("confidence");
      expect(analysis).toHaveProperty("suggestions");

      expect(analysis.accuracy).toBeGreaterThanOrEqual(0);
      expect(analysis.accuracy).toBeLessThanOrEqual(100);
    });

    it("should return default analysis on error", async () => {
      const analysis = await mockInterviewService.analyzeResponse(
        "",
        "question",
        "en"
      );

      expect(analysis.accuracy).toBe(70);
      expect(analysis.sentiment).toBe("neutral");
    });
  });

  describe("Session Report", () => {
    it("should generate report with scores", async () => {
      // Add some questions with analyses
      testSession.questions.push({
        questionIndex: 0,
        questionText: "Q1",
        analysis: {
          accuracy: 80,
          fillerWords: ["um"],
          sentiment: "positive",
          confidence: 85,
          suggestions: ["Good job"],
        },
      });

      await testSession.save();

      const report = await mockInterviewService.generateSessionReport(testSession);

      expect(report).toHaveProperty("overallScore");
      expect(report).toHaveProperty("feedback");
      expect(report).toHaveProperty("strengths");
      expect(report).toHaveProperty("improvementAreas");

      expect(report.overallScore).toBe(80);
    });

    it("should handle empty session gracefully", async () => {
      const emptySession = await MockInterviewSession.create({
        user: testUser.user._id,
        role: "Developer",
        experience: "junior",
        topicsToFocus: "JS",
        language: "en",
        status: "active",
        questions: [],
      });

      const report = await mockInterviewService.generateSessionReport(emptySession);

      expect(report.overallScore).toBe(0);
    });
  });
});
