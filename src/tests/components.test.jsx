import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App.jsx";
import { PHASES } from "../app/routes.js";
import { ResultsScreen } from "../components/results/ResultsScreen.jsx";
import { CurrencyInput } from "../components/ui/CurrencyInput.jsx";
import { Input } from "../components/ui/Input.jsx";
import { personas } from "../data/personas.js";
import { runAssessment } from "../engine/assessmentEngine.js";
import { AssessmentContext } from "../state/assessmentContext.js";
import { AssessmentProvider } from "../state/AssessmentContext.jsx";
import { initialState } from "../state/reducer.js";

function renderApp() {
  return render(
    <AssessmentProvider>
      <App />
    </AssessmentProvider>
  );
}

function personaAssessment(id) {
  const persona = personas.find((item) => item.id === id);
  return runAssessment(persona.answers).value;
}

function renderResults(assessment, stateOverrides = {}, dispatch = vi.fn()) {
  const state = {
    ...initialState,
    phase: PHASES.RESULTS,
    assessment,
    assessmentStatus: assessment ? "ready" : "idle",
    ...stateOverrides
  };

  return {
    dispatch,
    ...render(
      <AssessmentContext.Provider value={{ state, dispatch }}>
        <ResultsScreen />
      </AssessmentContext.Provider>
    )
  };
}

async function answerSelect(user, label, option) {
  await user.selectOptions(screen.getByLabelText(label), option);
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function answerRadio(user, label) {
  await user.click(screen.getByLabelText(label));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function answerCurrency(user, label, value) {
  await user.type(screen.getByLabelText(label), value);
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

describe("App shell and questionnaire", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "print").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the landing phase first", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: /welcome/i, level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your answers are processed only while this page is open. They are not saved or sent to a server."
      )
    ).toBeInTheDocument();
  });

  it("validates invalid amounts with accessible messages", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /start assessment/i }));
    await answerSelect(user, /what will this borrowing be used for/i, "home_repair");
    await user.type(screen.getByLabelText(/how much do you want to borrow/i), "0");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    const amount = screen.getByLabelText(/how much do you want to borrow/i);
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(amount).toHaveAccessibleDescription(/enter a requested amount greater than zero/i);
  });

  it("completes the questionnaire and opens the Results screen", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /start assessment/i }));
    await answerSelect(user, /what will this borrowing be used for/i, "home_repair");
    await answerCurrency(user, /how much do you want to borrow/i, "100000");
    await answerSelect(user, /what repayment tenure are you considering/i, "24");
    await answerRadio(user, /salaried/i);
    await answerCurrency(user, /average monthly take-home income/i, "150000");
    await answerRadio(user, /mostly stable/i);
    await answerCurrency(user, /essential household expenses/i, "45000");
    await answerCurrency(user, /already pay each month/i, "0");
    await answerCurrency(user, /how much emergency savings/i, "135000");
    await user.click(screen.getByLabelText(/no recent difficulty/i));
    await user.click(screen.getByRole("button", { name: /complete questionnaire/i }));

    expect(screen.getByRole("heading", { name: /your borrowing assessment/i, level: 1 })).toHaveFocus();
    expect(screen.getByRole("heading", { name: /this amount appears manageable/i })).toBeInTheDocument();
    expect(screen.getByText(/all-in apr estimate/i)).toBeInTheDocument();
  });

  it("sends the final questionnaire answer into the assessment engine", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /start assessment/i }));
    await answerSelect(user, /what will this borrowing be used for/i, "home_repair");
    await answerCurrency(user, /how much do you want to borrow/i, "100000");
    await answerSelect(user, /what repayment tenure are you considering/i, "24");
    await answerRadio(user, /salaried/i);
    await answerCurrency(user, /average monthly take-home income/i, "150000");
    await answerRadio(user, /mostly stable/i);
    await answerCurrency(user, /essential household expenses/i, "45000");
    await answerCurrency(user, /already pay each month/i, "0");
    await answerCurrency(user, /how much emergency savings/i, "135000");
    await answerRadio(user, /bank bounce/i);
    await user.click(screen.getByLabelText(/in the last 30 days/i));
    await user.click(screen.getByRole("button", { name: /complete questionnaire/i }));

    expect(screen.getByRole("heading", { name: /borrowing is not recommended right now/i })).toBeInTheDocument();
    expect(screen.getByText(/a repayment bounce was reported within the last 30 days/i)).toBeInTheDocument();
  });

  it("shows relevant follow-up questions and Back retains answers", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /start assessment/i }));

    expect(screen.getByText(/follow-up questions appear only when an answer makes them relevant/i)).toBeInTheDocument();
    expect(screen.getByText(/none are active yet/i)).toBeInTheDocument();
    expect(screen.getByText(/irregular or seasonal income/i)).toBeInTheDocument();
    expect(screen.getByText(/self-employed or business income/i)).toBeInTheDocument();
    await answerSelect(user, /what will this borrowing be used for/i, "business");
    await answerCurrency(user, /how much do you want to borrow/i, "200000");
    await answerSelect(user, /what repayment tenure are you considering/i, "12");
    await answerRadio(user, /self-employed/i);
    await answerCurrency(user, /average monthly take-home income/i, "60000");
    await answerRadio(user, /irregular or seasonal/i);
    await answerCurrency(user, /essential household expenses/i, "25000");
    await answerCurrency(user, /already pay each month/i, "5000");
    await answerCurrency(user, /how much emergency savings/i, "25000");
    await user.click(screen.getByLabelText(/bank bounce/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByRole("heading", { name: /lower-income month/i })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByLabelText(/bank bounce/i)).toBeChecked();
  });

  it("Reset asks for confirmation when answers exist", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /start assessment/i }));
    await user.selectOptions(screen.getByLabelText(/what will this borrowing be used for/i), "home_repair");
    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(window.confirm).toHaveBeenCalledWith("Restart and clear the answers from this page?");
    expect(screen.getByRole("heading", { name: /welcome/i, level: 1 })).toBeInTheDocument();
  });
});

describe("Results screen", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "print").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows insufficient-data copy instead of unaffordability copy", () => {
    const assessment = runAssessment({ requestedAmount: 100000 }).value;
    renderResults(assessment);

    expect(screen.getByRole("heading", { name: /we cannot make a safe recommendation yet/i })).toBeInTheDocument();
    expect(screen.queryByText(/place your essential expenses at risk/i)).not.toBeInTheDocument();
  });

  it("shows null recommended amount without displaying zero", () => {
    renderResults(personaAssessment("anita"));

    expect(screen.getAllByText(/no borrowing amount is currently recommended/i).length).toBeGreaterThan(0);
    expect(screen.queryByText("?0")).not.toBeInTheDocument();
  });

  it("does not render invalid numeric values as NaN or Infinity", () => {
    const assessment = {
      ...personaAssessment("priya"),
      recommendedAmount: Number.NaN,
      aprBand: { minimum: Number.NaN, maximum: Number.POSITIVE_INFINITY },
      feeSummary: null
    };
    const { container } = renderResults(assessment);

    expect(container.textContent).not.toContain("NaN");
    expect(container.textContent).not.toContain("Infinity");
  });

  it("does not crash when optional assessment arrays are missing", () => {
    const assessment = {
      ...personaAssessment("priya"),
      risks: undefined,
      missingInformation: undefined,
      confidenceReasons: undefined,
      explanations: undefined,
      negotiationPoints: undefined,
      tenureComparison: undefined
    };

    renderResults(assessment);
    expect(screen.getByRole("heading", { name: /this amount appears manageable/i })).toBeInTheDocument();
  });

  it("shows Priya, Ravi and Anita verdict copy", () => {
    const { rerender } = render(
      <AssessmentContext.Provider value={{ state: { ...initialState, phase: PHASES.RESULTS, assessment: personaAssessment("priya"), assessmentStatus: "ready" }, dispatch: vi.fn() }}>
        <ResultsScreen />
      </AssessmentContext.Provider>
    );

    expect(screen.getByRole("heading", { name: /this amount appears manageable/i })).toBeInTheDocument();

    rerender(
      <AssessmentContext.Provider value={{ state: { ...initialState, phase: PHASES.RESULTS, assessment: personaAssessment("ravi"), assessmentStatus: "ready" }, dispatch: vi.fn() }}>
        <ResultsScreen />
      </AssessmentContext.Provider>
    );
    expect(screen.getByRole("heading", { name: /a smaller loan would be safer/i })).toBeInTheDocument();

    rerender(
      <AssessmentContext.Provider value={{ state: { ...initialState, phase: PHASES.RESULTS, assessment: personaAssessment("anita"), assessmentStatus: "ready" }, dispatch: vi.fn() }}>
        <ResultsScreen />
      </AssessmentContext.Provider>
    );
    expect(screen.getByRole("heading", { name: /borrowing is not recommended right now/i })).toBeInTheDocument();
  });

  it("places APR before advertised interest in semantic order", () => {
    renderResults(personaAssessment("priya"));

    const aprHeading = screen.getByRole("heading", { name: /all-in apr estimate/i });
    const interestHeading = screen.getByRole("heading", { name: /advertised interest-rate estimate/i });
    expect(aprHeading.compareDocumentPosition(interestHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("gives the comparison bar an accessible text equivalent", () => {
    renderResults(personaAssessment("priya"));

    expect(screen.getByRole("img", { name: /requested amount .* borrower-safe amount .* lender-likely estimate/i })).toBeInTheDocument();
    expect(screen.getAllByText(/not an approval estimate or safety recommendation/i).length).toBeGreaterThan(0);
  });

  it("prints the negotiation card and includes required disclaimers", async () => {
    const user = userEvent.setup();
    renderResults(personaAssessment("priya"));

    expect(screen.getByText(/educational affordability estimate, not a loan approval/i)).toBeInTheDocument();
    expect(screen.getByText(/share it only with people or institutions you trust/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /print negotiation card/i }));
    expect(window.print).toHaveBeenCalled();
  });

  it("restart dispatches a full restart after confirmation", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();
    renderResults(personaAssessment("priya"), { answers: { requestedAmount: 100000 } }, dispatch);

    await user.click(screen.getByRole("button", { name: /restart/i }));

    expect(window.confirm).toHaveBeenCalledWith("Restart and clear the answers from this page?");
    expect(dispatch).toHaveBeenCalledWith({ type: "RESTART" });
  });

  it("does not show a fabricated verdict when assessment generation fails", () => {
    renderResults(null, {
      assessmentStatus: "error",
      assessmentError: { code: "INTERNAL", message: "Calculation failed." }
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/we could not generate the result/i);
    expect(screen.queryByText(/this amount appears manageable/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/a smaller loan would be safer/i)).not.toBeInTheDocument();
  });
});

describe("Reusable form components", () => {
  it("connects label, helper text, and error text on Input", () => {
    render(
      <Input
        id="monthly-income"
        label="Monthly take-home income"
        helperText="Enter the amount you receive after deductions."
        error="Income is required."
        required
      />
    );

    const input = screen.getByLabelText(/monthly take-home income/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Enter the amount you receive after deductions. Income is required."
    );
  });

  it("CurrencyInput sends a numeric value to state handlers", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    function CurrencyHarness() {
      const [value, setValue] = useState("");

      return (
        <CurrencyInput
          id="amount"
          label="Requested amount"
          helperText="Example helper text."
          value={value}
          onValueChange={(nextValue) => {
            setValue(nextValue);
            handleValueChange(nextValue);
          }}
        />
      );
    }

    render(<CurrencyHarness />);

    await user.type(screen.getByLabelText(/requested amount/i), "50000");

    expect(handleValueChange).toHaveBeenLastCalledWith(50000);
  });
});


