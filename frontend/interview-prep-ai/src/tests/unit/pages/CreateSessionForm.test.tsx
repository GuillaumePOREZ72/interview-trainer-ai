/**
 * CreateSessionForm Component Unit Tests
 *
 * Tests the session creation form:
 * - Renders all form fields correctly
 * - Validates required fields
 * - Handles successful session creation
 * - Handles API errors
 * - Shows loading state during submission
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateSessionForm from "../../../pages/home/CreateSessionForm";
import { createMockQuestion } from "../../helpers/testUtils";

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

// Helper to render CreateSessionForm
const renderForm = () => {
  return render(
    <MemoryRouter>
      <CreateSessionForm />
    </MemoryRouter>
  );
};

describe("CreateSessionForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all form fields", () => {
      renderForm();

      // With i18n mock, translation keys are returned as-is
      expect(screen.getByText("createSession.title")).toBeInTheDocument();
      expect(screen.getByText(/createSession.role.label/)).toBeInTheDocument();
      expect(
        screen.getByText(/createSession.experience.label/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/createSession.topics.label/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/createSession.description.label/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /createSession.submit/i })
      ).toBeInTheDocument();
    });

    it("should show required indicators on mandatory fields", () => {
      renderForm();

      const requiredIndicators = screen.getAllByText("*");
      expect(requiredIndicators.length).toBe(3); // role, experience, topics
    });
  });

  describe("Validation", () => {
    it("should show error when required fields are empty", async () => {
      renderForm();
      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: /createSession.submit/i })
      );

      // Error message uses translation key
      expect(screen.getByText("validation.requiredFields")).toBeInTheDocument();
    });

    it("should show error when only role is filled", async () => {
      renderForm();
      const user = userEvent.setup();

      // Use translation key for placeholder
      await user.type(
        screen.getByPlaceholderText(/createSession.role.placeholder/i),
        "Software Engineer"
      );
      await user.click(
        screen.getByRole("button", { name: /createSession.submit/i })
      );

      expect(screen.getByText("validation.requiredFields")).toBeInTheDocument();
    });
  });

  describe("Successful Submission", () => {
    it("should navigate to interview prep page on success", async () => {
      const mockQuestions = [createMockQuestion(), createMockQuestion()];

      // Mock AI generate questions
      mockedAxios.post.mockResolvedValueOnce({ data: mockQuestions });
      // Mock session creation
      mockedAxios.post.mockResolvedValueOnce({
        data: { session: { _id: "session-123" } },
      });

      renderForm();
      const user = userEvent.setup();

      await user.type(
        screen.getByPlaceholderText(/createSession.role.placeholder/i),
        "Software Engineer"
      );
      await user.type(
        screen.getByPlaceholderText(/createSession.experience.placeholder/i),
        "3 years"
      );
      await user.type(
        screen.getByPlaceholderText(/createSession.topics.placeholder/i),
        "React, TypeScript"
      );
      await user.click(
        screen.getByRole("button", { name: /createSession.submit/i })
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/interview-prep/session-123"
        );
      });
    });

    it("should show loading state during submission", async () => {
      // Make the API call take some time
      mockedAxios.post.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
      );

      renderForm();
      const user = userEvent.setup();

      await user.type(
        screen.getByPlaceholderText(/createSession.role.placeholder/i),
        "Software Engineer"
      );
      await user.type(
        screen.getByPlaceholderText(/createSession.experience.placeholder/i),
        "3 years"
      );
      await user.type(
        screen.getByPlaceholderText(/createSession.topics.placeholder/i),
        "React, TypeScript"
      );
      await user.click(
        screen.getByRole("button", { name: /createSession.submit/i })
      );

      expect(screen.getByText(/createSession.generating/i)).toBeInTheDocument();
    });
  });
});
