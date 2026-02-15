# AGENTS.md - Interview Trainer AI

This document provides guidelines for AI coding agents working in this repository.

## Project Overview

Full-stack MERN application for AI-powered technical interview simulation using Groq LPU. 
- **Frontend**: React 19, Vite 7, Tailwind CSS v4, Zod validation
- **Backend**: Node.js (ESM), Express v4, MongoDB/Mongoose, Groq API

## Build/Lint/Test Commands

### Backend (from `/backend`)

```bash
npm run dev          # Development server with nodemon
npm run build        # TypeScript build to dist/
npm run start        # Production server (from dist/)
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

**Run a single test:**
```bash
npm test -- path/to/test.test.ts
npm test -- tests/unit/services/mockInterviewService.test.ts
npm test -- --testNamePattern="should register"
```

### Frontend (from `/frontend/interview-prep-ai`)

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

**Run a single test:**
```bash
npm test -- path/to/test.test.ts
npm test -- src/tests/unit/components/Button.test.tsx
npm test -- --testNamePattern="renders correctly"
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** in both frontend and backend
- **No explicit `any`** - use proper types or `unknown` with type guards
- **Return type annotations** encouraged for exported functions
- **Interface vs Type**: Use `interface` for object shapes, `type` for unions/primitives

### Imports

- **Order**: Node built-ins → External packages → Internal modules → Types
- **No barrel imports** for large libraries (import directly from source)
- **Use `.js` extension** in import paths for ESM compatibility (TypeScript maps automatically)

```typescript
// Correct order
import express, { Request, Response } from "express";
import { validationResult } from "express-validator";
import { logger } from "../config/logger";
import AuthService from "../services/AuthService";
import type { IUser } from "../models/User";
```

### Backend Architecture

**Service-Controller pattern:**
- **Controllers**: Lean request handlers, minimal logic
- **Services**: Encapsulate all business logic and data operations
- **Models**: Mongoose schemas with TypeScript interfaces

```typescript
// Controller pattern - lean, delegates to service
const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: "Validation errors", errors: errors.array() });
      return;
    }
    const user = await AuthService.registerUser({ name, email, password });
    // ...
  } catch (error) {
    // Error handling
  }
};
```

**Model pattern:**
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

export default mongoose.model<IUser>("User", userSchema);
```

### Frontend Architecture

**Component pattern:**
```typescript
import { createContext, useState, useEffect, ReactNode } from "react";

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  // ...
};

export default UserProvider;
```

**Lazy loading pattern (mandatory for pages):**
```typescript
const Dashboard = lazy(() => import("./pages/home/Dashboard"));

// With Suspense
<Suspense fallback={<SpinnerLoader />}>
  <Dashboard />
</Suspense>
```

### Error Handling

**Backend:**
```typescript
// Use try/catch with explicit void return
const handler = async (req: Request, res: Response): Promise<void> => {
  try {
    // ...
  } catch (error) {
    logger.error("Operation failed", { error, correlationId: req.correlationId });
    res.status(500).json({ message: "Internal server error" });
  }
};

// Service throws errors
class AuthService {
  async registerUser(userData: { name: string; email: string; password: string }) {
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error("User already exists");
    }
    // ...
  }
}
```

**Frontend:**
```typescript
// Use try/catch with toast notifications
const logout = async () => {
  try {
    await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
  } catch {
    // Handle gracefully
  } finally {
    clearUser();
  }
};
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | PascalCase | `UserContext.tsx` |
| Files (utils/services) | camelCase | `apiPaths.ts` |
| Files (tests) | `.test.ts`/`.test.tsx` | `auth.test.ts` |
| React components | PascalCase | `UserProfile` |
| Functions/variables | camelCase | `getUserProfile` |
| Constants | SCREAMING_SNAKE | `API_PATHS` |
| Interfaces/Types | PascalCase with `I` prefix optional | `IUser`, `UserContextType` |
| Private members | underscore prefix | `_privateMethod` |

### Testing Patterns

**Test file structure:**
```typescript
/**
 * Description of test suite
 */
import request from "supertest";
import { createApp } from "../../../app.js";

describe("Feature Name", () => {
  describe("POST /api/endpoint", () => {
    it("should do something successfully", async () => {
      const response = await request(app).post("/api/endpoint").send({});
      expect(response.status).toBe(201);
    });

    it("should return 400 for invalid input", async () => {
      // ...
    });
  });
});
```

**Frontend testing:**
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Component", () => {
  it("renders correctly", () => {
    render(<Component />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### Validation

**Backend:** Use `express-validator` in routes
```typescript
router.post("/register", [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
], registerUser);
```

**Frontend:** Use `zod` schemas
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### Security Best Practices

- **Never commit secrets** - use `.env` files (gitignored)
- **HttpOnly cookies** for auth tokens
- **JWT**: Access (10min) + Refresh (7 days) tokens
- **CORS whitelist validation** even in development
- **Rate limiting** on auth routes
- **Input validation** on all endpoints

### Comments

- **Do NOT add comments** unless explicitly requested by the user
- Code should be self-documenting through clear naming and structure
- JSDoc comments only for public APIs/libraries

## Testing Strategy

Test pyramid approach:
1. **Unit tests**: Services, utilities, hooks (fast, isolated)
2. **Integration tests**: Routes with mocked database (mongodb-memory-server)
3. **Component tests**: React components with Testing Library

**Coverage focus**: Controllers, middlewares, services, utils

## File Structure

```
backend/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Mongoose schemas
├── routes/          # Express routes
├── middlewares/     # Express middlewares
├── utils/           # Utility functions
├── config/          # Configuration (logger, swagger, rate-limiter)
├── tests/
│   ├── unit/        # Unit tests
│   ├── integration/ # Integration tests
│   └── helpers/     # Test utilities

frontend/interview-prep-ai/src/
├── components/      # Reusable components
├── pages/           # Route pages (lazy-loaded)
├── context/         # React contexts
├── hooks/           # Custom hooks
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
└── tests/
    ├── unit/        # Unit tests
    └── integration/ # Integration tests
```