export function ProgressIndicator({ current, total, label }) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div aria-label={`${label}: step ${current} of ${total}`} className="w-full">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-navy">
        <span>{label}</span>
        <span>
          {current}/{total}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy/10">
        <div
          className="h-full rounded-full bg-teal transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
