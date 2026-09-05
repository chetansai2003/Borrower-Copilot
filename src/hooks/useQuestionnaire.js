import { useEffect, useMemo } from "react";
import { questions } from "../data/questions.js";
import {
  getActiveAnswers,
  getCurrentQuestion,
  getNextQuestion,
  getVisibleQuestions,
  validateQuestion
} from "../engine/questionEngine.js";
import { useAssessment } from "../state/useAssessment.js";
import { normalizeAnswer } from "../utils/normalizeAnswer.js";

function withoutError(errors, questionId) {
  const nextErrors = { ...errors };
  delete nextErrors[questionId];
  return nextErrors;
}

export function useQuestionnaire() {
  const { state, dispatch } = useAssessment();
  const visibleQuestions = useMemo(() => getVisibleQuestions(questions, state.answers), [state.answers]);
  const currentQuestion = getCurrentQuestion(visibleQuestions, state.currentQuestionId);
  const currentStep = Math.max(
    0,
    visibleQuestions.findIndex((question) => question.id === currentQuestion?.id)
  );
  const progress = visibleQuestions.length === 0 ? 0 : ((currentStep + 1) / visibleQuestions.length) * 100;
  const activeAnswers = useMemo(() => getActiveAnswers(questions, state.answers), [state.answers]);

  useEffect(() => {
    if (visibleQuestions.length > 0 && currentQuestion && currentQuestion.id !== state.currentQuestionId) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: currentQuestion.id });
    }
  }, [currentQuestion, dispatch, state.currentQuestionId, visibleQuestions.length]);

  const setAnswer = (question, rawValue) => {
    const value = normalizeAnswer(question, rawValue);
    dispatch({ type: "SET_ANSWER", payload: { id: question.id, value } });
    dispatch({ type: "SET_ERRORS", payload: withoutError(state.errors, question.id) });
  };

  const submitCurrentQuestion = (event) => {
    event?.preventDefault();

    if (!currentQuestion) {
      return;
    }

    const value = state.answers[currentQuestion.id] ?? null;
    const validation = validateQuestion(currentQuestion, value);

    if (!validation.isValid) {
      dispatch({
        type: "SET_ERRORS",
        payload: { ...state.errors, [currentQuestion.id]: validation.error }
      });
      return;
    }

    const nextQuestion = getNextQuestion(visibleQuestions, currentQuestion.id);
    dispatch({ type: "SET_ERRORS", payload: withoutError(state.errors, currentQuestion.id) });

    if (nextQuestion) {
      dispatch({ type: "NEXT_QUESTION", payload: { nextQuestionId: nextQuestion.id } });
      return;
    }

    dispatch({ type: "COMPLETE_QUESTIONNAIRE", payload: { activeAnswers } });
  };

  const goBack = () => {
    const visibleIds = new Set(visibleQuestions.map((question) => question.id));
    const previousQuestionId = [...state.questionHistory].reverse().find((questionId) => visibleIds.has(questionId));

    if (previousQuestionId) {
      dispatch({ type: "PREVIOUS_QUESTION", payload: { previousQuestionId } });
    }
  };

  const restart = () => {
    const hasAnswers = Object.keys(state.answers).length > 0;

    if (!hasAnswers || window.confirm("Restart and clear the answers from this page?")) {
      dispatch({ type: "RESTART" });
    }
  };

  return {
    activeAnswers,
    currentQuestion,
    currentStep,
    error: currentQuestion ? state.errors[currentQuestion.id] : null,
    goBack,
    hasPreviousQuestion: state.questionHistory.length > 0,
    progress,
    restart,
    setAnswer,
    state,
    submitCurrentQuestion,
    totalQuestions: visibleQuestions.length,
    visibleQuestions
  };
}
