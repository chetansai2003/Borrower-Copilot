export function normalizeAnswer(question, value) {
  if (value === "unknown") {
    return "unknown";
  }

  if (value === "" || value === null || value === undefined) {
    return null;
  }

  if (question.type === "currency" || question.type === "number") {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  if (question.type === "choice") {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && value !== "" && /^\d+$/.test(String(value))
      ? numericValue
      : value;
  }

  return value;
}
