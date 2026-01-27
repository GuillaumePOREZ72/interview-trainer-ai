/**
 * Test Utilities for React Testing Library
 *
 * Provides:
 * - Custom render function with providers (UserContext, ThemeContext, Router)
 * - Mock data factories for users, sessions, questions
 * - Helper functions for common test scenarios
 */
import { ReactElement, ReactNode } from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import UserProvider from "../../context/useContext";
import { ThemeProvider } from "../../context/ThemeContext";
import { User, Session, Question, AuthResponse } from "../../types";

// ============================================================================
// CUSTOM RENDER WITH PROVIDERS
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialRoute?: string;
  withRouter?: boolean;
}

/**
 * Custom render function that wraps components with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { initialRoute = "/", withRouter = true, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const content = (
      <ThemeProvider defaultTheme="light">
        <UserProvider>{children}</UserProvider>
      </ThemeProvider>
    );

    if (withRouter) {
      return (
        <MemoryRouter initialEntries={[initialRoute]}>{content}</MemoryRouter>
      );
    }

    return content;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Render with BrowserRouter (for tests that need full routing)
 */
export function renderWithBrowserRouter(
  ui: ReactElement,
  options: Omit<RenderOptions, "wrapper"> = {}
): RenderResult {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <UserProvider>{children}</UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Create a mock user
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    _id: "user-123",
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock auth response
 */
export function createMockAuthResponse(
  overrides: Partial<AuthResponse> = {}
): AuthResponse {
  return {
    user: createMockUser(),
    ...overrides,
  };
}

/**
 * Create a mock question
 */
export function createMockQuestion(overrides: Partial<Question> = {}): Question {
  return {
    _id: `question-${Date.now()}`,
    question: "What is React?",
    answer: "React is a JavaScript library for building user interfaces.",
    isPinned: false,
    note: "",
    ...overrides,
  };
}

/**
 * Create a mock session
 */
export function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    _id: `session-${Date.now()}`,
    role: "Frontend Developer",
    experience: "3 years",
    topicsToFocus: "React, TypeScript, Testing",
    description: "Technical interview preparation",
    questions: [
      createMockQuestion({ _id: "q1", question: "What is React?" }),
      createMockQuestion({ _id: "q2", question: "What are React hooks?" }),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Setup localStorage with auth tokens
 */
export function setupAuthenticatedUser(
  token = "mock-access-token",
  refreshToken = "mock-refresh-token"
): void {
  document.cookie = `token=${token}; path=/`;
  document.cookie = `refreshToken=${refreshToken}; path=/`;
}

/**
 * Clear authentication from localStorage
 */
export function clearAuthentication(): void {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000
): Promise<void> {
  const start = Date.now();
  while (!condition() && Date.now() - start < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";

