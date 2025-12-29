# 🏛️ InterviewPrep AI - Architectural Masterplan

> **Status:** Active Development
> **Version:** 1.1.0
> **Date:** December 29, 2025

## 1. 🔭 Vision & Core Philosophy

**InterviewPrep AI** is a high-performance, AI-driven platform designed to simulate technical interviews with extreme latency optimization. The architecture prioritizes **speed** (via Groq LPU), **modularity** (Service-Controller pattern), and **UX fluidity** (React 19 + Framer Motion).

---

## 2. 🛠️ The "Bleeding Edge" Tech Stack

### **Frontend (Client)**

- **Core:** React 19 + Vite 7 (ESM-first)
- **Routing:** React Router 7
- **Styling:** Tailwind CSS v4 + Framer Motion (for "Avant-Garde" micro-interactions)
- **State:** React Context API (Theme, User) + Local State
- **HTTP Client:** Axios (Singleton instance)

### **Backend (Server)**

- **Runtime:** Node.js (ESM Mode)
- **Framework:** Express v5 (Modern routing)
- **Database:** MongoDB + Mongoose v9
- **AI Engine:** **Groq** (LPU Inference) via OpenAI-compatible API
- **Security:** Helmet, RateLimit, CORS, JWT (HttpOnly Cookies)

---

## 3. 📐 System Architecture

The system follows a **Client-Server** architecture with a decoupled AI service layer.

```mermaid
graph TD
    User[👤 User] -->|HTTPS| Client[🖥️ Frontend (React 19)]
    Client -->|REST API| API[🛡️ Backend API (Express v5)]

    subgraph "Backend Services"
        API -->|Auth| AuthC[Auth Controller]
        API -->|Business Logic| SessC[Session Controller]
        API -->|Inference| AIC[AI Controller]
    end

    subgraph "Data Persistence"
        AuthC -->|Read/Write| DB[(MongoDB)]
        SessC -->|Read/Write| DB
    end

    subgraph "External AI Cloud"
        AIC -->|JSON Prompt| Groq[⚡ Groq API (Llama/Mixtral)]
        Groq -->|Structured JSON| AIC
    end
```

---

## 4. 🧠 Backend Architecture (Deep Dive)

### **4.1 Controller-Service Pattern**

The backend is organized into distinct domains. While currently implementing a "Fat Controller" pattern, the logic is separated by feature domain.

- **`aiController`**: Orchestrates the prompt engineering and communication with Groq. It handles the non-deterministic nature of LLMs and enforces JSON structure.
- **`sessionController`**: Manages the lifecycle of an interview (Creation -> Question Generation -> Storage).
- **`authController`**: Handles JWT issuance, hashing (Bcrypt), and cookie management.

### **4.2 The AI Pipeline (Groq Integration)**

We utilize **Groq** for near-instant inference, critical for maintaining the "flow" of an interview.

1. **Prompt Construction:** Templates in `utils/prompts.ts` inject user context (Role, Experience).
2. **Request:** Sent to `https://api.groq.com/openai/v1/chat/completions`.
3. **Sanitization:** The raw string response is parsed via `cleanAndParseJSON` to ensure the frontend receives consumable data.

### **4.3 Database Schema (ERD)**

```mermaid
erDiagram
    USER ||--o{ SESSION : creates
    SESSION ||--o{ QUESTION : contains

    USER {
        ObjectId _id
        string username
        string email
        string password
        string profilePhoto
    }

    SESSION {
        ObjectId _id
        string role
        string experience
        string topicsToFocus
        ObjectId[] questions
    }

    QUESTION {
        ObjectId _id
        string text
        string answer
        string difficulty
        string topic
    }
```

---

## 5. 🎨 Frontend Architecture (Deep Dive)

### **5.1 Component Hierarchy**

The UI is built on **Atomic Design** principles but adapted for speed.

- **`pages/`**: Route-level containers (Smart Components).
  - `InterviewPrep.tsx`: The main "Game Loop" of the application.
- **`components/`**: Reusable UI elements (Dumb Components).
  - `cards/`: Specialized displays for Questions and Summaries.
  - `loader/`: Skeleton screens to manage perceived performance during AI generation.
- **`layouts/`**: Persistent shells (`DashboardLayout`).

### **5.2 State Management Strategy**

- **Global Server State:** Managed via `useUser` hook (User profile, Auth status).
- **Theme State:** `ThemeContext` for Dark/Light mode toggling.
- **Ephemeral UI State:** Local `useState` for form inputs and modal visibility.

---

## 6. 🔄 Key Workflows

### **6.1 The "Interview Loop"**

This is the core value proposition flow.

1. **Initiation:** User submits `CreateSessionForm` (Role: "Frontend Dev", Exp: "Senior").
2. **Generation:**
   - Backend receives request.
   - `aiController` constructs a system prompt enforcing a JSON array of questions.
   - Groq returns the questions.
   - `sessionController` saves the Session and Questions to MongoDB.
3. **Interaction:**
   - Frontend receives the Session ID.
   - User navigates to `/interview-prep`.
   - Questions are displayed one by one via `QuestionCard`.
4. **Feedback:**
   - User requests "Explain" or "Reveal Answer".
   - `AIResponsePreview` renders the markdown response.

### **6.2 Authentication Flow (with Refresh Tokens)**

The authentication system implements a dual-token strategy for enhanced security:

1. **Signup/Login:** `authController` validates credentials (bcrypt hashing).
2. **Token Issue:** Two tokens are generated:
   - **Access Token:** Short-lived (15 min), used for API authentication via `Authorization: Bearer` header.
   - **Refresh Token:** Long-lived (7 days), stored in localStorage, used to obtain new access tokens.
3. **Token Refresh:** When access token expires:
   - Frontend interceptor catches 401 errors.
   - Automatically calls `POST /api/auth/refresh-token` with refresh token.
   - New access token is issued and original request is retried.
4. **Protection:** `authMiddleware` intercepts protected routes, verifies the JWT, and attaches `req.user`.
5. **Logout:** Client removes both tokens from localStorage.

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB

    Client->>API: POST /login (email, password)
    API->>DB: Validate credentials
    DB-->>API: User found
    API-->>Client: { accessToken, refreshToken, user }

    Note over Client: Store tokens in localStorage

    Client->>API: GET /protected (Authorization: Bearer accessToken)
    API-->>Client: 200 OK (data)

    Note over Client: Access token expires (15 min)

    Client->>API: GET /protected (expired token)
    API-->>Client: 401 Unauthorized

    Client->>API: POST /refresh-token (refreshToken)
    API-->>Client: { accessToken } (new token)

    Client->>API: GET /protected (new token - retry)
    API-->>Client: 200 OK (data)
```

---

## 7. 📂 Project Structure Map

```text
interviewprepai/
├── backend/                      # 🧠 The Brain
│   ├── config/                   # DB, Logger, RateLimiters
│   ├── controllers/              # Business Logic (AI, Auth, Session)
│   ├── middlewares/              # Auth protection, file upload
│   ├── models/                   # Mongoose Schemas (User, Session, Question)
│   ├── routes/                   # API Endpoint Definitions
│   ├── utils/                    # Prompts & Helper Functions
│   ├── app.ts                    # Express application (testable)
│   ├── server.ts                 # Server entry point
│   │
│   └── tests/                    # 🧪 Test Suite
│       ├── setup.ts              # MongoDB Memory Server setup
│       ├── globalSetup.ts        # Jest global setup
│       ├── globalTeardown.ts     # Jest global teardown
│       ├── helpers/
│       │   └── testUtils.ts      # Test utilities & fixtures
│       ├── unit/                 # Unit tests (isolated)
│       │   ├── models/           # User, Session, Question tests
│       │   ├── middlewares/      # authMiddleware tests
│       │   └── utils/            # helper.test.ts
│       └── integration/          # Integration tests (API)
│           ├── routes/           # auth, session, question, ai, upload
│           └── middleware/       # rateLimiter tests
│
└── frontend/interview-prep-ai/   # 💅 The Face
    ├── src/
    │   ├── components/           # UI Building Blocks
    │   ├── context/              # Global State (Theme, User)
    │   ├── hooks/                # Custom Logic (useUser)
    │   ├── pages/                # Route Views
    │   └── utils/                # API Clients (axiosInstance) & Helpers
    └── vite.config.ts            # Build Configuration
```

---

## 8. 🧪 Testing Infrastructure

### **8.1 Test Stack**

The backend features a comprehensive test suite built with modern testing tools:

| Tool                      | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| **Jest**                  | Test runner with TypeScript ESM support    |
| **Supertest**             | HTTP assertion library for API testing     |
| **MongoDB Memory Server** | In-memory MongoDB for isolated tests       |
| **Nock**                  | HTTP mocking for external API calls (Groq) |

### **8.2 Test Architecture**

Tests are organized following the **Testing Pyramid** principle:

```mermaid
graph TB
    subgraph "Testing Pyramid"
        E2E["🔺 E2E Tests<br/>(Future)"]
        INT["🔶 Integration Tests<br/>45 tests"]
        UNIT["🟢 Unit Tests<br/>60 tests"]
    end

    style E2E fill:#f9f,stroke:#333,stroke-width:2px
    style INT fill:#ff9,stroke:#333,stroke-width:2px
    style UNIT fill:#9f9,stroke:#333,stroke-width:2px
```

**Current Coverage: 105 tests (all passing ✅)**

### **8.3 Unit Tests**

Unit tests validate individual components in isolation:

| Category       | File                     | Tests | Description                                     |
| -------------- | ------------------------ | ----- | ----------------------------------------------- |
| **Models**     | `User.test.ts`           | 8     | Required fields, unique email, timestamps       |
| **Models**     | `Session.test.ts`        | 9     | Required fields, optional fields, relationships |
| **Models**     | `Question.test.ts`       | 11    | Default values, pin toggle, notes               |
| **Middleware** | `authMiddleware.test.ts` | 7     | Valid/invalid/expired tokens                    |
| **Utils**      | `helper.test.ts`         | 16    | JSON parsing, AI response cleaning              |

### **8.4 Integration Tests**

Integration tests validate API endpoints end-to-end:

| Category       | File                  | Tests | Endpoints Tested                                    |
| -------------- | --------------------- | ----- | --------------------------------------------------- |
| **Auth**       | `auth.test.ts`        | 12    | `/register`, `/login`, `/profile`, `/refresh-token` |
| **Sessions**   | `session.test.ts`     | 13    | `/create`, `/my-sessions`, `/:id`, `DELETE /:id`    |
| **Questions**  | `question.test.ts`    | 10    | `/add`, `/:id/pin`, `/:id/note`                     |
| **AI**         | `ai.test.ts`          | 9     | `/generate-questions`, `/generate-explanation`      |
| **Upload**     | `upload.test.ts`      | 4     | `/upload-image` (PNG, JPEG validation)              |
| **Rate Limit** | `rateLimiter.test.ts` | 6     | Rate limiting behavior, health check exclusion      |

### **8.5 Test Utilities**

The `testUtils.ts` file provides reusable helpers:

```typescript
// Create authenticated user for tests
const { user, token } = await createAuthenticatedUser();

// Create test session with questions
const session = await createTestSession(userId, token);

// Generate valid JWT for testing
const token = generateTestToken(userId);
```

### **8.6 Running Tests**

```bash
# Run all tests
cd backend && npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern="auth.test"

# Run in watch mode (development)
npm run test:watch
```

### **8.7 Test Isolation Strategy**

Each test file operates in complete isolation:

1. **Fresh Database:** MongoDB Memory Server provides a clean database per test suite
2. **Automatic Cleanup:** `afterEach` hook clears all collections between tests
3. **Mocked External APIs:** Groq API calls are mocked with `nock`
4. **Separate App Instance:** `app.ts` is imported without starting the server

---

## 9. 🔒 Security Architecture

### **9.1 Authentication Security**

| Layer                | Implementation                       |
| -------------------- | ------------------------------------ |
| **Password Hashing** | bcrypt (10 salt rounds)              |
| **Access Token**     | JWT, 15 min expiry, HS256            |
| **Refresh Token**    | JWT, 7 days expiry, separate secret  |
| **Token Storage**    | localStorage (frontend)              |
| **API Protection**   | Bearer token in Authorization header |

### **9.2 API Security**

| Protection           | Implementation                         |
| -------------------- | -------------------------------------- |
| **Rate Limiting**    | 100 requests/minute per IP             |
| **CORS**             | Configured for frontend origin         |
| **Helmet**           | Security headers (CSP, XSS protection) |
| **Input Validation** | Express validators on routes           |

---

## 10. 🚀 Development Workflow

### **10.1 Getting Started**

```bash
# Clone and install
git clone <repo-url>
cd interviewprepai

# Backend setup
cd backend
npm install
cp .env.example .env  # Configure environment variables

# Frontend setup
cd ../frontend/interview-prep-ai
npm install
```

### **10.2 Development Commands**

```bash
# Backend (from /backend)
npm run dev          # Start with nodemon
npm test             # Run test suite
npm run test:watch   # Watch mode for TDD

# Frontend (from /frontend/interview-prep-ai)
npm run dev          # Start Vite dev server
npm run build        # Production build
```

### **10.3 Environment Variables**

**Backend (.env):**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interviewprepai
JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
GROQ_API_KEY=your-groq-api-key
CLIENT_URL=http://localhost:5173
```

### **10.4 Contribution Guidelines**

1. **Write Tests First:** New features should include unit/integration tests
2. **Run Tests Before Commit:** Ensure all 105+ tests pass
3. **Follow Patterns:** Use existing controller/route patterns
4. **Document Changes:** Update ARCHITECTURE.md for significant changes
