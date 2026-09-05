const toneClasses = {
  low: "bg-gold/15 text-navy ring-gold/30",
  medium: "bg-teal/10 text-teal ring-teal/25",
  high: "bg-teal/15 text-navy ring-teal/30",
  foundation: "bg-navy/10 text-navy ring-navy/15"
};

export function ConfidenceBadge({ level = "medium", label }) {
  const displayLabel = label ?? `${level.replace("_", " ")} confidence`;

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 text-sm font-semibold capitalize ring-1 ${toneClasses[level] ?? toneClasses.medium}`}
    >
      {displayLabel}
    </span>
  );
}
