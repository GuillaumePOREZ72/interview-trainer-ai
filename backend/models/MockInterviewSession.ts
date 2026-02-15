/**
 * Mock Interview Session Model
 * Stores interactive interview sessions with audio recordings
 * Includes TTL index for automatic cleanup after 24 hours
 */

import mongoose, { Schema, Document } from "mongoose";

/**
 * Interface for audio file metadata
 * References the actual audio file stored on disk
 */
export interface IAudioReference {
  filename: string; // UUID filename (e.g., "a1b2c3d4.mp3")
  path: string; // Full path to file
  duration: number; // Audio duration in seconds
  size: number; // File size in bytes
  mimeType: string; // MIME type (audio/mpeg, etc.)
}

/**
 * Interface for question response
 * Contains the question asked and user's answer
 */
export interface IQuestionResponse {
  questionIndex: number; // 0, 1, 2, etc.
  questionText: string; // Text of the question
  ttsAudioPath?: string; // Path to TTS generated audio (if used)
  
  userResponse?: {
    transcript: string; // Text transcript from speech recognition
    audioFile?: IAudioReference; // User's audio recording
    answeredAt: Date; // When user submitted answer
  };
  
  analysis?: {
    accuracy: number; // 0-100 score
    fillerWords: string[]; // "euh", "hum", etc.
    sentiment: string; // "positive", "neutral", "negative"
    confidence: number; // 0-100 confidence score
    suggestions: string[]; // Improvement suggestions
  };
  
  // For follow-up questions
  followUpQuestion?: {
    questionText: string;
    ttsAudioPath?: string;
    userResponse?: {
      transcript: string;
      audioFile?: IAudioReference;
      answeredAt: Date;
    };
    analysis?: {
      accuracy: number;
      fillerWords: string[];
      sentiment: string;
      confidence: number;
      suggestions: string[];
    };
  };
}

/**
 * Main session interface
 */
export interface IMockInterviewSession extends Document {
  user: mongoose.Types.ObjectId; // Reference to User model
  
  // Interview configuration
  role: string; // Job role (e.g., "Frontend Developer")
  experience: number; // Years of experience (e.g., 3, 5, 10)
  topicsToFocus: string[]; // Topics to focus on
  language: string; // "fr" or "en"
  
  // Session state
  status: "pending" | "active" | "analyzing" | "completed" | "expired";
  questions: IQuestionResponse[];
  currentQuestionIndex: number; // Which question we're on (0-4)
  
  // TTS cache - stores hash -> filename mapping to avoid regeneration
  ttsAudioCache: Map<string, string>;
  
  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  expiresAt: Date; // TTL - auto delete after 24h
  
  // Final report
  overallScore?: number; // 0-100 final score
  feedback: string[]; // List of actionable feedback items
  strengths: string[]; // Identified strengths
  improvementAreas: string[]; // Areas to improve
  
  // Virtual properties
  durationMinutes: number | null;
  hasFollowUpQuestions: boolean;
  
  // Instance methods
  getCurrentQuestion(): IQuestionResponse | undefined;
  isComplete(): boolean;
  getProgress(): number;
}

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

const AudioReferenceSchema = new Schema<IAudioReference>(
  {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    duration: { type: Number, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
  },
  { _id: false }
);

const UserResponseSchema = new Schema(
  {
    transcript: { type: String, required: false, default: "" },
    audioFile: { type: AudioReferenceSchema, required: false },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AnalysisSchema = new Schema(
  {
    accuracy: { type: Number, min: 0, max: 100 },
    fillerWords: [{ type: String }],
    sentiment: { 
      type: String, 
      enum: ["positive", "neutral", "negative"] 
    },
    confidence: { type: Number, min: 0, max: 100 },
    suggestions: [{ type: String }],
  },
  { _id: false }
);

const FollowUpQuestionSchema = new Schema(
  {
    questionText: { type: String, required: true },
    ttsAudioPath: { type: String },
    userResponse: { type: UserResponseSchema },
    analysis: { type: AnalysisSchema },
  },
  { _id: false }
);

const QuestionResponseSchema = new Schema<IQuestionResponse>(
  {
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    ttsAudioPath: { type: String },
    userResponse: { type: UserResponseSchema },
    analysis: { type: AnalysisSchema },
    followUpQuestion: { type: FollowUpQuestionSchema },
  },
  { _id: false }
);

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const MockInterviewSessionSchema = new Schema<IMockInterviewSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // For fast user-specific queries
    },

    // Configuration
    role: { type: String, required: true },
    experience: { type: Number, required: true },
    topicsToFocus: [{ type: String, required: true }],
    language: { type: String, default: "en" },

    // State
    status: {
      type: String,
      enum: ["pending", "active", "analyzing", "completed", "expired"],
      default: "pending",
      index: true,
    },

    questions: [QuestionResponseSchema],
    currentQuestionIndex: { type: Number, default: 0 },

    // TTS cache: hash("text:lang") -> filename
    ttsAudioCache: {
      type: Map,
      of: String,
      default: new Map(),
    },

    // Timestamps
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
    },

    // Final report
    overallScore: { type: Number, min: 0, max: 100 },
    feedback: [{ type: String, default: [] }],
    strengths: [{ type: String, default: [] }],
    improvementAreas: [{ type: String, default: [] }],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// TTL Index: Automatically delete expired sessions after 24h
// This saves disk space and keeps the database clean
MockInterviewSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for user history queries
MockInterviewSessionSchema.index({ user: 1, status: 1, startedAt: -1 });

// Index for finding sessions by completion status
MockInterviewSessionSchema.index({ status: 1, completedAt: -1 });

// ============================================================================
// VIRTUALS
// ============================================================================

// Virtual to get duration of session
MockInterviewSessionSchema.virtual("durationMinutes").get(function () {
  if (!this.completedAt || !this.startedAt) return null;
  const diff = this.completedAt.getTime() - this.startedAt.getTime();
  return Math.round(diff / 1000 / 60); // Convert to minutes
});

// Virtual to check if session has follow-up questions
MockInterviewSessionSchema.virtual("hasFollowUpQuestions").get(function () {
  return this.questions?.some((q) => q.followUpQuestion) ?? false;
});

// ============================================================================
// METHODS
// ============================================================================

// Instance method: Get current question
MockInterviewSessionSchema.methods.getCurrentQuestion = function () {
  return this.questions[this.currentQuestionIndex];
};

// Instance method: Check if interview is complete
MockInterviewSessionSchema.methods.isComplete = function () {
  return this.status === "completed";
};

// Instance method: Get progress percentage
MockInterviewSessionSchema.methods.getProgress = function () {
  if (this.questions.length === 0) return 0;
  return Math.round((this.currentQuestionIndex / this.questions.length) * 100);
};

// ============================================================================
// STATICS
// ============================================================================

// Static method: Find active sessions for user
MockInterviewSessionSchema.statics.findActiveByUser = function (
  userId: string
) {
  return this.find({
    user: userId,
    status: { $in: ["pending", "active", "analyzing"] },
  }).sort({ startedAt: -1 });
};

// Static method: Get user's interview history
MockInterviewSessionSchema.statics.getUserHistory = function (
  userId: string,
  limit: number = 10
) {
  return this.find({
    user: userId,
    status: "completed",
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .select("role experience overallScore completedAt");
};

// Export model
export default mongoose.model<IMockInterviewSession>(
  "MockInterviewSession",
  MockInterviewSessionSchema
);
