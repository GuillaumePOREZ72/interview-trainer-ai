# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Backend (from `/backend`)

```bash
npm run dev           # Start development server with nodemon
npm run build         # Compile TypeScript to dist/
npm run start         # Run production server (node dist/server.js)
npm test              # Run all 105 tests
npm run test:watch    # Watch mode for TDD
npm run test:coverage # Run with coverage report
npm run test:verbose  # Verbose test output
```

### Frontend (from `/frontend/interview-prep-ai`)

```bash
npm run dev           # Start Vite dev server
npm run build         # Production build
npm run preview       # Preview production build
npm run lint          # Run ESLint
npm test              # Run all 38 tests
npm run test:watch    # Watch mode for TDD
npm run test:coverage # Run with coverage report
```

## Project Architecture

This is a monorepo containing a MERN stack application for AI-powered interview preparation.

### Backend Structure

The backend uses a "Fat Controller" pattern organized by domain:

- **`aiController.ts`** - Orchestrates Groq LPU API interactions. Handles prompt engineering and enforces JSON structure in LLM responses. Uses prompts from `utils/prompts.ts`.
- **`sessionController.ts`** - Manages interview lifecycle (creation, question generation, storage).
- **`questionController.ts`** - Handles question operations including pinning for review and adding personal notes.
- **`authController.ts`** - Handles dual-token JWT authentication (15-min access + 7-day refresh tokens).

### Frontend Structure

The frontend follows Atomic Design principles:

- **`pages/`** - Route-level smart components. `InterviewPrep.tsx` is the core "game loop" of the app.
- **`components/`** - Reusable dumb components. `cards/` contains QuestionCard and summary displays.
- **`context/`** - Global state via React Context (ThemeContext, UserContext).
- **`hooks/`** - Custom React hooks like `useUser`.
- **`utils/`** - API client (`axiosInstance`) with built-in token refresh interceptor.

### Key Architectural Patterns

**Dual-Token Auth Flow:** The frontend stores both access and refresh tokens in localStorage. Axios interceptors catch 401 errors, automatically call `/api/auth/refresh-token`, and retry the original request with a new access token.

**The Interview Loop:**
1. User submits `CreateSessionForm` (role, experience, topics)
2. `aiController` constructs prompt → calls Groq → parses JSON response
3. `sessionController` saves Session and Questions to MongoDB
4. Frontend displays questions one-by-one via `QuestionCard`
5. "Explain" button triggers `aiController.generateExplanation()`

**Internationalization:** Uses `i18next` with auto-detection. Translation files in `locales/{lang}/common.json`. When language changes, `moment.locale` syncs with `i18n.language`.

### Database Schema (Mongoose)

- **User** - username, email, password (bcrypt hashed), profilePhoto
- **Session** - role, experience, topicsToFocus, array of Question IDs
- **Question** - text, answer, difficulty, topic, isPinned (bool), notes (string)

### Testing Infrastructure

**Backend (Jest + Supertest + MongoDB Memory Server):**
- Unit tests: `tests/unit/models/`, `tests/unit/middlewares/`, `tests/unit/utils/`
- Integration tests: `tests/integration/routes/`, `tests/integration/middleware/`
- External APIs (Groq) are mocked with `nock`
- Test utilities in `tests/helpers/testUtils.ts` (createAuthenticatedUser, createTestSession, generateTestToken)

**Frontend (Jest + React Testing Library):**
- Component tests in `tests/unit/components/`
- Context/hook tests in `tests/unit/context/`, `tests/unit/hooks/`
- Page tests in `tests/unit/pages/`
- Axios is mocked in `tests/__mocks__/axiosMock.ts`

### Environment Variables

Backend (`.env`):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interviewprepai
JWT_SECRET=...
JWT_REFRESH_SECRET=...
GROQ_API_KEY=...
CLIENT_URL=http://localhost:5173
```

Frontend (`.env`):
```
VITE_API_URL=http://localhost:5000
```