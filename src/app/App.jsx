import { useEffect, useRef } from "react";
import { ArrowRight, ArrowUpRight, BadgeIndianRupee, Check, FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react";
import { PHASES, phaseLabels, phaseSequence } from "./routes.js";
import { personas } from "../data/personas.js";
import { useAssessment } from "../state/useAssessment.js";
import { PageShell } from "../components/layout/PageShell.jsx";
import { QuestionnaireScreen } from "../components/questions/QuestionnaireScreen.jsx";
import { ResultsScreen } from "../components/results/ResultsScreen.jsx";
import { Button } from "../components/ui/Button.jsx";

const descriptions = {
  [PHASES.LANDING]: "A little clarity before your next big decision.",
  [PHASES.ESSENTIAL]: "Your needs, your numbers. One question at a time.",
  [PHASES.RESULTS]: "Your numbers, explained. Your next step, clearer."
};

const profileLabels = {
  priya: { title: "Steady income", detail: "Salaried income and a comfortable monthly buffer.", color: "mint" },
  ravi: { title: "Variable income", detail: "A business owner balancing income and repayments.", color: "blue" },
  anita: { title: "Existing obligations", detail: "Essential expenses, existing debt and repayment concerns.", color: "rose" }
};

function LandingScreen({ onStart, onLoadPersona }) {
  return (
    <div className="welcome-workspace">
      <section className="start-section" aria-labelledby="start-title">
        <div className="start-heading">
          <span className="eyebrow"><ShieldCheck size={16} aria-hidden="true" /> YOUR BORROWING CHECK-IN</span>
          <h2 id="start-title">Make room for what matters.</h2>
          <p>Find a borrowing amount that leaves space for everyday life, then go into your lender conversation prepared.</p>
        </div>
        <div className="start-actions">
          <Button onClick={onStart}>Start assessment <ArrowRight size={18} aria-hidden="true" /></Button>
          <span className="text-sm text-navy/70">10 essential questions, with relevant follow-ups</span>
        </div>
        <div className="outcomes">
          <div><span className="feature-icon mint"><BadgeIndianRupee aria-hidden="true" /></span><div><h3>A safer borrowing range</h3><p>Based on your income and everyday commitments.</p></div></div>
          <div><span className="feature-icon blue"><ShieldCheck aria-hidden="true" /></span><div><h3>The full repayment picture</h3><p>Monthly EMI, all-in APR and a financial stress check.</p></div></div>
          <div><span className="feature-icon amber"><FileCheck2 aria-hidden="true" /></span><div><h3>A better lender conversation</h3><p>A printable card with numbers and questions to ask.</p></div></div>
        </div>
      </section>

      <aside className="privacy-strip">
        <LockKeyhole size={20} aria-hidden="true" />
        <div><h3>Personal numbers. Kept personal.</h3><p>Your answers are processed only while this page is open. They are not saved or sent to a server.</p></div>
      </aside>

      <section className="examples-section" aria-labelledby="examples-title">
        <div className="section-topline">
          <div><span className="eyebrow">THREE DIFFERENT STARTING POINTS</span><h2 id="examples-title">Try an example profile</h2></div>
          <p>No real personal information is used.</p>
        </div>
        <div className="persona-grid">
          {personas.map((persona) => {
            const profile = profileLabels[persona.id];
            return (
              <button type="button" key={persona.id} aria-label={persona.name} className={`persona-card ${profile.color}`} onClick={() => onLoadPersona(persona)}>
                <span className="persona-top"><span className="persona-avatar" aria-hidden="true">{persona.name[0]}</span><ArrowUpRight size={20} aria-hidden="true" /></span>
                <span className="persona-name">{persona.name}</span>
                <span className="persona-title">{profile.title}</span>
                <span className="persona-description">{profile.detail}</span>
                <span className="persona-action">Explore profile <ArrowRight size={16} aria-hidden="true" /></span>
              </button>
            );
          })}
        </div>
      </section>
      <p className="welcome-note"><Check size={16} aria-hidden="true" /> Educational estimates to help you prepare. Lender terms may differ.</p>
    </div>
  );
}

export function App() {
  const { state, dispatch } = useAssessment();
  const headingRef = useRef(null);
  const previousPhaseRef = useRef(state.phase);
  const isQuestionnaire = state.phase === PHASES.ESSENTIAL;
  const isLanding = state.phase === PHASES.LANDING;

  useEffect(() => {
    if (previousPhaseRef.current !== state.phase && !isQuestionnaire) {
      headingRef.current?.focus();
    }
    previousPhaseRef.current = state.phase;
  }, [state.phase, isQuestionnaire]);

  return (
    <PageShell phase={state.phase}>
      <main id="main-content" className={`app-main ${isQuestionnaire ? "question-main" : ""}`}>
        <div className="page-heading">
          <div>
            <h1 ref={headingRef} tabIndex="-1" className="outline-none">{phaseLabels[state.phase]}</h1>
            <p aria-live="polite">{descriptions[state.phase]}</p>
          </div>
          {isLanding ? <span className="private-label"><LockKeyhole size={14} aria-hidden="true" /> No account needed</span> : null}
        </div>
        {isLanding ? (
          <LandingScreen
            onStart={() => dispatch({ type: "START_ASSESSMENT" })}
            onLoadPersona={(persona) => dispatch({ type: "LOAD_PERSONA", payload: persona })}
          />
        ) : isQuestionnaire ? <QuestionnaireScreen /> : state.phase === PHASES.RESULTS ? <ResultsScreen /> : (
          <section className="py-8">
            <h2 className="text-xl font-semibold">{phaseLabels[state.phase]} preview</h2>
            <p className="my-4">Complete the questionnaire to see your assessment and printable Negotiation Card.</p>
            <Button onClick={() => dispatch({ type: "START_ASSESSMENT" })}>Start assessment <ArrowRight size={18} aria-hidden="true" /></Button>
          </section>
        )}
        {import.meta.env.DEV && new URLSearchParams(window.location.search).has("preview") ? (
          <details className="developer-tools no-print">
            <summary>Development previews</summary>
            <div className="flex flex-wrap gap-2 py-3">
              {phaseSequence.map((phase) => <Button key={phase} variant="secondary" onClick={() => dispatch({ type: "SET_PHASE", payload: phase })}>{phaseLabels[phase]}</Button>)}
            </div>
          </details>
        ) : null}
      </main>
    </PageShell>
  );
}
