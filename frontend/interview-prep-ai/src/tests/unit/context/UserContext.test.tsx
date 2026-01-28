/**
 * UserContext Unit Tests
 *
 * Updated for the new auth bootstrap strategy:
 * - UserProvider hydrates user from localStorage on mount (no /profile call at startup)
 * - updateUser() stores user in localStorage
 * - clearUser() removes user from localStorage
 */
import { render, screen, waitFor, act } from "@testing-library/react";
import UserProvider, { UserContext } from "../../../context/UserContext";
import { useContext } from "react";
import {
  createMockUser,
  createMockAuthResponse,
} from "../../helpers/testUtils";
import axiosInstance from "../../../utils/axiosInstance";

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

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

// Test component to access context
const TestConsumer = () => {
  const context = useContext(UserContext);

  if (!context) {
    return <div>No context</div>;
  }

  return (
    <div>
      <div data-testid="loading">{context.loading.toString()}</div>
      <div data-testid="user">{context.user ? context.user.name : "null"}</div>
      <button onClick={() => context.updateUser(createMockAuthResponse().user)}>
        Update User
      </button>
      <button onClick={() => context.clearUser()}>Clear User</button>
    </div>
  );
};

describe("UserContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    // IMPORTANT: cookies are irrelevant now (bootstrap is localStorage-based),
    // but we clear them anyway to avoid test leakage.
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  });

  describe("Initial state", () => {
    it("should end with loading=false and user=null when no cached user exists", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("user").textContent).toBe("null");

      // New behavior: no automatic /profile call at startup
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should hydrate user from localStorage on mount", async () => {
      const mockUser = createMockUser();
      localStorage.setItem("user", JSON.stringify(mockUser));

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("user").textContent).toBe("Test User");
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should fallback to user=null if localStorage contains invalid JSON", async () => {
      localStorage.setItem("user", "{invalid-json");

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("user").textContent).toBe("null");
      expect(localStorage.getItem("user")).toBeNull(); // provider should clean it
    });
  });

  describe("updateUser", () => {
    it("should update user and store user in localStorage", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      await act(async () => {
        screen.getByText("Update User").click();
      });

      expect(screen.getByTestId("user").textContent).toBe("Test User");

      const storedUser = localStorage.getItem("user");
      expect(storedUser).not.toBeNull();

      expect(JSON.parse(storedUser!)).toMatchObject({
        _id: "user-123",
        name: "Test User",
        email: "test@example.com",
      });
    });
  });

  describe("clearUser", () => {
    it("should clear user and remove user from localStorage", async () => {
      // Setup: cached user exists
      const mockUser = createMockUser();
      localStorage.setItem("user", JSON.stringify(mockUser));

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      // Hydrated from localStorage
      expect(screen.getByTestId("user").textContent).toBe("Test User");

      await act(async () => {
        screen.getByText("Clear User").click();
      });

      expect(screen.getByTestId("user").textContent).toBe("null");
      expect(localStorage.getItem("user")).toBeNull();
    });
  });
});
