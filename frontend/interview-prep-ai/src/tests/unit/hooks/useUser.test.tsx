/**
 * useUser Hook Unit Tests
 *
 * Tests the useUser custom hook:
 * - Returns context when used within UserProvider
 * - Throws error when used outside UserProvider
 */
import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { useUser } from "../../../hooks/useUser";
import UserProvider from "../../../context/UserContext";

// Mock axiosInstance
jest.mock("../../../utils/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

describe("useUser Hook", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("When used within UserProvider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    it("should return context with user, loading, updateUser, and clearUser", () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("updateUser");
      expect(result.current).toHaveProperty("clearUser");
    });

    it("should have updateUser as a function", () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      expect(typeof result.current.updateUser).toBe("function");
    });

    it("should have clearUser as a function", () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      expect(typeof result.current.clearUser).toBe("function");
    });

    it("should initially have user as null", () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      expect(result.current.user).toBeNull();
    });
  });

  describe("When used outside UserProvider", () => {
    // Suppress console.error for this test since we expect an error
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it("should throw an error", () => {
      expect(() => {
        renderHook(() => useUser());
      }).toThrow("useUser must be used within UserProvider");
    });
  });
});
