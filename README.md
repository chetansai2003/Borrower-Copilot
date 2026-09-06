# Borrower Copilot

Borrower Copilot is a private, borrower-side affordability checker. It helps a person understand whether a requested loan amount appears manageable, whether a smaller amount would be safer, or whether borrowing should be avoided for now.

The app is educational. It is not a lender approval system, financial advice, or a guarantee that any bank or lender will offer a loan.

## Problem Being Solved

Loan conversations often start with the amount a lender may be willing to offer, not the amount that is safer for the borrower. Borrower Copilot reverses that framing. It asks for a small set of borrower answers, applies transparent product assumptions, and presents:

- borrower-safe amount
- lender-likely comparison amount
- maximum comfortable EMI
- estimated interest and all-in APR bands
- stress-test facts
- reasons and risks
- a printable Negotiation Card for lender conversations

## Features

- Adaptive one-question-at-a-time questionnaire.
- In-memory answer handling with no localStorage, cookies, analytics, login, database, or backend.
- Pure JavaScript financial engine for EMI, APR, safe EMI, stress, fees, and tenure comparison.
- Deterministic assessment engine with exactly three verdicts: `BORROW`, `BORROW_LESS`, `DO_NOT_BORROW`.
- Accessible Results screen with explanations for important numbers.
- Printable Negotiation Card using `window.print()` and print CSS.
- Demo personas: Priya, Ravi, and Anita, available in both development and production with clearly labelled example data.
- Responsive layouts, a three-stage progress indicator, keyboard-accessible controls, and expandable calculation explanations.
- Vitest coverage for routing, reducer behavior, questionnaire rules, financial calculations, assessment decisions, result formatting, and UI behavior.

## Technology Stack

- React 19
- Vite 7
- JavaScript
- Tailwind CSS
- Zod validation
- Vitest
- React Testing Library
- ESLint
- lucide-react icons

## Run Locally

The welcome screen offers a fresh assessment or an example profile. Example profiles prefill the questionnaire so reviewers can inspect and change the answers before generating results.

For development-only placeholder screens, open the dev server with `?preview` in the URL and expand **Development previews**. These controls are excluded from production builds.

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Run quality checks:

```bash
npm run lint
npm run test
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Development Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite development server. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run Vitest once. |
| `npm run build` | Build static production files into `dist/`. |
| `npm run preview` | Preview the built `dist/` output locally. |

## Folder Structure

```text
src/
  app/          Phase definitions and top-level app rendering
  components/   Layout, questionnaire, results, negotiation, and UI components
  data/         Questions, personas, constants, and configured rules
  engine/       Pure questionnaire, financial, and assessment logic
  hooks/        Questionnaire controller logic
  state/        React Context and reducer state
  tests/        Vitest and React Testing Library tests
  utils/        Normalization and display-formatting helpers
```

## Architecture

Borrower Copilot uses phase-based rendering instead of React Router. The reducer tracks the current phase, answers, question history, assessment status, and assessment result. The questionnaire controller handles normalization, validation, adaptive navigation, and assessment generation.

The engine code is framework-independent:

- `questionEngine` decides visible questions and validates answers.
- financial modules calculate EMI, APR, fees, safe EMI, borrowing limits, stress, and tenure facts.
- `assessmentEngine` converts active answers and financial facts into one deterministic assessment.
- React components display the returned assessment and do not recalculate financial decisions.
- `createResultsViewModel` converts assessment data into display-ready strings without changing decisions.

## Privacy Approach

Answers are processed only while the page is open. They are stored in React memory and are not saved or sent to a server by this application. Refreshing the page clears the answers and assessment.

The app does not use localStorage, cookies, a backend, login, analytics, or sensitive data in URLs.

The app does not persist answers. If the user prints or saves the Negotiation Card as a PDF, that copy is controlled by the user and may contain financial estimates.

## Rules and Run-Throughs

- See [RULES.md](./RULES.md) for financial assumptions, formulas, verdict rules, confidence rules, and limitations.
- See [RUN_THROUGHS.md](./RUN_THROUGHS.md) for Priya, Ravi, Anita, and a five-minute demo script.

## Testing

The test suite covers:

- phase routing and reducer transitions
- adaptive question visibility and validation
- answer normalization, including `null`, `"unknown"`, and `0`
- EMI, inverse principal, APR, stress, emergency buffer, and affordability calculations
- assessment verdicts and persona invariants
- Results screen accessibility and print behavior
- display formatting safety for null, NaN, and Infinity

Run:

```bash
npm run lint
npm run test
npm run build
```

## Deployment

Borrower Copilot is a static Vite app. To deploy:

1. Run `npm run build`.
2. Upload the generated `dist/` directory to a static host such as Netlify, Vercel, Cloudflare Pages, GitHub Pages, or an internal static server.
3. Configure the host to serve `dist/index.html` for the app entry.

No server-side PDF generation, database, or API service is required for the current version.

## Known Limitations

- Estimates are based on configured product assumptions, not lender underwriting rules.
- No credit bureau data, bank statement data, or lender API data is used.
- APR is an educational estimate and is not claimed to be officially regulatory-compliant.
- Interest-rate bands are simplified and not lender offers.
- The lender-likely amount is only a comparison estimate. It is not an approval estimate and does not control the safety recommendation.
- Emergency savings and expense handling are simplified.
- Tax, insurance, and lender-specific charges are included only if configured. Current mandatory non-processing fees are `0`.
- Results depend on user-entered information and cannot verify whether answers are complete or accurate.

## Future Improvements

- Add richer result refinement questions.
- Add optional import/export controlled by the user.
- Add lender offer comparison mode.
- Add visual regression checks for the printable card.
- Add deeper accessibility audits with browser automation.
- Add localized copy and currency support.
- Add configurable rule presets for different product contexts.
