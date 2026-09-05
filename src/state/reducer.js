import { PHASES, isValidPhase } from "../app/routes.js";

export const initialState = Object.freeze({
  phase: PHASES.LANDING,
  questionnaireStatus: "in_progress",
  currentQuestionId: "borrowingPurpose",
  answers: {},
  errors: {},
  assessment: null,
  assessmentStatus: "idle",
  assessmentError: null,
  phaseHistory: [],
  questionHistory: [],
  completedQuestionIds: []
});

function addUnique(values, value) {
  return values.includes(value) ? values : [...values, value];
}

export function assessmentReducer(state, action) {
  switch (action.type) {
    case "START_ASSESSMENT":
      return {
        ...state,
        phase: PHASES.ESSENTIAL,
        questionnaireStatus: "in_progress",
        currentQuestionId: "borrowingPurpose",
        assessment: null,
        assessmentStatus: "idle",
        assessmentError: null,
        phaseHistory: [...state.phaseHistory, state.phase]
      };

    case "SET_PHASE": {
      if (!isValidPhase(action.payload) || action.payload === state.phase) {
        return state;
      }

      return {
        ...state,
        phase: action.payload,
        phaseHistory: [...state.phaseHistory, state.phase]
      };
    }

    case "SET_CURRENT_QUESTION":
      return {
        ...state,
        currentQuestionId: action.payload
      };

    case "SET_ANSWER":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.id]: action.payload.value
        }
      };

    case "NEXT_QUESTION":
      return {
        ...state,
        currentQuestionId: action.payload.nextQuestionId,
        questionHistory: [...state.questionHistory, state.currentQuestionId],
        completedQuestionIds: addUnique(state.completedQuestionIds, state.currentQuestionId)
      };

    case "PREVIOUS_QUESTION": {
      if (!action.payload?.previousQuestionId) {
        return state;
      }

      const previousIndex = state.questionHistory.lastIndexOf(action.payload.previousQuestionId);
      const nextHistory = previousIndex >= 0 ? state.questionHistory.slice(0, previousIndex) : state.questionHistory.slice(0, -1);

      return {
        ...state,
        currentQuestionId: action.payload.previousQuestionId,
        questionHistory: nextHistory
      };
    }

    case "SET_ERRORS":
      return {
        ...state,
        errors: action.payload
      };

    case "COMPLETE_QUESTIONNAIRE":
      return {
        ...state,
        answers: action.payload.answers ?? state.answers,
        questionnaireStatus: "complete",
        phase: PHASES.RESULTS,
        assessment: action.payload.assessment,
        assessmentStatus: "ready",
        assessmentError: null,
        errors: {},
        phaseHistory: [...state.phaseHistory, state.phase],
        completedQuestionIds: addUnique(state.completedQuestionIds, state.currentQuestionId)
      };

    case "SET_ASSESSMENT_ERROR":
      return {
        ...state,
        phase: PHASES.RESULTS,
        assessment: null,
        assessmentStatus: "error",
        assessmentError: action.payload,
        phaseHistory: state.phase === PHASES.RESULTS ? state.phaseHistory : [...state.phaseHistory, state.phase]
      };

    case "GO_BACK": {
      if (state.phaseHistory.length === 0) {
        return state;
      }

      const previousPhase = state.phaseHistory[state.phaseHistory.length - 1];

      return {
        ...state,
        phase: previousPhase,
        phaseHistory: state.phaseHistory.slice(0, -1)
      };
    }

    case "RESTART":
    case "RESET_ASSESSMENT":
      return initialState;

    case "LOAD_PERSONA":
      return {
        ...initialState,
        phase: PHASES.ESSENTIAL,
        answers: action.payload.answers ?? {},
        phaseHistory: [PHASES.LANDING]
      };

    case "SET_ASSESSMENT":
      return {
        ...state,
        assessment: action.payload,
        assessmentStatus: action.payload ? "ready" : "idle",
        assessmentError: null
      };

    default:
      return state;
  }
}
