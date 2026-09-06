import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
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
    possibleFollowUps,
    progress,
    restart,
    setAnswer,
    state,
    submitCurrentQuestion,
    totalQuestions,
    visibleQuestions
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
  const visibleFollowUps = visibleQuestions.filter((question) => question.tier === "follow_up");
  const currentFollowUpTrigger = possibleFollowUps.find((item) => item.id === currentQuestion.id)?.triggerSummary;

  return (
    <form onSubmit={submitCurrentQuestion} className="questionnaire" noValidate>
      <Card className="question-panel space-y-6">
        <ProgressIndicator
          current={currentStep + 1}
          total={totalQuestions}
          label={`Question ${currentStep + 1} of ${totalQuestions}`}
        />
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase text-teal">
            {currentQuestion.tier === "essential" ? "Essential" : "Follow-up"}
          </p>
          <h2
            ref={questionHeadingRef}
            tabIndex="-1"
            className="question-title text-2xl font-semibold leading-tight text-navy outline-none"
          >
            {currentQuestion.label}
          </h2>
        </div>


        {currentQuestion.tier === "follow_up" && currentFollowUpTrigger ? (
          <InfoCallout
            tone="caution"
            title="Why this follow-up appeared"
            message={`This question was added because of your answer about ${currentFollowUpTrigger.toLowerCase()}.`}
          />
        ) : null}

        <div className="question-control space-y-3">
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

      <div className="question-actions">
        <div className="followup-note space-y-3 text-sm text-navy/70">
          <p>
            Follow-up questions appear only when an answer makes them relevant.
            {visibleFollowUps.length > 0
              ? ` ${visibleFollowUps.length} follow-up${visibleFollowUps.length === 1 ? " is" : "s are"} active for this path.`
              : " None are active yet."}
          </p>
          <details className="followup-details">
          <summary>What can add a follow-up?</summary>
          <div aria-label="Possible follow-up triggers" className="mt-3 flex flex-wrap gap-2">
            {possibleFollowUps.map((item) => {
              const isActive = visibleFollowUps.some((question) => question.id === item.id);

              return (
                <span
                  key={item.id}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isActive
                      ? "border-teal bg-teal/10 text-teal"
                      : "border-navy/10 bg-background text-navy/65"
                  }`}
                >
                  {item.triggerSummary}
                </span>
              );
            })}
          </div>
          </details>
        </div>
        <div className="question-buttons">
          <Button
            type="button"
            variant="secondary"
            onClick={goBack}
            disabled={!hasPreviousQuestion}
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </Button>
          <div className="question-forward">
            <Button type="button" variant="secondary" onClick={restart}>
              <RotateCcw size={16} aria-hidden="true" /> Reset
            </Button>
            <Button type="submit">
              {currentStep + 1 === totalQuestions ? "Complete questionnaire" : "Continue"}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
      <p className="question-privacy"><ShieldCheck size={15} aria-hidden="true" /> Your answers stay on this page.</p>
      <span className="sr-only" aria-live="polite">
        Progress {Math.round(progress)} percent
      </span>
    </form>
  );
}

