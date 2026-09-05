export function SectionHeader({ eyebrow, title, description, className = "" }) {
  return (
    <div className={className}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase text-teal">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold leading-tight text-navy sm:text-3xl">
        {title}
      </h2>
      {description ? <p className="mt-3 max-w-2xl text-base leading-7 text-navy/72">{description}</p> : null}
    </div>
  );
}
