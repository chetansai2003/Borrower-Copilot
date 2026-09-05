export function ok(value, details) {
  return details === undefined ? { ok: true, value } : { ok: true, value, details };
}

export function fail(code, message, field) {
  return {
    ok: false,
    error: field ? { code, message, field } : { code, message }
  };
}

export function warning(code, message, field) {
  return field ? { code, message, field } : { code, message };
}

export function isMissing(value) {
  return value === null || value === undefined || value === "";
}

export function isUnknown(value) {
  return value === "unknown";
}

export function requireFiniteNumber(value, code, message, field, { allowZero = true } = {}) {
  if (isMissing(value) || isUnknown(value)) {
    return fail(code, message, field);
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fail(code, message, field);
  }

  if (value < 0 || (!allowZero && value === 0)) {
    return fail(code, message, field);
  }

  return ok(value);
}
