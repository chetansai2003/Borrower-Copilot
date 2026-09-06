export function ProgressIndicator({ current, total, label }) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div aria-label={`${label}: step ${current} of ${total}`} className="w-full">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-navy">
        <span>{label}</span>
        <span aria-hidden="true">{Math.round(percentage)}%</span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} className="mt-3 h-1.5 overflow-hidden rounded-full bg-navy/10">
        <div
          className="h-full rounded-full bg-teal transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
