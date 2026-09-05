export function getVisibleQuestions(questionList, answers) {
  return questionList.filter((question) => question.appliesWhen(answers));
}

export function getCurrentQuestion(visibleQuestions, currentQuestionId) {
  return visibleQuestions.find((question) => question.id === currentQuestionId) ?? visibleQuestions[0] ?? null;
}

export function getNextQuestion(visibleQuestions, currentQuestionId) {
  const currentIndex = visibleQuestions.findIndex((question) => question.id === currentQuestionId);
  return currentIndex >= 0 ? visibleQuestions[currentIndex + 1] ?? null : visibleQuestions[0] ?? null;
}

export function getPreviousQuestionId(questionHistory) {
  return questionHistory[questionHistory.length - 1] ?? null;
}

export function validateQuestion(question, value) {
  if (!question) {
    return { isValid: false, error: "Question is not available." };
  }

  if (value === "unknown") {
    return question.unknownAllowed
      ? { isValid: true, error: null }
      : { isValid: false, error: "Choose an answer for this question." };
  }

  if (question.required && (value === null || value === undefined || value === "")) {
    return { isValid: false, error: "Answer this question to continue." };
  }

  const result = question.schema.safeParse(value);

  if (!result.success) {
    return { isValid: false, error: result.error.issues[0]?.message ?? "Check this answer." };
  }

  return { isValid: true, error: null };
}

export function validateVisibleQuestions(visibleQuestions, answers) {
  return visibleQuestions.reduce((errors, question) => {
    const result = validateQuestion(question, answers[question.id] ?? null);

    if (!result.isValid) {
      errors[question.id] = result.error;
    }

    return errors;
  }, {});
}

export function getActiveAnswers(questionList, answers) {
  const visibleQuestions = getVisibleQuestions(questionList, answers);

  return Object.fromEntries(
    visibleQuestions
      .filter((question) => Object.prototype.hasOwnProperty.call(answers, question.id))
      .map((question) => [question.id, answers[question.id]])
  );
}
