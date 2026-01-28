/**
 * axiosInstance Unit Tests
 *
 * Tests the axios instance configuration and behavior.
 * Note: Testing interceptors directly is complex due to axios internals.
 * These tests verify basic configuration and API path mocks.
 */

import axiosInstance from "../../../utils/axiosInstance";

describe("axiosInstance", () => {
  describe("Basic Configuration", () => {
    it("should enable credentials for cookie-based auth", () => {
      expect(axiosInstance.defaults.withCredentials).toBe(true);
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
