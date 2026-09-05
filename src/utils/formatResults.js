export function formatCurrency(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Not available";
  }

  return `${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0
  }).format(value)}%`;
}

export function formatPercentBand(band) {
  if (!band || !Number.isFinite(band.minimum) || !Number.isFinite(band.maximum)) {
    return "Not available";
  }

  return `${formatPercent(band.minimum)} to ${formatPercent(band.maximum)}`;
}

export function formatTenure(months) {
  if (months === null || months === undefined || !Number.isFinite(months)) {
    return "Not available";
  }

  if (months < 12) {
    return `${months} months`;
  }

  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const yearText = `${years} ${years === 1 ? "year" : "years"}`;
  return remainder === 0 ? yearText : `${yearText} ${remainder} months`;
}

export function formatValue(value) {
  if (value === null || value === undefined) return "Not available";
  if (typeof value === "number") return Number.isFinite(value) ? new Intl.NumberFormat("en-IN").format(value) : "Not available";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length === 0 ? "None" : value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replaceAll("_", " ");
}
