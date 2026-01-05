/**
 * Jest Setup File for React Testing Library
 */
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock scrollTo
window.scrollTo = () => {};

// Suppress console errors for expected test scenarios
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = args[0]?.toString() || "";
    if (
      message.includes("Warning: ReactDOM.render is no longer supported") ||
      message.includes("Not implemented: navigation") ||
      message.includes("Error: connect ECONNREFUSED")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

afterEach(() => {
  localStorageMock.clear();
});

export { localStorageMock };
