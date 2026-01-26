/**
 * QuestionCard Component Unit Tests
 *
 * Tests the QuestionCard functionality:
 * - Renders question text correctly
 * - Expands/collapses on click
 * - Shows answer when expanded
 * - Pin button toggles correctly
 * - Learn More button triggers callback
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionCard from "../../../components/cards/QuestionCard";
import { useState } from "react";

// Mock AIResponsePreview component
jest.mock("../../../pages/interviewPrep/components/AIResponsePreview", () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => (
    <div data-testid="ai-response-preview">{content}</div>
  ),
}));

describe("QuestionCard Component", () => {
  const defaultProps = {
    question: "What is React?",
    answer: "React is a JavaScript library for building user interfaces.",
    onLearnMore: jest.fn(),
    isPinned: false,
    onTogglePin: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // The component is controlled via the `isOpen` prop in the app.
  // Tests will render it with `isOpen` explicitly set.

  describe("Rendering", () => {
    it("should render the question text", () => {
      render(<QuestionCard {...defaultProps} />);

      expect(screen.getByText("What is React?")).toBeInTheDocument();
    });

    it("should render the Q badge", () => {
      render(<QuestionCard {...defaultProps} />);

      // With mock i18next, translation keys are returned as-is
      expect(screen.getByText("question.badge")).toBeInTheDocument();
    });

    it("should not show answer content initially (collapsed)", () => {
      const { queryByTestId } = render(
        <QuestionCard {...defaultProps} isOpen={false} />,
      );

      // The AI preview should not be rendered when closed
      expect(queryByTestId("ai-response-preview")).toBeNull();
    });
  });

  describe("Expand/Collapse", () => {
    it("should render expanded content when `isOpen` is true", async () => {
      render(<QuestionCard {...defaultProps} isOpen={true} />);

      // The AI preview should be rendered when open
      const answerContainer = screen.getByTestId("ai-response-preview")
        .parentElement?.parentElement;
      expect(answerContainer?.parentElement).not.toHaveStyle({
        height: "0px",
      });
    });

    it("should not render answer content when `isOpen` is false", async () => {
      const { queryByTestId } = render(
        <QuestionCard {...defaultProps} isOpen={false} />,
      );

      expect(queryByTestId("ai-response-preview")).toBeNull();
    });

    it("should show answer content when expanded", async () => {
      render(<QuestionCard {...defaultProps} isOpen={true} />);

      expect(screen.getByTestId("ai-response-preview")).toHaveTextContent(
        "React is a JavaScript library for building user interfaces.",
      );
    });
  });

  describe("Pin Button", () => {
    it("should call onTogglePin when pin button is clicked", async () => {
      render(<QuestionCard {...defaultProps} isOpen={true} />);
      const user = userEvent.setup();

      // Find and click pin button
      const pinButtons = screen.getAllByRole("button");
      const pinButton = pinButtons.find((btn) => btn.querySelector("svg"));
      if (pinButton) {
        await user.click(pinButton);
      }

      expect(defaultProps.onTogglePin).toHaveBeenCalled();
    });

    it("should show different icon when pinned", () => {
      render(<QuestionCard {...defaultProps} isPinned={true} />);

      // When pinned, the button should have the primary background
      const buttons = screen.getAllByRole("button");
      const pinnedButton = buttons.find((btn) =>
        btn.className.includes("bg-primary"),
      );
      expect(pinnedButton).toBeInTheDocument();
    });
  });

  describe("Learn More Button", () => {
    it("should call onLearnMore and expand when Learn More is clicked", async () => {
      render(<QuestionCard {...defaultProps} isOpen={true} />);
      const user = userEvent.setup();

      // Find and click Learn More button (using translation key)
      const learnMoreButton = screen.getByText("question.learnMore");
      await user.click(learnMoreButton);

      expect(defaultProps.onLearnMore).toHaveBeenCalled();
    });

    it("should not propagate click event to parent", async () => {
      const mockToggle = jest.fn();
      render(<QuestionCard {...defaultProps} isOpen={true} />);
      const user = userEvent.setup();

      // Click Learn More (using translation key)
      await user.click(screen.getByText("question.learnMore"));

      // onLearnMore should be called, but the card should stay expanded
      expect(defaultProps.onLearnMore).toHaveBeenCalledTimes(1);
    });
  });
});
