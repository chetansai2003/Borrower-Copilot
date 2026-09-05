import { useMemo, useReducer } from "react";
import { AssessmentContext } from "./assessmentContext.js";
import { assessmentReducer, initialState } from "./reducer.js";

export function AssessmentProvider({ children }) {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}
