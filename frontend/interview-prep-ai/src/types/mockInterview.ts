/**
 * Types for Mock Interview Feature
 * Interactive voice interview simulations with AI feedback
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type InterviewStatus =
  | "pending"
  | "active"
  | "analyzing"
  | "completed"
  | "expired";

export type InterviewLanguage = "fr" | "en";

export type Sentiment = "positive" | "neutral" | "negative";

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Reference to an uploaded audio file
 */
export interface AudioFileReference {
  filename: string;
  path: string;
  duration: number; // in seconds
  size: number; // in bytes
  mimeType: string;
}

/**
 * User's response to a question (audio + transcript)
 */
export interface UserResponse {
  transcript: string;
  audioFile?: AudioFileReference;
  answeredAt: string; // ISO date string
}

/**
 * AI analysis of a user's response
 */
export interface ResponseAnalysis {
  accuracy: number; // 0-100
  fillerWords: string[];
  sentiment: Sentiment;
  confidence: number; // 0-100
  suggestions: string[];
}

/**
 * A question and its associated response/analysis
 */
export interface QuestionResponse {
  questionIndex: number;
  questionText: string;
  ttsAudioPath?: string;
  userResponse?: UserResponse;
  analysis?: ResponseAnalysis;
  // Optional follow-up question
  followUpQuestion?: {
    questionText: string;
    ttsAudioPath?: string;
    userResponse?: UserResponse;
    analysis?: ResponseAnalysis;
  };
}

/**
 * Main Mock Interview Session
 */
export interface MockInterviewSession {
  _id: string;
  user: string; // User ID
  role: string;
  experience: number; // Years (0-50)
  topicsToFocus: string[];
  language: InterviewLanguage;
  status: InterviewStatus;
  questions: QuestionResponse[];
  currentQuestionIndex: number;
  overallScore?: number; // 0-100, set when completed
  startedAt: string;
  completedAt?: string;
  expiresAt: string;
}

/**
 * Final report generated when interview is completed
 */
export interface SessionReport {
  overallScore: number;
  feedback: string[];
  strengths: string[];
  improvementAreas: string[];
  duration: number; // in seconds
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request body for starting a new interview
 */
export interface StartInterviewRequest {
  role: string;
  experience: number;
  topicsToFocus: string[];
  language?: InterviewLanguage;
}

/**
 * Response from POST /api/mock-interview/start
 */
export interface StartInterviewResponse {
  success: boolean;
  sessionId: string;
  question: {
    text: string;
    audioUrl: string | null;
    index: number;
  };
}

/**
 * Response from POST /api/mock-interview/:sessionId/answer
 */
export interface SubmitAnswerResponse {
  success: boolean;
  status: "analyzing";
  message: string;
}

/**
 * Response from POST /api/mock-interview/:sessionId/complete
 */
export interface CompleteInterviewResponse {
  success: boolean;
  report: SessionReport;
}

/**
 * Response from GET /api/mock-interview/:sessionId
 */
export interface GetSessionResponse {
  success: boolean;
  session: MockInterviewSession;
}

/**
 * Response from GET /api/mock-interview/history
 */
export interface GetHistoryResponse {
  success: boolean;
  sessions: MockInterviewSession[];
}

// ============================================================================
// SSE EVENT TYPES
// ============================================================================

export type SSEEventType =
  | "connected"
  | "status"
  | "queue"
  | "analysis"
  | "nextQuestion"
  | "heartbeat"
  | "error"
  | "complete";

export interface SSEConnectedEvent {
  sessionId: string;
  status: InterviewStatus;
}

export interface SSEStatusEvent {
  status: InterviewStatus;
  currentQuestion?: number;
  progress?: number;
}

export interface SSEQueueEvent {
  position: number;
  estimatedTime?: number; // in seconds
}

export interface SSEAnalysisEvent {
  questionIndex: number;
  analysis: ResponseAnalysis;
}

export interface SSENextQuestionEvent {
  questionIndex: number;
  questionText: string;
  audioUrl?: string;
}

export interface SSEErrorEvent {
  message: string;
  code?: string;
}

export interface SSECompleteEvent {
  overallScore: number;
  completedAt: string;
}

// ============================================================================
// HOOK STATE TYPES
// ============================================================================

export type MockInterviewState =
  | "setup" // Configuring interview parameters
  | "connecting" // Connecting to SSE
  | "question" // Displaying question, waiting for user
  | "recording" // Recording audio
  | "uploading" // Uploading answer
  | "analyzing" // AI analyzing response
  | "completed"; // Interview finished

export interface MockInterviewError {
  type: "microphone" | "network" | "api" | "sse" | "unknown";
  message: string;
  recoverable: boolean;
}
