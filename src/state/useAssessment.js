import { useContext } from "react";
import { AssessmentContext } from "./assessmentContext.js";

export function useAssessment() {
  const context = useContext(AssessmentContext);

  if (!context) {
    throw new Error("useAssessment must be used inside AssessmentProvider");
  }

  return context;
}
