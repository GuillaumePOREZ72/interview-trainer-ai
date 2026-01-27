/**
 * Jest Global Teardown
 * Runs once after all test suites complete
 */

export default async function globalTeardown(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("\n🧹 Running global teardown...");
  }

  // Stop MongoDB Memory Server if it exists
  if (global.__MONGO_INSTANCE__) {
    await global.__MONGO_INSTANCE__.stop();
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ MongoDB Memory Server stopped");
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Global teardown complete\n");
  }
}
