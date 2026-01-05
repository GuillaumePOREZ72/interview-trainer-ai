/**
 * Jest Configuration for Vite + React 19 + TypeScript
 *
 * This configuration handles:
 * - TypeScript transformation via ts-jest
 * - ESM module resolution
 * - CSS/image mocking
 * - React Testing Library setup
 */
module.exports = {
  // Use jsdom environment for React component testing
  testEnvironment: "jsdom",

  // Setup files to run after jest is initialized
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.tsx"],

  moduleNameMapper: {
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(jpg|jpeg|png|gif|webp|svg)$":
      "<rootDir>/src/tests/__mocks__/fileMock.cjs",
    "^@/(.*)$": "<rootDir>/src/$1",
    // On redirige TOUS les imports de styles de syntax-highlighter vers le mock
    "^react-syntax-highlighter/dist/esm/styles/prism/.*$":
      "<rootDir>/src/tests/__mocks__/fileMock.cjs",
    "^react-syntax-highlighter/dist/esm/styles/prism$":
      "<rootDir>/src/tests/__mocks__/fileMock.cjs",
  },
  moduleDirectories: ["node_modules", "src"],

  // Files to collect coverage from
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/main.tsx",
    "!src/vite-env.d.ts",
    "!src/tests/**/*",
  ],

  // Test file patterns
  testMatch: [
    "<rootDir>/src/tests/**/*.test.{ts,tsx}",
    "<rootDir>/src/**/*.test.{ts,tsx}",
  ],

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transformIgnorePatterns: [
    "/node_modules/(?!(axios|react-hot-toast|framer-motion|react-syntax-highlighter|react-markdown|remark-gfm|vfile|vfile-message|unist-util-.*|unified|bail|is-plain-obj|trough|decode-named-character-reference|character-entities|mdast-util-.*|micromark.*|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|hast-to-hyperscript)/)",
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Timeout for tests
  testTimeout: 10000,

  // ESM support
  extensionsToTreatAsEsm: [".ts", ".tsx"],
};
