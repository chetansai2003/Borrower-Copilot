import { useReducer } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../app/App.jsx";
import { PHASES } from "../app/routes.js";
import { personas } from "../data/personas.js";
import { rules } from "../data/rules.js";
import { calculateEmergencyBufferImpact } from "../engine/emergencyBuffer.js";
import { AssessmentContext } from "../state/assessmentContext.js";
import { assessmentReducer, initialState } from "../state/reducer.js";

function SavingsHarness() {
  const [state, dispatch] = useReducer(assessmentReducer, {
    ...initialState,
    phase: PHASES.ESSENTIAL,
    currentQuestionId: "emergencySavings",
    answers: { ...personas[0].answers, emergencySavings: null }
  });
  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      <App />
      <output data-testid="answers">{JSON.stringify(state.answers)}</output>
    </AssessmentContext.Provider>
  );
}

const savedAnswers = () => JSON.parse(screen.getByTestId("answers").textContent);

describe("emergency savings form-to-engine regression", () => {
  it.each([
    ["135000", 135000, 3, "adequate"],
    ["45000", 45000, 1, "limited"],
    ["0", 0, 0, "low"]
  ])("stores %s as rupees and derives coverage from monthly expenses", async (input, amount, months, category) => {
    const user = userEvent.setup();
    render(<SavingsHarness />);
    const field = screen.getByLabelText(/how much emergency savings/i);
    await user.type(field, input);
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: /recent repayment or credit difficulty/i })).toHaveFocus();
    expect(savedAnswers().emergencySavings).toBe(amount);
    expect(calculateEmergencyBufferImpact(savedAnswers(), rules).value).toEqual({
      emergencyBufferMonths: months,
      category
    });
    await user.click(screen.getByRole("button", { name: /back/i }));
    await user.click(screen.getByLabelText(/how much emergency savings/i));
    expect(screen.getByLabelText(/how much emergency savings/i)).toHaveValue(String(amount));
  });

  it("keeps explicit unknown distinct from zero and allows replacing it with a known amount", async () => {
    const user = userEvent.setup();
    render(<SavingsHarness />);
    await user.click(screen.getByRole("button", { name: /i do not know/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(savedAnswers().emergencySavings).toBe("unknown");
    expect(calculateEmergencyBufferImpact(savedAnswers(), rules).value).toEqual({
      emergencyBufferMonths: null, category: "unknown"
    });
    await user.click(screen.getByRole("button", { name: /back/i }));
    await user.type(screen.getByLabelText(/how much emergency savings/i), "0");
    await user.keyboard("{Enter}");
    expect(savedAnswers().emergencySavings).toBe(0);
  });

  it("blocks unanswered and negative savings, retaining the sign when typed character by character", async () => {
    const user = userEvent.setup();
    render(<SavingsHarness />);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    const field = screen.getByLabelText(/how much emergency savings/i);
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(savedAnswers().emergencySavings).toBeNull();
    await user.type(field, "-100");
    await user.keyboard("{Enter}");
    expect(savedAnswers().emergencySavings).toBe(-100);
    expect(field).toHaveValue("-100");
    expect(field).toHaveAccessibleDescription(/emergency savings cannot be negative/i);
    await user.clear(field);
    await user.type(field, "135000.50");
    await user.keyboard("{Enter}");
    expect(savedAnswers().emergencySavings).toBe(135000.5);
    expect(screen.getByRole("heading", { name: /recent repayment or credit difficulty/i })).toHaveFocus();
  });
});
