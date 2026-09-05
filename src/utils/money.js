const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export function formatINR(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return inrFormatter.format(numericValue);
}

export function parseCurrencyNumber(value) {
  const digits = String(value).replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  return Number(digits);
}
