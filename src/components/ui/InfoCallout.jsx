const tones = {
  neutral: "border-navy/10 bg-navy/5",
  support: "border-teal/20 bg-teal/10",
  caution: "border-gold/30 bg-gold/15",
  danger: "border-danger/25 bg-danger/10"
};

export function InfoCallout({ title, message, tone = "neutral", className = "" }) {
  return (
    <aside className={`rounded-lg border p-4 ${tones[tone] ?? tones.neutral} ${className}`}>
      <p className="text-sm font-semibold text-navy">{title}</p>
      <p className="mt-1 text-sm leading-6 text-navy/72">{message}</p>
    </aside>
  );
}
