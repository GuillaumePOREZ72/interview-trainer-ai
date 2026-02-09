/**
 * Concurrency Service
 * Manages parallel analysis operations with max 5 slots
 * Implements queue system for handling overflow
 */

import { logger } from "../config/logger";

interface QueueItem {
  sessionId: string;
  resolve: () => void;
  reject: (error: Error) => void;
  queuedAt: Date;
}

/**
 * Concurrency Service
 * Singleton pattern to manage analysis slots across the application
 */
class ConcurrencyService {
  private runningAnalyses: Set<string> = new Set();
  private queue: QueueItem[] = [];
  private readonly MAX_CONCURRENT = 5;

  /**
   * Try to acquire an analysis slot
   * If slots available: resolves immediately
   * If full: queues the request and resolves when slot becomes available
   * 
   * @param sessionId - Unique session identifier
   * @returns Promise that resolves when slot is acquired
   */
  async acquireSlot(sessionId: string): Promise<void> {
    // Check if already running (shouldn't happen, but safety check)
    if (this.runningAnalyses.has(sessionId)) {
      logger.warn(`Concurrency: Session ${sessionId} already has a slot`);
      return;
    }

    // Check if slot available
    if (this.runningAnalyses.size < this.MAX_CONCURRENT) {
      this.runningAnalyses.add(sessionId);
      logger.info(
        `Concurrency: Slot acquired for ${sessionId}. ` +
        `Running: ${this.runningAnalyses.size}/${this.MAX_CONCURRENT}`
      );
      return;
    }

    // Queue the request
    logger.info(
      `Concurrency: Queueing session ${sessionId}. ` +
      `Queue position: ${this.queue.length + 1}`
    );

    return new Promise((resolve, reject) => {
      const queueItem: QueueItem = {
        sessionId,
        resolve,
        reject,
        queuedAt: new Date(),
      };

      this.queue.push(queueItem);

      // Set timeout (5 minutes max wait)
      setTimeout(() => {
        const index = this.queue.findIndex((item) => item.sessionId === sessionId);
        if (index !== -1) {
          this.queue.splice(index, 1);
          reject(new Error("Analysis queue timeout (5 minutes)"));
        }
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Release an analysis slot
   * Processes next item in queue if available
   * 
   * @param sessionId - Session to release
   */
  releaseSlot(sessionId: string): void {
    if (!this.runningAnalyses.has(sessionId)) {
      logger.warn(`Concurrency: Session ${sessionId} not found in running analyses`);
      return;
    }

    this.runningAnalyses.delete(sessionId);
    logger.info(
      `Concurrency: Slot released for ${sessionId}. ` +
      `Running: ${this.runningAnalyses.size}/${this.MAX_CONCURRENT}`
    );

    // Process next in queue
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        this.runningAnalyses.add(next.sessionId);
        const waitTime = Date.now() - next.queuedAt.getTime();
        logger.info(
          `Concurrency: Processing queued session ${next.sessionId}. ` +
          `Waited: ${Math.round(waitTime / 1000)}s`
        );
        next.resolve();
      }
    }
  }

  /**
   * Get current queue position for a session
   * Returns 0 if not in queue, position number otherwise
   * 
   * @param sessionId - Session to check
   * @returns Queue position (0 if not queued)
   */
  getQueuePosition(sessionId: string): number {
    const position = this.queue.findIndex((item) => item.sessionId === sessionId);
    return position === -1 ? 0 : position + 1;
  }

  /**
   * Check if a session is currently being analyzed
   * 
   * @param sessionId - Session to check
   * @returns true if analyzing
   */
  isAnalyzing(sessionId: string): boolean {
    return this.runningAnalyses.has(sessionId);
  }

  /**
   * Check if a session is queued
   * 
   * @param sessionId - Session to check
   * @returns true if in queue
   */
  isQueued(sessionId: string): boolean {
    return this.queue.some((item) => item.sessionId === sessionId);
  }

  /**
   * Get current stats
   * Useful for monitoring and debugging
   */
  getStats(): {
    running: number;
    queued: number;
    maxSlots: number;
    availableSlots: number;
  } {
    return {
      running: this.runningAnalyses.size,
      queued: this.queue.length,
      maxSlots: this.MAX_CONCURRENT,
      availableSlots: this.MAX_CONCURRENT - this.runningAnalyses.size,
    };
  }

  /**
   * Force clear all slots (emergency use)
   * Rejects all queued items
   */
  emergencyClear(): void {
    logger.warn("Concurrency: Emergency clear called!");
    
    // Reject all queued items
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        item.reject(new Error("Analysis cancelled due to emergency"));
      }
    }

    // Clear running
    this.runningAnalyses.clear();
  }
}

// Export singleton instance
export default new ConcurrencyService();
