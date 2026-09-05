import { useEffect, useRef } from "react";
import { useQuestionnaire } from "../../hooks/useQuestionnaire.js";
import { Button } from "../ui/Button.jsx";
import { Card } from "../ui/Card.jsx";
import { CurrencyInput } from "../ui/CurrencyInput.jsx";
import { InfoCallout } from "../ui/InfoCallout.jsx";
import { Input } from "../ui/Input.jsx";
import { ProgressIndicator } from "../ui/ProgressIndicator.jsx";
import { RadioGroup } from "../ui/RadioGroup.jsx";
import { Select } from "../ui/Select.jsx";

function QuestionControl({ question, value, error, onChange }) {
  const commonProps = {
    id: question.id,
    label: question.label,
    helperText: question.helperText,
    error,
    required: question.required
  };

  if (question.type === "currency") {
    return (
      <CurrencyInput
        {...commonProps}
        value={value === "unknown" ? "" : value ?? ""}
        onValueChange={(nextValue) => onChange(question, nextValue)}
        placeholder="Enter amount"
      />
    );
  }

  if (question.type === "number") {
    return (
      <Input
        {...commonProps}
        type="number"
        value={value === "unknown" ? "" : value ?? ""}
        onChange={(event) => onChange(question, event.target.value)}
        placeholder="Enter number"
      />
    );
  }

  if (question.options.length > 4) {
    const options = [
      { value: "", label: "Choose an option" },
      ...question.options,
      ...(question.unknownAllowed ? [{ value: "unknown", label: "I do not know" }] : [])
    ];

    return (
      <Select
        {...commonProps}
        value={value ?? ""}
        onChange={(event) => onChange(question, event.target.value)}
        options={options}
      />
    );
  }

  return (
    <RadioGroup
      name={question.id}
      label={question.label}
      helperText={question.helperText}
      error={error}
      required={question.required}
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(nextValue) => onChange(question, nextValue)}
      options={[
        ...question.options,
        ...(question.unknownAllowed ? [{ value: "unknown", label: "I do not know" }] : [])
      ]}
    />
  );
}

export function QuestionnaireScreen() {
  const {
    currentQuestion,
    currentStep,
    error,
    goBack,
    hasPreviousQuestion,
    progress,
    restart,
    setAnswer,
    state,
    submitCurrentQuestion,
    totalQuestions
  } = useQuestionnaire();
  const questionHeadingRef = useRef(null);

  useEffect(() => {
    questionHeadingRef.current?.focus();
  }, [currentQuestion?.id]);

  if (!currentQuestion) {
    return (
      <Card>
        <InfoCallout
          tone="danger"
          title="Question unavailable"
          message="The questionnaire could not find an active question. Restart to begin again."
        />
        <div className="mt-4">
          <Button variant="secondary" onClick={restart}>Restart</Button>
        </div>
      </Card>
    );
  }

  const currentValue = state.answers[currentQuestion.id] ?? null;
  const isUnknown = currentValue === "unknown";

  return (
    <form onSubmit={submitCurrentQuestion} className="space-y-6" noValidate>
      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase text-teal">
            {currentQuestion.tier === "essential" ? "Essential" : "Follow-up"}
          </p>
          <h2
            ref={questionHeadingRef}
            tabIndex="-1"
            className="text-2xl font-semibold leading-tight text-navy outline-none sm:text-3xl"
          >
            {currentQuestion.label}
          </h2>
          <p className="text-sm text-navy/70">
            Question {currentStep + 1} of {totalQuestions}
          </p>
        </div>

        <ProgressIndicator
          current={currentStep + 1}
          total={totalQuestions}
          label={`Question ${currentStep + 1} of ${totalQuestions}`}
        />

        <InfoCallout
          tone="support"
          title="Why we ask"
          message={currentQuestion.helperText}
        />

        <div aria-live="polite" className="space-y-3">
          <QuestionControl
            question={currentQuestion}
            value={currentValue}
            error={error}
            onChange={setAnswer}
          />

          {currentQuestion.unknownAllowed && currentQuestion.type !== "choice" ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                aria-pressed={isUnknown}
                onClick={() => setAnswer(currentQuestion, "unknown")}
                className={isUnknown ? "border-teal bg-teal/10 text-teal" : ""}
              >
                I do not know
              </Button>
              {isUnknown ? (
                <span className="text-sm font-medium text-navy/70">
                  Saved as unknown, not zero.
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>

      <div className="rounded-lg border border-navy/10 bg-surface p-4 shadow-soft">
        <p className="mb-3 text-sm text-navy/70">
          A few additional questions may appear based on your answers.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={goBack}
            disabled={!hasPreviousQuestion}
          >
            Back
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={restart}>
              Reset
            </Button>
            <Button type="submit">
              {currentStep + 1 === totalQuestions ? "Complete questionnaire" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        Progress {Math.round(progress)} percent
      </span>
    </form>
  );
}

