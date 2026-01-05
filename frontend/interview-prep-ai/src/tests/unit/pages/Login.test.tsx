/**
 * Login Component Unit Tests
 *
 * Tests the Login form functionality:
 * - Renders correctly with all form elements
 * - Validates email format
 * - Validates password presence
 * - Handles successful login
 * - Handles login errors
 * - Navigates to signup page
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../../../pages/auth/Login";
import UserProvider from "../../../context/useContext";
import { ThemeProvider } from "../../../context/ThemeContext";
import { createMockAuthResponse } from "../../helpers/testUtils";

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

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

import axiosInstance from "../../../utils/axiosInstance";
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

// Helper to render Login with providers
const renderLogin = (setCurrentPage = jest.fn()) => {
  return render(
    <MemoryRouter>
      <ThemeProvider defaultTheme="light">
        <UserProvider>
          <Login setCurrentPage={setCurrentPage} />
        </UserProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("Rendering", () => {
    it("should render the login form with all elements", () => {
      renderLogin();

      // With i18n mock, translation keys are returned as-is
      expect(screen.getByText("auth.login.title")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("auth.login.emailPlaceholder")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("auth.login.passwordPlaceholder")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "auth.login.submit" })
      ).toBeInTheDocument();
      expect(screen.getByText("auth.login.signupLink")).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("should show error for invalid email format", async () => {
      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(
        "auth.login.emailPlaceholder"
      );
      const passwordInput = screen.getByPlaceholderText(
        "auth.login.passwordPlaceholder"
      );

      // Clear any default value and type invalid email without @ symbol
      await user.clear(emailInput);
      await user.type(emailInput, "invalidemail");
      await user.type(passwordInput, "password123");

      // Submit the form
      const form = emailInput.closest("form");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText("validation.invalidEmail")).toBeInTheDocument();
      });
    });

    it("should show error when password is empty", async () => {
      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(
        "auth.login.emailPlaceholder"
      );
      const submitButton = screen.getByRole("button", {
        name: "auth.login.submit",
      });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      expect(
        screen.getByText("validation.passwordRequired")
      ).toBeInTheDocument();
    });
  });

  describe("Successful Login", () => {
    it("should navigate to dashboard on successful login", async () => {
      const mockResponse = createMockAuthResponse();
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(
        "auth.login.emailPlaceholder"
      );
      const passwordInput = screen.getByPlaceholderText(
        "auth.login.passwordPlaceholder"
      );
      const submitButton = screen.getByRole("button", {
        name: "auth.login.submit",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });
  });

  describe("Login Errors", () => {
    it("should display error message from API", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { message: "Invalid credentials" } },
      });

      renderLogin();
      const user = userEvent.setup();

      await user.type(
        screen.getByPlaceholderText("auth.login.emailPlaceholder"),
        "test@example.com"
      );
      await user.type(
        screen.getByPlaceholderText("auth.login.passwordPlaceholder"),
        "wrongpassword"
      );
      await user.click(
        screen.getByRole("button", { name: "auth.login.submit" })
      );

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("should display generic error when API fails without message", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

      renderLogin();
      const user = userEvent.setup();

      await user.type(
        screen.getByPlaceholderText("auth.login.emailPlaceholder"),
        "test@example.com"
      );
      await user.type(
        screen.getByPlaceholderText("auth.login.passwordPlaceholder"),
        "password123"
      );
      await user.click(
        screen.getByRole("button", { name: "auth.login.submit" })
      );

      await waitFor(() => {
        expect(screen.getByText("errors.generic")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("should call setCurrentPage with 'signup' when clicking signup link", async () => {
      const mockSetCurrentPage = jest.fn();
      renderLogin(mockSetCurrentPage);
      const user = userEvent.setup();

      await user.click(screen.getByText("auth.login.signupLink"));

      expect(mockSetCurrentPage).toHaveBeenCalledWith("signup");
    });
  });
});
