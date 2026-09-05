import { describe, expect, it } from "vitest";
import { PHASES } from "../app/routes.js";
import { assessmentReducer, initialState } from "../state/reducer.js";

describe("assessmentReducer", () => {
  it("starts on the landing phase", () => {
    expect(initialState.phase).toBe(PHASES.LANDING);
  });

  it("records navigation history when setting a valid phase", () => {
    const state = assessmentReducer(initialState, {
      type: "SET_PHASE",
      payload: PHASES.ESSENTIAL
    });

    expect(state.phase).toBe(PHASES.ESSENTIAL);
    expect(state.navigationHistory).toEqual([PHASES.LANDING]);
  });

  it("rejects invalid phase values", () => {
    const state = assessmentReducer(initialState, {
      type: "SET_PHASE",
      payload: "invalid"
    });

    expect(state).toBe(initialState);
  });

  it("goes back to the previous phase", () => {
    const essential = assessmentReducer(initialState, {
      type: "SET_PHASE",
      payload: PHASES.ESSENTIAL
    });
    const result = assessmentReducer(essential, {
      type: "SET_PHASE",
      payload: PHASES.INITIAL_RESULT
    });
    const back = assessmentReducer(result, { type: "GO_BACK" });

    expect(back.phase).toBe(PHASES.ESSENTIAL);
    expect(back.navigationHistory).toEqual([PHASES.LANDING]);
  });

  it("restores the exact initial state on reset", () => {
    const dirty = {
      ...initialState,
      phase: PHASES.RESULTS,
      answers: { income: 50000 },
      navigationHistory: [PHASES.LANDING]
    };

    expect(assessmentReducer(dirty, { type: "RESET_ASSESSMENT" })).toBe(initialState);
  });

  it("keeps answers in reducer memory", () => {
    const state = assessmentReducer(initialState, {
      type: "SET_ANSWER",
      payload: { id: "income", value: 50000 }
    });

    expect(state.answers).toEqual({ income: 50000 });
  });
});
