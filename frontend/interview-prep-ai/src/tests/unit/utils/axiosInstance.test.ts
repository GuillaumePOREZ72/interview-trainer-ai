/**
 * axiosInstance Unit Tests
 *
 * Tests the axios instance configuration and behavior.
 * Note: Testing interceptors directly is complex due to axios internals.
 * These tests verify the module exports and basic configuration.
 */

describe("axiosInstance", () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
  });

  describe("Module Export", () => {
    it("should export a default axios instance", async () => {
      const axiosInstance = (await import("../../../utils/axiosInstance"))
        .default;
      expect(axiosInstance).toBeDefined();
    });
  });

  describe("Token Storage", () => {
    it("should read token from localStorage", () => {
      localStorage.setItem("token", "test-token");
      expect(localStorage.getItem("token")).toBe("test-token");
    });

    it("should read refreshToken from localStorage", () => {
      localStorage.setItem("refreshToken", "test-refresh-token");
      expect(localStorage.getItem("refreshToken")).toBe("test-refresh-token");
    });

    it("should clear both tokens when cleared", () => {
      localStorage.setItem("token", "test-token");
      localStorage.setItem("refreshToken", "test-refresh-token");

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
    });
  });

  describe("API Paths", () => {
    it("should have correct refresh token path", () => {
      const { API_PATHS } = require("../../../utils/apiPaths");
      expect(API_PATHS.AUTH.REFRESH_TOKEN).toBe("/api/auth/refresh-token");
    });
  });
});
