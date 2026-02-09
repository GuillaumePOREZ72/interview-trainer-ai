/**
 * Concurrency Service Unit Tests
 * Tests the max 5 parallel analysis limit
 */

import concurrencyService from "../../../services/concurrencyService";

describe("⚡ Concurrency Service", () => {
  beforeEach(() => {
    // Reset service state before each test
    concurrencyService["runningAnalyses"].clear();
    concurrencyService["queue"] = [];
  });

  describe("Slot Management", () => {
    it("should acquire slot when available", async () => {
      await expect(
        concurrencyService.acquireSlot("session-1")
      ).resolves.not.toThrow();
      
      expect(concurrencyService.isAnalyzing("session-1")).toBe(true);
    });

    it("should allow up to 5 concurrent analyses", async () => {
      // Acquire 5 slots
      for (let i = 1; i <= 5; i++) {
        await concurrencyService.acquireSlot(`session-${i}`);
      }

      const stats = concurrencyService.getStats();
      expect(stats.running).toBe(5);
      expect(stats.availableSlots).toBe(0);
    });

    it("should queue 6th request when all slots full", async () => {
      // Fill all 5 slots
      for (let i = 1; i <= 5; i++) {
        await concurrencyService.acquireSlot(`session-${i}`);
      }

      // 6th should be queued (not resolve immediately)
      const promise6 = concurrencyService.acquireSlot("session-6");
      
      // Should be in queue
      expect(concurrencyService.getQueuePosition("session-6")).toBe(1);
      
      // Release first slot to let 6th proceed
      concurrencyService.releaseSlot("session-1");
      
      // Now should resolve
      await expect(promise6).resolves.not.toThrow();
    });

    it("should release slot and process queue", async () => {
      // Fill slots and queue one
      for (let i = 1; i <= 5; i++) {
        await concurrencyService.acquireSlot(`session-${i}`);
      }
      
      const queuedPromise = concurrencyService.acquireSlot("queued-session");
      
      // Release a slot
      concurrencyService.releaseSlot("session-1");
      
      // Queued session should now be running
      await queuedPromise;
      expect(concurrencyService.isAnalyzing("queued-session")).toBe(true);
    });
  });

  describe("Queue Management", () => {
    it("should return correct queue position", async () => {
      // Fill all slots
      for (let i = 1; i <= 5; i++) {
        await concurrencyService.acquireSlot(`session-${i}`);
      }

      // Add 3 to queue
      concurrencyService.acquireSlot("queue-1");
      concurrencyService.acquireSlot("queue-2");
      concurrencyService.acquireSlot("queue-3");

      expect(concurrencyService.getQueuePosition("queue-1")).toBe(1);
      expect(concurrencyService.getQueuePosition("queue-2")).toBe(2);
      expect(concurrencyService.getQueuePosition("queue-3")).toBe(3);
    });

    it("should return 0 for non-queued session", () => {
      expect(concurrencyService.getQueuePosition("not-queued")).toBe(0);
    });

    it("should track queued sessions correctly", async () => {
      for (let i = 1; i <= 5; i++) {
        await concurrencyService.acquireSlot(`session-${i}`);
      }

      concurrencyService.acquireSlot("queued");
      expect(concurrencyService.isQueued("queued")).toBe(true);
      expect(concurrencyService.isQueued("session-1")).toBe(false);
    });
  });

  describe("Stats", () => {
    it("should return correct stats", async () => {
      await concurrencyService.acquireSlot("session-1");
      await concurrencyService.acquireSlot("session-2");

      const stats = concurrencyService.getStats();
      
      expect(stats.running).toBe(2);
      expect(stats.maxSlots).toBe(5);
      expect(stats.availableSlots).toBe(3);
      expect(stats.queued).toBe(0);
    });
  });

  describe("Duplicate Prevention", () => {
    it("should not duplicate running session", async () => {
      await concurrencyService.acquireSlot("duplicate-session");
      
      // Try to acquire again
      await concurrencyService.acquireSlot("duplicate-session");
      
      const stats = concurrencyService.getStats();
      expect(stats.running).toBe(1); // Still only 1
    });
  });

  describe("Emergency Clear", () => {
    it("should clear all slots and reject queued", async () => {
      // Setup: 3 running, 2 queued
      for (let i = 1; i <= 5; i++) {
        await concurrencyService.acquireSlot(`session-${i}`);
      }
      
      const queuedPromises = [
        concurrencyService.acquireSlot("queue-1"),
        concurrencyService.acquireSlot("queue-2"),
      ];

      // Emergency clear
      concurrencyService.emergencyClear();

      // All should be cleared
      const stats = concurrencyService.getStats();
      expect(stats.running).toBe(0);
      expect(stats.queued).toBe(0);

      // Queued promises should reject
      await expect(queuedPromises[0]).rejects.toThrow("cancelled");
    });
  });
});
