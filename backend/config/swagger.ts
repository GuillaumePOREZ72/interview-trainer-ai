/**
 * Swagger/OpenAPI Configuration
 * 
 * This file configures Swagger UI for API documentation.
 * Accessible at: /api-docs
 */

import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "InterviewPrepAI API",
      version: "1.0.0",
      description: `
API pour la plateforme de préparation aux entretiens d'embauche.

## Fonctionnalités principales:
- **Authentification** - Inscription, connexion, gestion des tokens
- **Sessions** - Création et gestion de sessions d'entraînement
- **Questions** - Génération IA de questions d'entretien
- **Mock Interview** - Simulations d'entretiens vocaux interactifs
- **Analyse** - Feedback IA sur les réponses

## Authentification
La plupart des endpoints nécessitent un token JWT dans le header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
      `,
      contact: {
        name: "InterviewPrepAI Team",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // Auth schemas
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        
        // Session schemas
        Session: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string", description: "User ID" },
            role: { type: "string", example: "Frontend Developer" },
            experience: { type: "integer", example: 5, description: "Years of experience" },
            topicsToFocus: { 
              type: "array", 
              items: { type: "string" },
              example: ["React", "TypeScript", "Node.js"]
            },
            questions: { type: "array", items: { $ref: "#/components/schemas/Question" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        
        Question: {
          type: "object",
          properties: {
            _id: { type: "string" },
            question: { type: "string", example: "What is React?" },
            answer: { type: "string", example: "React is a JavaScript library..." },
            isPinned: { type: "boolean", default: false },
            note: { type: "string" },
          },
        },
        
        // Mock Interview schemas
        MockInterviewSession: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string", description: "User ID" },
            role: { type: "string", example: "Frontend Developer" },
            experience: { 
              type: "integer", 
              example: 5, 
              minimum: 0, 
              maximum: 50,
              description: "Years of experience" 
            },
            topicsToFocus: {
              type: "array",
              items: { type: "string" },
              example: ["React", "TypeScript"],
              description: "Topics to focus on during the interview"
            },
            language: { 
              type: "string", 
              enum: ["fr", "en"], 
              default: "en",
              description: "Interview language"
            },
            status: {
              type: "string",
              enum: ["pending", "active", "analyzing", "completed", "expired"],
              example: "active",
              description: "Current session status"
            },
            questions: {
              type: "array",
              items: { $ref: "#/components/schemas/QuestionResponse" }
            },
            currentQuestionIndex: { 
              type: "integer", 
              example: 0,
              description: "Current question number (0-indexed)"
            },
            overallScore: { 
              type: "integer", 
              example: 82,
              minimum: 0,
              maximum: 100,
              description: "Final score (0-100)"
            },
            startedAt: { type: "string", format: "date-time" },
            completedAt: { type: "string", format: "date-time" },
            expiresAt: { type: "string", format: "date-time" },
          },
        },
        
        QuestionResponse: {
          type: "object",
          properties: {
            questionIndex: { type: "integer", example: 0 },
            questionText: { type: "string", example: "What is the Virtual DOM?" },
            ttsAudioPath: { type: "string", description: "Path to TTS audio file" },
            userResponse: { $ref: "#/components/schemas/UserResponse" },
            analysis: { $ref: "#/components/schemas/ResponseAnalysis" },
          },
        },
        
        UserResponse: {
          type: "object",
          properties: {
            transcript: { type: "string", example: "The Virtual DOM is..." },
            audioFile: {
              type: "object",
              properties: {
                filename: { type: "string" },
                path: { type: "string" },
                duration: { type: "number", description: "Duration in seconds" },
                size: { type: "integer", description: "File size in bytes" },
                mimeType: { type: "string", example: "audio/webm" },
              }
            },
            answeredAt: { type: "string", format: "date-time" },
          },
        },
        
        ResponseAnalysis: {
          type: "object",
          properties: {
            accuracy: { type: "integer", example: 85, minimum: 0, maximum: 100 },
            fillerWords: { 
              type: "array", 
              items: { type: "string" },
              example: ["um", "uh"]
            },
            sentiment: { 
              type: "string", 
              enum: ["positive", "neutral", "negative"],
              example: "positive"
            },
            confidence: { type: "integer", example: 90, minimum: 0, maximum: 100 },
            suggestions: { 
              type: "array", 
              items: { type: "string" },
              example: ["Good technical knowledge", "Could provide more examples"]
            },
          },
        },
        
        SessionReport: {
          type: "object",
          properties: {
            overallScore: { type: "integer", example: 82, minimum: 0, maximum: 100 },
            feedback: { 
              type: "array", 
              items: { type: "string" },
              example: ["Great communication skills", "Technical depth could be improved"]
            },
            strengths: { 
              type: "array", 
              items: { type: "string" },
              example: ["Clear explanations", "Good examples"]
            },
            improvementAreas: { 
              type: "array", 
              items: { type: "string" },
              example: ["Technical depth", "More concrete examples"]
            },
            duration: { type: "integer", example: 1200, description: "Duration in seconds" },
          },
        },
        
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: "Authentication", description: "User registration, login, token management" },
      { name: "Sessions", description: "Interview preparation sessions" },
      { name: "Questions", description: "Question management and generation" },
      { name: "AI", description: "AI-powered features (question generation, analysis)" },
      { name: "Mock Interview", description: "Interactive voice interview simulations" },
    ],
  },
  apis: [
    "./routes/*.ts",
    "./routes/**/*.ts",
    "./controllers/*.ts",
    "./controllers/**/*.ts",
    "./docs/*.ts",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
