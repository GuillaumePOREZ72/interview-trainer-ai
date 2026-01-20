const isProd = typeof import.meta !== "undefined" && import.meta.env?.PROD;
export const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (isProd ? "" : "http://localhost:8000");

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register", // Signup
    LOGIN: "/api/auth/login", // Authenticate user & return JWT token
    REFRESH_TOKEN: "/api/auth/refresh-token", // Refresh access token
    GET_PROFILE: "/api/auth/profile", // Get logged-in user details
    FORGOT_PASSWORD: "/api/auth/forgotpassword", // Request password reset
    RESET_PASSWORD: "/api/auth/resetpassword", // Reset password with token
  },

  IMAGE: {
    UPLOAD_IMAGE: "/api/auth/upload-image", // Upload profile picture
  },

  AI: {
    GENERATE_QUESTIONS: "/api/ai/generate-questions", // Generate interview questions and answers using Groq
    GENERATE_EXPLANATION: "/api/ai/generate-explanation", // Generate concept explanation using Groq
  },

  SESSION: {
    CREATE: "/api/sessions/create", // Create a new interview session with questions
    GET_ALL: "/api/sessions/my-sessions", // Get all user sessions
    GET_ONE: (id: string) => `/api/sessions/${id}`, // Get session details with questions
    DELETE: (id: string) => `/api/sessions/${id}`, // Delete a session
  },

  QUESTION: {
    ADD_TO_SESSION: "/api/questions/add", // Add more questions to a session
    PIN: (id: string) => `/api/questions/${id}/pin`, // Pin or Unpin a question
    UPDATE_NOTE: (id: string) => `/api/questions/${id}/note`, // Update/Add a note to a question
  },
};
