import { useEffect, useMemo, useRef } from "react";
import { PHASES, phaseLabels, phaseSequence } from "./routes.js";
import { useAssessment } from "../state/useAssessment.js";
import { PageShell } from "../components/layout/PageShell.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { ConfidenceBadge } from "../components/ui/ConfidenceBadge.jsx";
import { CurrencyInput } from "../components/ui/CurrencyInput.jsx";
import { InfoCallout } from "../components/ui/InfoCallout.jsx";
import { Input } from "../components/ui/Input.jsx";
import { ProgressIndicator } from "../components/ui/ProgressIndicator.jsx";
import { RadioGroup } from "../components/ui/RadioGroup.jsx";
import { SectionHeader } from "../components/ui/SectionHeader.jsx";
import { Select } from "../components/ui/Select.jsx";

const phaseDescriptions = {
  [PHASES.LANDING]:
    "A private borrower-side workspace for checking whether the next loan conversation is worth having.",
  [PHASES.ESSENTIAL]:
    "A short first pass will collect only the answers needed to produce a useful estimate.",
  [PHASES.INITIAL_RESULT]:
    "Early ranges will appear here once the essential answers are complete.",
  [PHASES.REFINEMENT]:
    "Follow-up questions will appear only when they can improve confidence or change an output.",
  [PHASES.RESULTS]:
    "The final view will compare safe borrowing, likely lender range, pricing, EMI options, and stress.",
  [PHASES.CARD]:
    "The lender conversation summary will fit on one mobile-friendly, printable page."
};

function LandingScreen({ onStart }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Borrower Copilot"
          title="Know your safer borrowing range before you speak to a lender."
          description="A calm self-assessment shell for checking amount, EMI, pricing, and lender questions. Financial logic arrives in the next implementation step."
        />
        <InfoCallout
          title="Privacy first"
          tone="support"
          message="Your answers are processed only while this page is open. They are not saved or sent to a server."
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onStart}>Start assessment</Button>
          <Button variant="secondary" onClick={() => window.print()}>
            Preview print
          </Button>
        </div>
      </section>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase text-teal">
            Step 1 foundation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-navy">
            Built for the full challenge flow
          </h2>
        </div>
        <div className="grid gap-3">
          {["Borrow / borrow less / do not borrow", "Safe EMI and amount range", "Fair rate and all-in APR", "Negotiation Card"].map(
            (item) => (
              <div
                key={item}
                className="rounded-lg border border-navy/10 bg-background/70 px-4 py-3 text-sm font-medium text-navy"
              >
                {item}
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );
}

function PlaceholderPhase({ phase }) {
  const isQuestionPhase = phase === PHASES.ESSENTIAL || phase === PHASES.REFINEMENT;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="space-y-4">
        <ConfidenceBadge level="foundation" />
        <SectionHeader
          eyebrow={phaseLabels[phase]}
          title={`${phaseLabels[phase]} preview`}
          description={phaseDescriptions[phase]}
        />
        <InfoCallout
          title="Prepared for the next step"
          message="The screen structure is in place so the upcoming questions and calculations can be added without changing the navigation foundation."
        />
      </Card>

      <Card className="space-y-5">
        {isQuestionPhase ? (
          <>
            <Input
              id="sample-income"
              label="Sample labelled input"
              helperText="This demonstrates accessible helper and error wiring."
              placeholder="Example only"
            />
            <CurrencyInput
              id="sample-currency"
              label="Sample currency input"
              helperText="Formatted for reading, stored as a number for state."
              value={50000}
              onValueChange={() => {}}
            />
            <Select
              id="sample-select"
              label="Sample select"
              helperText="The component is ready for Zod-backed validation."
              options={[
                { value: "", label: "Choose an option" },
                { value: "salaried", label: "Salaried" },
                { value: "self_employed", label: "Self-employed" }
              ]}
            />
            <RadioGroup
              name="sample-radio"
              label="Sample radio group"
              helperText="Radio choices keep large touch targets for mobile."
              options={[
                { value: "known", label: "Known" },
                { value: "unknown", label: "Unknown" }
              ]}
            />
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {["Recommended cap", "Safe EMI", "Fair rate", "APR"].map((label) => (
              <div
                key={label}
                className="min-h-28 rounded-lg border border-navy/10 bg-background/70 p-4"
              >
                <p className="text-sm font-semibold text-navy/70">{label}</p>
                <p className="mt-4 text-2xl font-semibold text-navy">Pending</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function App() {
  const { state, dispatch } = useAssessment();
  const headingRef = useRef(null);

  const currentIndex = phaseSequence.indexOf(state.phase);
  const progress = useMemo(
    () => ({
      current: Math.max(currentIndex + 1, 1),
      total: phaseSequence.length,
      label: phaseLabels[state.phase]
    }),
    [currentIndex, state.phase]
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, [state.phase]);

  const goNext = () => {
    const nextPhase = phaseSequence[currentIndex + 1];
    if (nextPhase) {
      dispatch({ type: "SET_PHASE", payload: nextPhase });
    }
  };

  const canGoBack = state.navigationHistory.length > 0;
  const canGoNext = currentIndex < phaseSequence.length - 1;

  return (
    <PageShell>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1
            ref={headingRef}
            tabIndex="-1"
            className="text-3xl font-semibold text-navy outline-none sm:text-4xl"
          >
            {phaseLabels[state.phase]}
          </h1>
          <p aria-live="polite" className="mt-2 text-base text-navy/70">
            {phaseDescriptions[state.phase]}
          </p>
        </div>

        <ProgressIndicator
          current={progress.current}
          total={progress.total}
          label={progress.label}
        />

        <div className="mt-6">
          {state.phase === PHASES.LANDING ? (
            <LandingScreen
              onStart={() => dispatch({ type: "SET_PHASE", payload: PHASES.ESSENTIAL })}
            />
          ) : (
            <PlaceholderPhase phase={state.phase} />
          )}
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-navy/10 bg-surface/95 px-4 py-3 shadow-soft backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm font-medium text-navy/70">
            Current phase: {phaseLabels[state.phase]}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: "GO_BACK" })}
              disabled={!canGoBack}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: "RESET_ASSESSMENT" })}
            >
              Reset
            </Button>
            <Button onClick={goNext} disabled={!canGoNext}>
              Next preview
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
