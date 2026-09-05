import { describe, expect, it } from "vitest";
import { personas } from "../data/personas.js";
import { VERDICTS } from "../engine/assessmentEngine.js";
import { runAssessment } from "../engine/assessmentEngine.js";

function assessmentForPersona(id) {
  const persona = personas.find((candidate) => candidate.id === id);
  const result = runAssessment(persona.answers);

  expect(result.ok).toBe(true);
  return result.value;
}

describe("documentation persona consistency", () => {
  it("keeps the documented persona verdict paths stable", () => {
    expect(assessmentForPersona("priya").verdict).toBe(VERDICTS.BORROW);
    expect(assessmentForPersona("ravi").verdict).toBe(VERDICTS.BORROW_LESS);
    expect(assessmentForPersona("anita").verdict).toBe(VERDICTS.DO_NOT_BORROW);
  });

  it("keeps the documented persona recommendation invariants stable", () => {
    const priya = assessmentForPersona("priya");
    const ravi = assessmentForPersona("ravi");
    const anita = assessmentForPersona("anita");

    expect(priya.recommendedAmount).toBe(priya.requestedAmount);
    expect(ravi.recommendedAmount).toBeLessThan(ravi.requestedAmount);
    expect(anita.recommendedAmount).toBeNull();
  });
});
