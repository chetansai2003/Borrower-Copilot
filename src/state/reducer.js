import { PHASES, isValidPhase } from "../app/routes.js";

export const initialState = Object.freeze({
  phase: PHASES.LANDING,
  answers: {},
  currentQuestionId: null,
  completedQuestionIds: [],
  assessment: null,
  navigationHistory: []
});

export function assessmentReducer(state, action) {
  switch (action.type) {
    case "START_ASSESSMENT":
      return {
        ...state,
        phase: PHASES.ESSENTIAL,
        navigationHistory: [...state.navigationHistory, state.phase]
      };

    case "SET_PHASE": {
      if (!isValidPhase(action.payload) || action.payload === state.phase) {
        return state;
      }

      return {
        ...state,
        phase: action.payload,
        navigationHistory: [...state.navigationHistory, state.phase]
      };
    }

    case "SET_ANSWER":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.id]: action.payload.value
        }
      };

    case "GO_BACK": {
      if (state.navigationHistory.length === 0) {
        return state;
      }

      const previousPhase = state.navigationHistory[state.navigationHistory.length - 1];

      return {
        ...state,
        phase: previousPhase,
        navigationHistory: state.navigationHistory.slice(0, -1)
      };
    }

    case "RESET_ASSESSMENT":
      return initialState;

    case "SET_ASSESSMENT":
      return {
        ...state,
        assessment: action.payload
      };

    default:
      return state;
  }
}
