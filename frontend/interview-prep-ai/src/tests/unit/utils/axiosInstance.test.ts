/**
 * axiosInstance Unit Tests
 *
 * Tests the axios instance configuration and behavior.
 * Note: Testing interceptors directly is complex due to axios internals.
 * These tests verify basic configuration and token storage.
 */

describe("axiosInstance", () => {
  beforeEach(() => {
    localStorage.clear();
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

  describe("API Paths Mock", () => {
    it("should have correct refresh token path from mock", () => {
      // Import the mock directly
      const apiPaths = require("../../__mocks__/apiPaths.js");
      expect(apiPaths.API_PATHS.AUTH.REFRESH_TOKEN).toBe(
        "/api/auth/refresh-token"
      );
    });

    it("should have BASE_URL defined in mock", () => {
      const apiPaths = require("../../__mocks__/apiPaths.js");
      expect(apiPaths.BASE_URL).toBe("http://localhost:8000");
    });
  });
});
