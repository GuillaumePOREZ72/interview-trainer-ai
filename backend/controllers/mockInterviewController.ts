/**
 * Mock Interview Controller
 * Handles REST API endpoints and SSE for real-time updates
 */

import { Request, Response } from "express";
import { logger } from "../config/logger";
import MockInterviewSession from "../models/MockInterviewSession";
import mockInterviewService from "../services/mockInterviewService";
import ttsService from "../services/ttsService";
import concurrencyService from "../services/concurrencyService";
import { deleteUploadedFile } from "../middlewares/uploadMiddleware";

// Store SSE clients for real-time notifications
const sseClients = new Map<string, Response>();

/**
 * Send SSE event to a specific session
 */
export const sendSSEEvent = (sessionId: string, eventType: string, data: any) => {
  const client = sseClients.get(sessionId);
  if (client) {
    client.write(`event: ${eventType}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
};

/**
 * Start a new mock interview session
 * POST /api/mock-interview/start
 */
export const startInterview = async (req: Request, res: Response) => {
  try {
    const { role, experience, topicsToFocus, language = "en" } = req.body;
    const userId = req.user?._id;

    // Validation
    if (!role || experience === undefined || experience === null || !topicsToFocus) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: role, experience, topicsToFocus",
      });
    }

    // Parse experience as number
    const experienceNum = Number(experience);
    if (isNaN(experienceNum) || experienceNum < 0 || experienceNum > 50) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a number between 0 and 50",
      });
    }

    // Create session
    const session = await MockInterviewSession.create({
      user: userId,
      role,
      experience: experienceNum,
      topicsToFocus,
      language,
      status: "active",
      questions: [],
      currentQuestionIndex: 0,
    });

    // Generate first question
    const questionText = await mockInterviewService.generateInitialQuestion(session);
    
    // Generate TTS (or null if quota exceeded)
    const audioPath = await ttsService.synthesize(questionText, language);

    // Add question to session
    session.questions.push({
      questionIndex: 0,
      questionText,
      ttsAudioPath: audioPath || undefined,
    });
    await session.save();

    logger.info(`Mock interview started: ${session._id}`);

    res.status(201).json({
      success: true,
      sessionId: session._id,
      question: {
        text: questionText,
        audioUrl: audioPath ? `/audio/tts/${language}/${session.ttsAudioCache.get(questionText)}` : null,
        index: 0,
      },
    });
  } catch (error) {
    logger.error(`Start interview error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to start interview",
    });
  }
};

/**
 * Submit answer and get next question
 * POST /api/mock-interview/:sessionId/answer
 */
export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { transcript } = req.body;
    const audioFile = req.file;
    const userId = req.user?._id;

    // Find session
    const session = await MockInterviewSession.findOne({
      _id: sessionId,
      user: userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview already completed",
      });
    }

    // Get current question
    const currentQuestion = session.getCurrentQuestion();
    if (!currentQuestion) {
      return res.status(400).json({
        success: false,
        message: "No current question",
      });
    }

    // Update question with user response
    currentQuestion.userResponse = {
      transcript: transcript || "",
      audioFile: audioFile
        ? {
            filename: audioFile.filename,
            path: audioFile.path,
            duration: 0, // TODO: extract duration
            size: audioFile.size,
            mimeType: audioFile.mimetype,
          }
        : undefined,
      answeredAt: new Date(),
    };

    // Start analysis
    session.status = "analyzing";
    await session.save();

    // Acquire concurrency slot
    try {
      await concurrencyService.acquireSlot(sessionId);
    } catch (error) {
      // Timeout or error
      session.status = "active";
      await session.save();
      
      if (audioFile) deleteUploadedFile(audioFile.path);
      
      return res.status(503).json({
        success: false,
        message: "Analysis queue is full. Please try again.",
        queuePosition: concurrencyService.getQueuePosition(sessionId),
      });
    }

    // Perform analysis in background
    analyzeAndContinue(session, currentQuestion, transcript);

    // Return immediately with "analyzing" status
    res.json({
      success: true,
      status: "analyzing",
      message: "Answer received. Analyzing...",
      sessionId: session._id,
    });
  } catch (error: any) {
    logger.error(`Submit answer error: ${error}`);
    logger.error(`Error stack: ${error.stack}`);
    
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to submit answer",
      error: error.message,
    });
  }
};

/**
 * SSE endpoint for real-time analysis updates
 * GET /api/mock-interview/:sessionId/stream
 */
export const getAnalysisStream = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?._id;

    // Validate session
    const session = await MockInterviewSession.findOne({
      _id: sessionId,
      user: userId,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Setup SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: "connected", sessionId })}\n\n`);

    // Send current status
    res.write(
      `data: ${JSON.stringify({
        type: "status",
        status: session.status,
        currentQuestion: session.currentQuestionIndex,
      })}\n\n`
    );

    // If analyzing, check queue position
    if (session.status === "analyzing") {
      const queuePos = concurrencyService.getQueuePosition(sessionId);
      if (queuePos > 0) {
        res.write(
          `data: ${JSON.stringify({
            type: "queue",
            position: queuePos,
          })}\n\n`
        );
      }
    }

    // Store client for notifications
    sseClients.set(sessionId, res);
    logger.info(`SSE client connected: ${sessionId}`);

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
    }, 30000); // Every 30 seconds

    // Clean up on client disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      sseClients.delete(sessionId);
      logger.info(`SSE client disconnected: ${sessionId}`);
    });
  } catch (error) {
    logger.error(`SSE error: ${error}`);
    res.status(500).end();
  }
};

/**
 * Complete interview and generate report
 * POST /api/mock-interview/:sessionId/complete
 */
export const completeInterview = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?._id;

    const session = await MockInterviewSession.findOne({
      _id: sessionId,
      user: userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Generate final report
    const report = await mockInterviewService.generateSessionReport(session);

    // Update session
    session.status = "completed";
    session.completedAt = new Date();
    session.overallScore = report.overallScore;
    session.feedback = report.feedback;
    session.strengths = report.strengths;
    session.improvementAreas = report.improvementAreas;
    await session.save();

    logger.info(`Interview completed: ${sessionId} - Score: ${report.overallScore}`);

    res.json({
      success: true,
      report: {
        overallScore: report.overallScore,
        feedback: report.feedback,
        strengths: report.strengths,
        improvementAreas: report.improvementAreas,
        duration: session.durationMinutes,
      },
    });
  } catch (error) {
    logger.error(`Complete interview error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to complete interview",
    });
  }
};

/**
 * Get session details
 * GET /api/mock-interview/:sessionId
 */
export const getSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?._id;

    const session = await MockInterviewSession.findOne({
      _id: sessionId,
      user: userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.json({
      success: true,
      session: {
        id: session._id,
        status: session.status,
        role: session.role,
        experience: session.experience,
        language: session.language,
        questions: session.questions,
        currentQuestionIndex: session.currentQuestionIndex,
        overallScore: session.overallScore,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      },
    });
  } catch (error) {
    logger.error(`Get session error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get session",
    });
  }
};

/**
 * Get user's interview history
 * GET /api/mock-interview/history
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    
    let limit = 10;
    const limitParam = req.query.limit;

    if (limitParam !== undefined && limitParam !== "") {
      const parsed = parseInt(limitParam as string, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        return res.status(400).json({ success: false, message: "Limit must be an integer between 1 and 100" });
      }
      limit = parsed;
    }

    const sessions = await MockInterviewSession.find({
      user: userId,
      status: "completed",
    })
      .sort({ completedAt: -1 })
      .limit(limit)
      .select("role experience overallScore completedAt startedAt");

    res.status(200).json({ success: true, sessions });
  } catch (error) {
    logger.error(`Get history error: ${error}`);
    res.status(500).json({ success: false, message: "Failed to get history" });
  }
};

// ============================================================================
// PRIVATE HELPER FUNCTIONS
// ============================================================================

/**
 * Analyze response and generate next question
 * Runs asynchronously after submitAnswer returns
 */
async function analyzeAndContinue(
  session: any,
  question: any,
  transcript: string
): Promise<void> {
  const sessionId = session._id.toString();

  try {
    // Analyze response
    const analysis = await mockInterviewService.analyzeResponse(
      transcript,
      question.questionText,
      session.language
    );

    question.analysis = analysis;

    // Check if we should generate follow-up or next question
    const shouldGenerateFollowUp =
      !question.followUpQuestion && session.currentQuestionIndex < 2;

    if (shouldGenerateFollowUp) {
      // Generate follow-up
      const followUpText = await mockInterviewService.generateFollowUpQuestion(
        session,
        transcript,
        question.questionText
      );

      let followUpAudio = null;
      try {
        followUpAudio = await ttsService.synthesize(
          followUpText,
          session.language
        );
      } catch (ttsError) {
        logger.warn(`TTS failed for follow-up: ${ttsError}`);
      }

      question.followUpQuestion = {
        questionText: followUpText,
        ttsAudioPath: followUpAudio || undefined,
      };
    } else if (session.currentQuestionIndex < 4) {
      // Generate next main question
      session.currentQuestionIndex++;
      const nextQuestionText = await mockInterviewService.generateInitialQuestion(
        session
      );
      let nextAudio = null;
      try {
        nextAudio = await ttsService.synthesize(
          nextQuestionText,
          session.language
        );
      } catch (ttsError) {
        logger.warn(`TTS failed for next question: ${ttsError}`);
      }

      session.questions.push({
        questionIndex: session.currentQuestionIndex,
        questionText: nextQuestionText,
        ttsAudioPath: nextAudio || undefined,
      });
    }

    session.status = "active";
    await session.save();

    // Release concurrency slot
    concurrencyService.releaseSlot(sessionId);

    // Send SSE notifications
    sendSSEEvent(sessionId, "analysis", {
      questionIndex: question.questionIndex,
      analysis: analysis,
    });

    // Send next question or completion
    if (session.currentQuestionIndex < 4 || question.followUpQuestion) {
      const nextQ = question.followUpQuestion || session.questions[session.currentQuestionIndex];
      sendSSEEvent(sessionId, "nextQuestion", {
        questionIndex: session.currentQuestionIndex,
        questionText: nextQ.questionText,
        audioUrl: nextQ.ttsAudioPath,
      });
    } else {
      sendSSEEvent(sessionId, "complete", {
        overallScore: session.overallScore,
        completedAt: session.completedAt,
      });
    }

    logger.info(`Analysis completed for session ${sessionId}`);
  } catch (error) {
    logger.error(`Analysis error for ${sessionId}: ${error}`);
    
    session.status = "active";
    await session.save();
    
    concurrencyService.releaseSlot(sessionId);
    
    // Notify client of error
    sendSSEEvent(sessionId, "error", {
      message: "Analysis failed",
    });
  }
}
