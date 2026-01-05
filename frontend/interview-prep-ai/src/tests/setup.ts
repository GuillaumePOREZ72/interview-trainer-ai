/**
 * Jest Setup File for React Testing Library
 */
import "@testing-library/jest-dom";
import {
  jest,
  expect,
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { TextEncoder, TextDecoder } from "util";

// Injection manuelle des globales pour le mode ESM
// @ts-ignore
globalThis.jest = jest;
// @ts-ignore
globalThis.expect = expect;
// @ts-ignore
globalThis.describe = describe;
// @ts-ignore
globalThis.it = it;
// @ts-ignore
globalThis.beforeAll = beforeAll;
// @ts-ignore
globalThis.afterAll = afterAll;
// @ts-ignore
globalThis.beforeEach = beforeEach;
// @ts-ignore
globalThis.afterEach = afterEach;

// ============================================================================
// TEXTENCODER/TEXTDECODER POLYFILL (required for react-router-dom)
// ============================================================================
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// ============================================================================
// LOCALSTORAGE MOCK
// ============================================================================
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// ============================================================================
// MATCHMEDIA MOCK (for theme detection)
// ============================================================================
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ============================================================================
// SCROLLTO MOCK
// ============================================================================
window.scrollTo = jest.fn();

// ============================================================================
// INTERSECTION OBSERVER MOCK
// ============================================================================
class IntersectionObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

// ============================================================================
// RESIZE OBSERVER MOCK
// ============================================================================
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

// ============================================================================
// CLEANUP AFTER EACH TEST
// ============================================================================
beforeEach(() => {
  // Clear localStorage before each test
  localStorageMock.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

// ============================================================================
// SUPPRESS CONSOLE ERRORS FOR EXPECTED FAILURES
// ============================================================================
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React act() warnings and expected test errors
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

export { localStorageMock };
