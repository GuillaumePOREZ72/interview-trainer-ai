/**
 * Jest Setup File
 * Runs before each test file
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Declare global variable to store MongoMemoryServer instance
declare global {
  var __MONGO_INSTANCE__: MongoMemoryServer | undefined;
}

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-purposes-only";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-token-secret-key-for-testing";

let mongoServer: MongoMemoryServer;

/**
 * Connect to in-memory MongoDB before all tests
 */
beforeAll(async () => {
  // Create MongoDB Memory Server instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Store instance globally for teardown
  global.__MONGO_INSTANCE__ = mongoServer;

  // Connect to in-memory database
  await mongoose.connect(mongoUri);

  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Connected to in-memory MongoDB for testing");
  }
});

/**
 * Clear all collections after each test
 */
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

/**
 * Disconnect and stop MongoDB after all tests
 */
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Disconnected from in-memory MongoDB");
  }
});
