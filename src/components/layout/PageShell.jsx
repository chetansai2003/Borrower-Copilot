import { Check, Compass, LockKeyhole } from "lucide-react";
import { PHASES } from "../../app/routes.js";

export function PageShell({ children, phase = PHASES.LANDING }) {
  const currentStep = phase === PHASES.LANDING ? 0 : phase === PHASES.ESSENTIAL ? 1 : 2;
  return (
    <div className="app-shell">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white">Skip to content</a>
      <header className="app-header no-print">
        <div className="header-inner">
          <div className="brand"><span className="brand-mark"><Compass size={24} aria-hidden="true" /></span><span>Borrower<span className="brand-light"> Copilot</span></span></div>
          <span className="header-privacy"><LockKeyhole size={14} aria-hidden="true" /> Private by design</span>
        </div>
      </header>
      <section className="journey-band no-print" aria-label="Your progress">
        <ol className="journey" aria-label="Assessment journey">
          {["Get started", "Your finances", "Your assessment"].map((label, index) => (
            <li key={label} className={index === currentStep ? "current" : index < currentStep ? "done" : ""} aria-current={index === currentStep ? "step" : undefined}>
              <span className="journey-number" aria-hidden="true">{index < currentStep ? <Check size={14} /> : index + 1}</span><span>{label}</span>
            </li>
          ))}
        </ol>
      </section>
      {children}
      <footer className="app-footer no-print"><span>Borrower Copilot</span><span>Clarity before commitment.</span></footer>
    </div>
  );
}
