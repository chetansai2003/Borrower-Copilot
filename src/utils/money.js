const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export function formatINR(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return inrFormatter.format(numericValue);
}

export function parseCurrencyNumber(value) {
  const text = String(value ?? "").trim().replace(/^(-?)\u20b9\s*/, "$1");
  // Accept standard grouping without stripping signs or invalid characters.
  const amountPattern = /^-?(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d{1,2})?$/;
  if (!amountPattern.test(text)) {
    return "";
  }
  const amount = Number(text.replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : "";
}
