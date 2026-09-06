const variants = {
  primary:
    "bg-teal text-white hover:bg-teal/90 disabled:bg-navy/20 disabled:text-navy/50",
  secondary:
    "border border-navy/15 bg-surface text-navy hover:bg-background disabled:bg-surface disabled:text-navy/35"
};

export function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
