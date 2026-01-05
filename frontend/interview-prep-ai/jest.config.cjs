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
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],

  // Transform TypeScript files
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          skipLibCheck: true,
        },
      },
    ],
  },

  moduleNameMapper: {
    // CSS/SCSS modules
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(css|sass|scss)$": "identity-obj-proxy",
    // Static files
    "^.+\\.(jpg|jpeg|png|gif|webp|svg)$":
      "<rootDir>/src/tests/__mocks__/fileMock.cjs",
    // Path aliases
    "^@/(.*)$": "<rootDir>/src/$1",
    // API Paths mock (to avoid import.meta issues)
    "^.*/utils/apiPaths$": "<rootDir>/src/tests/__mocks__/apiPaths.js",
    "^.*/utils/apiPaths.ts$": "<rootDir>/src/tests/__mocks__/apiPaths.js",
    // Library mocks - redirect imports to mock files
    "^react-i18next$": "<rootDir>/src/tests/__mocks__/react-i18next.js",
    "^i18next$": "<rootDir>/src/tests/__mocks__/i18next.js",
    "^react-syntax-highlighter$":
      "<rootDir>/src/tests/__mocks__/react-syntax-highlighter.js",
    "^react-syntax-highlighter/dist/esm/styles/prism$":
      "<rootDir>/src/tests/__mocks__/fileMock.cjs",
    "^react-syntax-highlighter/dist/esm/styles/prism/.*$":
      "<rootDir>/src/tests/__mocks__/fileMock.cjs",
    "^framer-motion$": "<rootDir>/src/tests/__mocks__/framer-motion.js",
    "^framer-motion/client$": "<rootDir>/src/tests/__mocks__/framer-motion.js",
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
  testMatch: ["<rootDir>/src/tests/**/*.test.{ts,tsx}"],

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transformIgnorePatterns: ["/node_modules/(?!(axios)/)"],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Timeout for tests
  testTimeout: 10000,
};
