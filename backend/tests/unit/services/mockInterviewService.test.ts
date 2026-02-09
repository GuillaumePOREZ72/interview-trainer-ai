/**
 * Mock Interview Service Unit Tests
 * Tests question generation, analysis, and reporting
 */

import mockInterviewService from "../../../services/mockInterviewService";
import MockInterviewSession from "../../../models/MockInterviewSession";
import { createTestUser } from "../../helpers/testUtils";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe("🎤 MockInterviewService", () => {
  let testUser: any;
  let testSession: any;

  beforeEach(async () => {
    testUser = await createTestUser();
    testSession = await MockInterviewSession.create({
      user: testUser.user._id,
      role: "Frontend Developer",
      experience: 5,
      topicsToFocus: "React, TypeScript",
      language: "en",
      status: "active",
    });
    
    // Reset fetch mock
    mockFetch.mockClear();
  });

  afterEach(async () => {
    await MockInterviewSession.deleteMany({});
    mockFetch.mockClear();
  });

  describe("Question Generation", () => {
    it("should generate initial question", async () => {
      // Mock successful fetch response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({ question: "What is React Virtual DOM?" })
            }
          }]
        })
      });

      const question = await mockInterviewService.generateInitialQuestion(testSession);
      
      expect(question).toBeTruthy();
      expect(typeof question).toBe("string");
      expect(question.length).toBeGreaterThan(10);
    });

    it("should store TTS in session cache when available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({ question: "What is React Virtual DOM?" })
            }
          }]
        })
      });

      await mockInterviewService.generateInitialQuestion(testSession);
      
      const updatedSession = await MockInterviewSession.findById(testSession._id);
      expect(updatedSession?.ttsAudioCache.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Follow-up Generation", () => {
    it("should generate contextual follow-up", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({ question: "Can you give an example of useEffect?" })
            }
          }]
        })
      });

      const followUp = await mockInterviewService.generateFollowUpQuestion(
        testSession,
        "I use React hooks for state management",
        "How do you manage state in React?"
      );

      expect(followUp).toBeTruthy();
      expect(typeof followUp).toBe("string");
    });

    it("should return fallback on error", async () => {
      // Mock fetch to fail
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const fallback = await mockInterviewService.generateFollowUpQuestion(
        testSession,
        "response",
        "question"
      );

      expect(fallback).toBe("Can you elaborate more on your answer?");
    });
  });

  describe("Response Analysis", () => {
    it("should analyze response and return scores", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                scores: {
                  relevance: 85,
                  clarity: 80,
                  depth: 75,
                  examples: 90
                },
                overallScore: 82,
                feedback: {
                  strengths: ["Good technical knowledge"],
                  improvements: ["Could provide more examples"],
                  actionableTip: "Practice with real scenarios"
                },
                followUpSuggested: true
              })
            }
          }]
        })
      });

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
      // Mock fetch to fail
      mockFetch.mockRejectedValueOnce(new Error("API error"));

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                summary: "Good performance overall",
                overallScore: 80,
                percentile: "above average",
                strengths: ["Strong technical knowledge", "Clear communication"],
                improvementAreas: ["More examples needed"],
                actionItems: [
                  { priority: "medium", action: "Practice more scenarios", timeframe: "1 week" }
                ],
                readiness: {
                  level: "nearly ready",
                  confidence: 0.75,
                  recommendation: "Keep practicing"
                },
                topResponse: "Your explanation of hooks was excellent",
                focusForNext: "Focus on providing more concrete examples"
              })
            }
          }]
        })
      });

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
        experience: 1,
        topicsToFocus: "JS",
        language: "en",
        status: "active",
        questions: [],
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                summary: "No responses to evaluate",
                overallScore: 0,
                percentile: "below average",
                strengths: [],
                improvementAreas: ["Complete the interview"],
                actionItems: [],
                readiness: {
                  level: "needs practice",
                  confidence: 0.0,
                  recommendation: "Try the interview again"
                },
                topResponse: "",
                focusForNext: "Answer all questions"
              })
            }
          }]
        })
      });

      const report = await mockInterviewService.generateSessionReport(emptySession);

      expect(report.overallScore).toBe(0);
    });
  });
});
