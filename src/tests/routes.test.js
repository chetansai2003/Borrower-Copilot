import { describe, expect, it } from "vitest";
import { PHASES, isValidPhase, phaseSequence } from "../app/routes.js";

describe("routes", () => {
  it("validates known phases", () => {
    expect(isValidPhase(PHASES.LANDING)).toBe(true);
    expect(isValidPhase("missing")).toBe(false);
  });

  it("contains every placeholder phase", () => {
    expect(phaseSequence).toEqual([
      PHASES.LANDING,
      PHASES.ESSENTIAL,
      PHASES.INITIAL_RESULT,
      PHASES.REFINEMENT,
      PHASES.RESULTS,
      PHASES.CARD
    ]);
  });
});
