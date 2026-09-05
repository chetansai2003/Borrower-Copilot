import { describe, expect, it } from "vitest";
import { PHASES } from "../app/routes.js";
import { assessmentReducer, initialState } from "../state/reducer.js";

const withQuestionnaire = assessmentReducer(initialState, { type: "START_ASSESSMENT" });

describe("assessmentReducer", () => {
  it("starts on landing with the first question identified by id", () => {
    expect(initialState.phase).toBe(PHASES.LANDING);
    expect(initialState.currentQuestionId).toBe("borrowingPurpose");
    expect(initialState.questionnaireStatus).toBe("in_progress");
    expect(initialState.assessmentStatus).toBe("idle");
    expect(initialState.assessmentError).toBeNull();
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

  it("atomically completes the questionnaire with answers and assessment", () => {
    const assessment = { verdict: "BORROW" };
    const answers = { borrowingPurpose: "home_repair", recentRepaymentDifficulty: "none" };
    const state = assessmentReducer(withQuestionnaire, {
      type: "COMPLETE_QUESTIONNAIRE",
      payload: { answers, assessment }
    });

    expect(state.answers).toBe(answers);
    expect(state.assessment).toBe(assessment);
    expect(state.questionnaireStatus).toBe("complete");
    expect(state.phase).toBe(PHASES.RESULTS);
    expect(state.assessmentStatus).toBe("ready");
    expect(state.assessmentError).toBeNull();
    expect(state.errors).toEqual({});
  });

  it("stores assessment errors without fabricating an assessment", () => {
    const error = { code: "INTERNAL", message: "Could not calculate." };
    const state = assessmentReducer(withQuestionnaire, {
      type: "SET_ASSESSMENT_ERROR",
      payload: error
    });

    expect(state.phase).toBe(PHASES.RESULTS);
    expect(state.assessment).toBeNull();
    expect(state.assessmentStatus).toBe("error");
    expect(state.assessmentError).toBe(error);
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
    expect(state.assessmentStatus).toBe("idle");
  });

  it("restores the exact initial state on restart", () => {
    const completed = assessmentReducer(withQuestionnaire, {
      type: "COMPLETE_QUESTIONNAIRE",
      payload: { answers: { requestedAmount: 100000 }, assessment: { verdict: "BORROW" } }
    });

    expect(assessmentReducer(completed, { type: "RESTART" })).toBe(initialState);
  });
});
