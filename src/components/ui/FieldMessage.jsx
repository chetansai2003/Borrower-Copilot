export function FieldMessage({ id, children, tone = "helper" }) {
  if (!children) {
    return null;
  }

  const classes =
    tone === "error"
      ? "mt-2 text-sm font-medium text-danger"
      : "mt-2 text-sm text-navy/65";

  return (
    <p id={id} className={classes} role={tone === "error" ? "alert" : undefined}>
      {children}
    </p>
  );
}
