/**
 * Jest Setup File for React Testing Library
 */
import "@testing-library/jest-dom";
import React from "react";
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

// 1. Injection des globales pour le mode ESM (Règle "jest is not defined")
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

// 2. Polyfills indispensables
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// 3. Mock i18next (Règle les erreurs dans formatDate.test.ts)
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn().mockResolvedValue({}),
      language: "en",
    },
  }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

jest.mock("i18next", () => ({
  use: () => ({ init: jest.fn() }),
  changeLanguage: jest.fn().mockResolvedValue({}),
  t: (key: string) => key,
  language: "en",
}));

// 4. Mock react-syntax-highlighter (Règle l'erreur "torn down environment")
jest.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }: any) => React.createElement("pre", null, children),
  Light: ({ children }: any) => React.createElement("pre", null, children),
}));

// 5. Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    span: ({ children, ...props }: any) =>
      React.createElement("span", props, children),
    button: ({ children, ...props }: any) =>
      React.createElement("button", props, children),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// 6. Mocks standards
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
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.scrollTo = jest.fn();

// Cleanup global
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
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

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

// Mock react-syntax-highlighter
jest.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }: any) => React.createElement("pre", null, children),
  Light: ({ children }: any) => React.createElement("pre", null, children),
}));

// Mock des styles
jest.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  oneLight: {},
  vscDarkPlus: {},
}));

export { localStorageMock };
