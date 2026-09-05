export function PageShell({ children }) {
  return (
    <div className="min-h-screen min-w-80 overflow-x-hidden bg-background text-navy">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <header className="border-b border-navy/10 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-base font-semibold text-navy">Borrower Copilot</span>
          <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-semibold text-teal">
            Private preview
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
