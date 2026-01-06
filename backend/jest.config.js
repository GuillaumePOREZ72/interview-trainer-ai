/** @type {import('jest').Config} */
const config = {
  // Use ts-jest for TypeScript support
  preset: "ts-jest/presets/default-esm",

  // Test environment
  testEnvironment: "node",


  // Module name mapper for ESM imports with .js extension
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // Transform configuration for ts-jest with ESM
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  globalTeardown: "<rootDir>/tests/teardown.ts",

  // Test file patterns
  testMatch: [
    "<rootDir>/tests/**/*.test.ts",
    "<rootDir>/tests/**/*.spec.ts",
  ],

  // Coverage configuration
  collectCoverageFrom: [
    "controllers/**/*.ts",
    "middlewares/**/*.ts",
    "models/**/*.ts",
    "routes/**/*.ts",
    "utils/**/*.ts",
    "!**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // Timeout for async tests (10 seconds)
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  modulePathIgnorePatterns: ["/dist/"],

  // Force exit after tests complete
  forceExit: false,

  // Detect open handles (useful for debugging)
  detectOpenHandles: true,
};

export default config;

