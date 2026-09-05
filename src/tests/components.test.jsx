import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App.jsx";
import { AssessmentProvider } from "../state/AssessmentContext.jsx";
import { CurrencyInput } from "../components/ui/CurrencyInput.jsx";
import { Input } from "../components/ui/Input.jsx";

function renderApp() {
  return render(
    <AssessmentProvider>
      <App />
    </AssessmentProvider>
  );
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

  it("completes the essential questionnaire and opens initial result without assessment output", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /start assessment/i }));
    await answerSelect(user, /what will this borrowing be used for/i, "home_repair");
    await answerCurrency(user, /how much do you want to borrow/i, "100000");
    await answerSelect(user, /what repayment tenure are you considering/i, "24");
    await answerRadio(user, /salaried/i);
    await answerCurrency(user, /average monthly take-home income/i, "50000");
    await answerRadio(user, /mostly stable/i);
    await user.click(screen.getByRole("button", { name: /i do not know/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await answerCurrency(user, /already pay each month/i, "0");
    await answerRadio(user, /i do not know/i);
    await user.click(screen.getByLabelText(/no recent difficulty/i));
    await user.click(screen.getByRole("button", { name: /complete questionnaire/i }));

    expect(screen.getByRole("heading", { name: /initial result/i, level: 1 })).toHaveFocus();
    expect(screen.getByText(/no assessment has been calculated yet/i)).toBeInTheDocument();
  });

  it("shows relevant follow-up questions and Back retains answers", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /start assessment/i }));
    await answerSelect(user, /what will this borrowing be used for/i, "business");
    await answerCurrency(user, /how much do you want to borrow/i, "200000");
    await answerSelect(user, /what repayment tenure are you considering/i, "12");
    await answerRadio(user, /self-employed/i);
    await answerCurrency(user, /average monthly take-home income/i, "60000");
    await answerRadio(user, /irregular or seasonal/i);
    await answerCurrency(user, /essential household expenses/i, "25000");
    await answerCurrency(user, /already pay each month/i, "5000");
    await answerRadio(user, /about 1 month/i);
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



