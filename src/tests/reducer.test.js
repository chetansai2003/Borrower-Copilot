import { describe, expect, it } from "vitest";
import { PHASES } from "../app/routes.js";
import { assessmentReducer, initialState } from "../state/reducer.js";

const withQuestionnaire = assessmentReducer(initialState, { type: "START_ASSESSMENT" });

describe("assessmentReducer", () => {
  it("starts on landing with the first question identified by id", () => {
    expect(initialState.phase).toBe(PHASES.LANDING);
    expect(initialState.currentQuestionId).toBe("borrowingPurpose");
    expect(initialState.questionnaireStatus).toBe("in_progress");
  });

  it("tracks phase history separately from question history", () => {
    expect(withQuestionnaire.phase).toBe(PHASES.ESSENTIAL);
    expect(withQuestionnaire.phaseHistory).toEqual([PHASES.LANDING]);
    expect(withQuestionnaire.questionHistory).toEqual([]);
  });

  it("stores answers without converting unknown or zero", () => {
    const unknownState = assessmentReducer(withQuestionnaire, {
      type: "SET_ANSWER",
      payload: { id: "existingEmis", value: "unknown" }
    });
    const zeroState = assessmentReducer(unknownState, {
      type: "SET_ANSWER",
      payload: { id: "emergencySavings", value: 0 }
    });

    expect(zeroState.answers.existingEmis).toBe("unknown");
    expect(zeroState.answers.emergencySavings).toBe(0);
  });

  it("moves to the next question by id and records the visited path", () => {
    const state = assessmentReducer(withQuestionnaire, {
      type: "NEXT_QUESTION",
      payload: { nextQuestionId: "requestedAmount" }
    });

    expect(state.currentQuestionId).toBe("requestedAmount");
    expect(state.questionHistory).toEqual(["borrowingPurpose"]);
    expect(state.completedQuestionIds).toContain("borrowingPurpose");
  });

  it("returns to the previous question from question history", () => {
    const requested = assessmentReducer(withQuestionnaire, {
      type: "NEXT_QUESTION",
      payload: { nextQuestionId: "requestedAmount" }
    });
    const back = assessmentReducer(requested, {
      type: "PREVIOUS_QUESTION",
      payload: { previousQuestionId: "borrowingPurpose" }
    });

    expect(back.currentQuestionId).toBe("borrowingPurpose");
    expect(back.questionHistory).toEqual([]);
  });

  it("completes the questionnaire without creating an assessment", () => {
    const state = assessmentReducer(withQuestionnaire, { type: "COMPLETE_QUESTIONNAIRE" });

    expect(state.questionnaireStatus).toBe("complete");
    expect(state.phase).toBe(PHASES.INITIAL_RESULT);
    expect(state.assessment).toBeNull();
  });

  it("loads a persona after clearing previous answers", () => {
    const dirty = assessmentReducer(withQuestionnaire, {
      type: "SET_ANSWER",
      payload: { id: "monthlyIncome", value: 50000 }
    });
    const state = assessmentReducer(dirty, {
      type: "LOAD_PERSONA",
      payload: { answers: { borrowingPurpose: "business" } }
    });

    expect(state.answers).toEqual({ borrowingPurpose: "business" });
    expect(state.currentQuestionId).toBe("borrowingPurpose");
    expect(state.phase).toBe(PHASES.ESSENTIAL);
  });

  it("restores the exact initial state on restart", () => {
    expect(assessmentReducer(withQuestionnaire, { type: "RESTART" })).toBe(initialState);
  });
});
