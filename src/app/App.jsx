import { useEffect, useMemo, useRef } from "react";
import { PHASES, phaseLabels, phaseSequence } from "./routes.js";
import { personas } from "../data/personas.js";
import { useAssessment } from "../state/useAssessment.js";
import { PageShell } from "../components/layout/PageShell.jsx";
import { QuestionnaireScreen } from "../components/questions/QuestionnaireScreen.jsx";
import { ResultsScreen } from "../components/results/ResultsScreen.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { ConfidenceBadge } from "../components/ui/ConfidenceBadge.jsx";
import { InfoCallout } from "../components/ui/InfoCallout.jsx";
import { ProgressIndicator } from "../components/ui/ProgressIndicator.jsx";
import { SectionHeader } from "../components/ui/SectionHeader.jsx";

const phaseDescriptions = {
  [PHASES.LANDING]:
    "A private borrower-side workspace for checking whether the next loan conversation is worth having.",
  [PHASES.ESSENTIAL]:
    "A short first pass collects only the answers needed to prepare a useful estimate.",
  [PHASES.INITIAL_RESULT]:
    "Preview space for earlier result concepts; the full assessment now opens on the Results screen.",
  [PHASES.REFINEMENT]:
    "Follow-up questions will appear only when they can improve confidence or change an output.",
  [PHASES.RESULTS]:
    "Review your borrower-safe amount, EMI comfort, APR estimate, stress test, and lender talking points.",
  [PHASES.CARD]:
    "The lender conversation summary will fit on one mobile-friendly, printable page."
};

function LandingScreen({ onStart, onLoadPersona }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Borrower Copilot"
          title="Know your safer borrowing range before you speak to a lender."
          description="Answer a short, private questionnaire. Follow-up questions appear only when they can improve the later result."
        />
        <InfoCallout
          title="Privacy first"
          tone="support"
          message="Your answers are processed only while this page is open. They are not saved or sent to a server."
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onStart}>Start assessment</Button>
        </div>
      </section>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase text-teal">Questionnaire ready</p>
          <h2 className="mt-2 text-2xl font-semibold text-navy">
            One question at a time
          </h2>
          <p className="mt-2 text-sm leading-6 text-navy/70">
            You can go back, change an answer, and the follow-up path updates without losing answers from this page.
          </p>
        </div>
        {import.meta.env.DEV ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-navy">Try an example profile</p>
            <div className="grid gap-2">
              {personas.map((persona) => (
                <Button
                  key={persona.id}
                  variant="secondary"
                  onClick={() => onLoadPersona(persona)}
                  className="justify-start text-left"
                >
                  {persona.name}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function PlaceholderPhase({ phase }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="space-y-4">
        <ConfidenceBadge level="foundation" />
        <SectionHeader
          eyebrow={phaseLabels[phase]}
          title={`${phaseLabels[phase]} preview`}
          description={phaseDescriptions[phase]}
        />
        {phase === PHASES.INITIAL_RESULT ? (
          <InfoCallout
            title="Questionnaire complete"
            tone="support"
            message="The complete assessment now opens from the Results phase after the questionnaire is completed."
          />
        ) : (
          <InfoCallout
            title="Prepared for later steps"
            message="This screen remains as a placeholder until this phase is connected."
          />
        )}
      </Card>

      <Card className="space-y-4">
        <p className="text-sm font-semibold text-navy/70">Assessment status</p>
        <p className="text-2xl font-semibold text-navy">Pending</p>
        <p className="text-sm leading-6 text-navy/70">
          The questionnaire stores answers in React memory only. Refreshing this page clears personal answers.
        </p>
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
    if (state.phase !== PHASES.ESSENTIAL) {
      headingRef.current?.focus();
    }
  }, [state.phase]);

  const goNext = () => {
    const nextPhase = phaseSequence[currentIndex + 1];
    if (nextPhase) {
      dispatch({ type: "SET_PHASE", payload: nextPhase });
    }
  };

  const canGoBack = state.phaseHistory.length > 0;
  const canGoNext = currentIndex < phaseSequence.length - 1;
  const isQuestionnairePhase = state.phase === PHASES.ESSENTIAL;
  const showPhaseControls = !isQuestionnairePhase && state.phase !== PHASES.RESULTS;

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

        {showPhaseControls ? (
          <ProgressIndicator
            current={progress.current}
            total={progress.total}
            label={progress.label}
          />
        ) : null}

        <div className="mt-6">
          {state.phase === PHASES.LANDING ? (
            <LandingScreen
              onStart={() => dispatch({ type: "START_ASSESSMENT" })}
              onLoadPersona={(persona) => dispatch({ type: "LOAD_PERSONA", payload: persona })}
            />
          ) : isQuestionnairePhase ? (
            <QuestionnaireScreen />
          ) : state.phase === PHASES.RESULTS ? (
            <ResultsScreen />
          ) : (
            <PlaceholderPhase phase={state.phase} />
          )}
        </div>
      </main>

      {showPhaseControls ? (
        <div className="no-print sticky bottom-0 border-t border-navy/10 bg-surface/95 px-4 py-3 shadow-soft backdrop-blur">
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
                onClick={() => {
                  if (Object.keys(state.answers).length === 0 || window.confirm("Restart and clear the answers from this page?")) {
                    dispatch({ type: "RESTART" });
                  }
                }}
              >
                Reset
              </Button>
              <Button onClick={goNext} disabled={!canGoNext}>
                Next preview
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

