import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

describe("App shell", () => {
  it("renders the landing phase first", () => {
    renderApp();

    expect(
      screen.getByRole("heading", { name: /welcome/i, level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your answers are processed only while this page is open. They are not saved or sent to a server."
      )
    ).toBeInTheDocument();
  });

  it("can preview every placeholder phase", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /next preview/i }));
    expect(screen.getByRole("heading", { name: /essential questions/i, level: 1 })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /next preview/i }));
    expect(screen.getByRole("heading", { name: /initial result/i, level: 1 })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /next preview/i }));
    expect(screen.getByRole("heading", { name: /refinement/i, level: 1 })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /next preview/i }));
    expect(screen.getByRole("heading", { name: /results/i, level: 1 })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /next preview/i }));
    expect(screen.getByRole("heading", { name: /negotiation card/i, level: 1 })).toHaveFocus();
  });

  it("supports Back navigation", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /start assessment/i }));
    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(screen.getByRole("heading", { name: /welcome/i })).toBeInTheDocument();
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
