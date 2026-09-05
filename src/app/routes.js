export const PHASES = Object.freeze({
  LANDING: "landing",
  ESSENTIAL: "essential",
  INITIAL_RESULT: "initial_result",
  REFINEMENT: "refinement",
  RESULTS: "results",
  CARD: "card"
});

export const phaseLabels = Object.freeze({
  [PHASES.LANDING]: "Welcome",
  [PHASES.ESSENTIAL]: "Essential questions",
  [PHASES.INITIAL_RESULT]: "Initial result",
  [PHASES.REFINEMENT]: "Refinement",
  [PHASES.RESULTS]: "Results",
  [PHASES.CARD]: "Negotiation card"
});

export const phaseSequence = Object.freeze([
  PHASES.LANDING,
  PHASES.ESSENTIAL,
  PHASES.INITIAL_RESULT,
  PHASES.REFINEMENT,
  PHASES.RESULTS,
  PHASES.CARD
]);

export const isValidPhase = (phase) => Object.values(PHASES).includes(phase);
