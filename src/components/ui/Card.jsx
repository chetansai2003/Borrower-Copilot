export function Card({ children, className = "", ...props }) {
  return (
    <section
      className={`rounded-lg border border-navy/10 bg-surface p-5 shadow-soft sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
