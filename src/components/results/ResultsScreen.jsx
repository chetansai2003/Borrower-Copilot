import {
  AlertTriangle,
  BadgeIndianRupee,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileText,
  Gauge,
  Printer,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { PHASES } from "../../app/routes.js";
import { DECISION_STATUSES, VERDICTS } from "../../data/constants.js";
import { useAssessment } from "../../state/useAssessment.js";
import { createResultsViewModel } from "../../utils/createResultsViewModel.js";
import { formatCurrency, formatTenure, formatValue } from "../../utils/formatResults.js";
import { Button } from "../ui/Button.jsx";
import { Card } from "../ui/Card.jsx";
import { ConfidenceBadge } from "../ui/ConfidenceBadge.jsx";
import { InfoCallout } from "../ui/InfoCallout.jsx";

const verdictIcons = {
  [VERDICTS.BORROW]: CheckCircle2,
  [VERDICTS.BORROW_LESS]: AlertTriangle,
  [VERDICTS.DO_NOT_BORROW]: ShieldAlert
};

const toneClasses = {
  support: "border-teal/30 bg-teal/10 text-teal",
  caution: "border-gold/40 bg-gold/15 text-navy",
  danger: "border-danger/30 bg-danger/10 text-danger",
  neutral: "border-navy/15 bg-navy/5 text-navy"
};

function hasUsableNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function barWidth(value, max) {
  if (!hasUsableNumber(value) || !hasUsableNumber(max)) return "0%";
  return `${Math.max(4, Math.min(100, (value / max) * 100))}%`;
}

function MetricCard({ icon: Icon, label, value, helper, emphasis = false }) {
  return (
    <Card className={`metric-card space-y-3 ${emphasis ? "metric-emphasis" : ""}`}>
      <div className="flex min-h-11 items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-navy/8 text-navy">
          <Icon aria-hidden="true" size={22} />
        </span>
        <p className="text-sm font-semibold text-navy/70">{label}</p>
      </div>
      <p className="break-words text-2xl font-semibold text-navy sm:text-3xl">{value}</p>
      {helper ? <p className="text-sm leading-6 text-navy/70">{helper}</p> : null}
    </Card>
  );
}

function ComparisonBar({ assessment, viewModel }) {
  const max = Math.max(
    assessment?.requestedAmount ?? 0,
    assessment?.borrowerSafeAmount ?? 0,
    assessment?.lenderLikelyAmount ?? 0
  );

  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-3">
        <BadgeIndianRupee className="mt-1 text-teal" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold text-navy">Requested amount versus safer range</h2>
          <p className="mt-2 text-sm leading-6 text-navy/70">
            The borrower-safe amount is the safety recommendation. The lender-likely amount estimates possible lender capacity and is not an approval estimate or safety recommendation.
          </p>
        </div>
      </div>

      <div role="img" aria-label={viewModel.comparisonAriaLabel} className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between gap-3 text-sm font-semibold text-navy">
            <span>Requested</span>
            <span>{viewModel.requestedAmount}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-navy/10">
            <div className="h-full rounded-full bg-navy" style={{ width: barWidth(assessment?.requestedAmount, max) }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between gap-3 text-sm font-semibold text-teal">
            <span>Borrower-safe</span>
            <span>{viewModel.borrowerSafeAmount}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-navy/10">
            <div className="h-full rounded-full bg-teal" style={{ width: barWidth(assessment?.borrowerSafeAmount, max) }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between gap-3 text-sm font-semibold text-navy/70">
            <span>Lender-likely comparison</span>
            <span>{viewModel.lenderLikelyAmount}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-navy/10">
            <div className="h-full rounded-full bg-gold" style={{ width: barWidth(assessment?.lenderLikelyAmount, max) }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PricingSection({ viewModel }) {
  return (
    <Card className="pricing-section space-y-5">
      <div className="flex items-start gap-3">
        <TrendingUp className="mt-1 text-teal" aria-hidden="true" />
        <div>
          <h2 id="apr-heading" className="text-xl font-semibold text-navy">All-in APR estimate</h2>
          <p className="mt-2 break-words text-3xl font-semibold text-navy">{viewModel.aprBand}</p>
          <p className="mt-2 text-sm leading-6 text-navy/70">
            APR includes configured mandatory upfront fees, so it is more useful than the advertised interest rate when comparing offers.
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-navy/10 bg-background p-4">
        <h3 id="interest-heading" className="text-base font-semibold text-navy">Advertised interest-rate estimate</h3>
        <p className="mt-1 text-xl font-semibold text-navy">{viewModel.interestBand}</p>
      </div>
    </Card>
  );
}

function TenureTradeoff({ assessment, viewModel }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <Gauge className="mt-1 text-teal" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold text-navy">Tenure tradeoff</h2>
          <p className="mt-2 text-sm leading-6 text-navy/70">{viewModel.recommendedTenure}</p>
        </div>
      </div>
      {viewModel.tenureComparison.length > 0 ? (
        <div className="overflow-x-auto" role="region" aria-label="Tenure comparison" tabIndex={0}>
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-navy/70">
                <th className="py-2 pr-3 font-semibold">Tenure</th>
                <th className="py-2 pr-3 font-semibold">EMI</th>
                <th className="py-2 pr-3 font-semibold">Total interest</th>
                <th className="py-2 font-semibold">Safe EMI fit</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.tenureComparison.map((option) => (
                <tr key={option.tenureMonths} className="border-b border-navy/8 last:border-0">
                  <td className="py-3 pr-3 font-medium text-navy">{formatTenure(option.tenureMonths)}</td>
                  <td className="py-3 pr-3 text-navy/78">{formatCurrency(option.emi)}</td>
                  <td className="py-3 pr-3 text-navy/78">{formatCurrency(option.totalInterest)}</td>
                  <td className="py-3 text-navy/78">{option.withinSafeEmi ? "Within safe EMI" : "Above safe EMI"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-navy/70">Tenure comparison is not available.</p>
      )}
      {assessment?.stillAboveSafeEmi ? (
        <InfoCallout tone="caution" title="No safe tenure found" message="The closest tenure is still above the safe EMI, so it is not labelled as recommended." />
      ) : null}
    </Card>
  );
}

function StressSummary({ viewModel }) {
  const requested = viewModel.requestedLoanStress;
  const baseline = viewModel.baselineStress;

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 text-teal" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold text-navy">Stress test</h2>
          <p className="mt-2 text-sm leading-6 text-navy/70">
            This checks whether repayment remains manageable after lower income and a higher estimated rate.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-navy/10 bg-background p-4">
          <p className="text-sm font-semibold text-navy/70">Existing finances</p>
          <p className="mt-2 text-lg font-semibold text-navy">{baseline.passed ? "Manageable" : "Under stress"}</p>
        </div>
        <div className="rounded-lg border border-navy/10 bg-background p-4">
          <p className="text-sm font-semibold text-navy/70">Requested loan stress</p>
          <p className="mt-2 text-lg font-semibold text-navy">{requested.passed ? "Passes" : "Does not pass"}</p>
          <p className="mt-2 text-sm text-navy/70">Stressed EMI: {viewModel.stressedEmi}</p>
          <p className="mt-1 text-sm text-navy/70">Remaining surplus: {viewModel.stressSurplus}</p>
          <p className="mt-1 text-sm text-navy/70">Debt ratio: {viewModel.stressedDebtRatio}</p>
        </div>
      </div>
    </Card>
  );
}

function RiskList({ risks }) {
  return (
    <Card className="space-y-4">
      <h2 className="text-xl font-semibold text-navy">Key risks</h2>
      {risks.length === 0 ? (
        <p className="text-sm leading-6 text-navy/70">No critical repayment risks were reported.</p>
      ) : (
        <ul className="space-y-3">
          {risks.map((risk) => (
            <li key={risk.code} className="rounded-lg border border-navy/10 bg-background p-4">
              <p className="text-sm font-semibold uppercase text-navy/60">{risk.severity}</p>
              <p className="mt-1 font-semibold text-navy">{risk.title}</p>
              <p className="mt-1 text-sm leading-6 text-navy/70">{risk.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function MissingInformationList({ viewModel }) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div>
          <h2 className="text-xl font-semibold text-navy">Confidence and missing information</h2>
          <p className="mt-2 text-sm leading-6 text-navy/70">Confidence reflects data quality, not whether the verdict is positive or negative.</p>
        </div>
        <ConfidenceBadge level={viewModel.confidence.toLowerCase().split(" ")[0]} label={viewModel.confidence} />
      </div>
      {viewModel.missingInformation.length === 0 && viewModel.confidenceReasons.length === 0 ? (
        <p className="text-sm leading-6 text-navy/70">No missing information affected this estimate.</p>
      ) : (
        <ul className="space-y-2 text-sm leading-6 text-navy/72">
          {[...viewModel.missingInformation, ...viewModel.confidenceReasons].map((item, index) => (
            <li key={`${item.code}-${index}`} className="rounded-lg bg-background px-4 py-3">{item.message}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ExplanationPanels({ explanations }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <CircleHelp className="mt-1 text-teal" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold text-navy">Explanation of calculations</h2>
          <p className="mt-2 text-sm leading-6 text-navy/70">Open each item to see how the number was prepared.</p>
        </div>
      </div>
      <div className="space-y-3">
        {explanations.map((explanation) => (
          <details key={explanation.id} className="group rounded-lg border border-navy/10 bg-background p-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-navy">
              <span>How we calculated this: {explanation.title}</span>
              <ChevronDown className="shrink-0 transition group-open:rotate-180" aria-hidden="true" size={20} />
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-6 text-navy/72">
              <p>{explanation.message}</p>
              <div>
                <p className="font-semibold text-navy">Inputs used</p>
                <dl className="mt-1 grid gap-1">
                  {Object.entries(explanation.inputs ?? {}).map(([key, value]) => (
                    <div key={key} className="flex flex-wrap justify-between gap-2">
                      <dt className="capitalize text-navy/60">{key.replaceAll(/([A-Z])/g, " $1")}</dt>
                      <dd className="font-medium text-navy">{formatValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <p className="font-semibold text-navy">Rule applied</p>
                <dl className="mt-1 grid gap-1">
                  {Object.entries(explanation.rules ?? {}).map(([key, value]) => (
                    <div key={key} className="flex flex-wrap justify-between gap-2">
                      <dt className="capitalize text-navy/60">{key.replaceAll(/([A-Z])/g, " $1")}</dt>
                      <dd className="font-medium text-navy">{formatValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p><span className="font-semibold text-navy">How to improve it:</span> {explanation.improvement}</p>
            </div>
          </details>
        ))}
      </div>
    </Card>
  );
}

function warningSigns(viewModel) {
  const signs = [];
  if (!viewModel.requestedLoanStress.passed) signs.push("The requested loan does not pass the stress case.");
  if (viewModel.baselineStress.seriousFailure) signs.push("Existing finances already appear stressed before a new loan.");
  signs.push(...viewModel.risks.map((risk) => risk.title));
  signs.push(...viewModel.missingInformation.map((item) => item.message));
  return signs.length > 0 ? signs : ["No critical warning signs were reported in the provided answers."];
}

export function NegotiationCard({ viewModel }) {
  const signs = warningSigns(viewModel);

  return (
    <section id="negotiation-card" className="rounded-lg border border-navy/10 bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-teal">Negotiation Card</p>
          <h2 className="mt-2 text-2xl font-semibold text-navy">Borrower-safe talking points</h2>
          <p className="mt-2 text-sm leading-6 text-navy/70">{viewModel.summary}</p>
        </div>
        <FileText className="text-teal" aria-hidden="true" size={30} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard icon={BadgeIndianRupee} label="Requested amount" value={viewModel.requestedAmount} />
        <MetricCard icon={ShieldCheck} label="Recommended amount" value={viewModel.recommendedAmount} emphasis />
        <MetricCard icon={ShieldCheck} label="Borrower-safe amount" value={viewModel.borrowerSafeAmount} />
        <MetricCard icon={BadgeIndianRupee} label="Lender-likely comparison" value={viewModel.lenderLikelyAmount} helper="Not an approval estimate or safety recommendation." />
        <MetricCard icon={Gauge} label="Maximum comfortable EMI" value={viewModel.safeEmi} />
        <MetricCard icon={Gauge} label="Proposed EMI" value={viewModel.proposedEmi} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-navy/10 bg-background p-4">
          <h3 className="text-base font-semibold text-navy">Pricing and fees</h3>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-3"><dt>All-in APR band</dt><dd className="font-semibold text-navy">{viewModel.aprBand}</dd></div>
            <div className="flex justify-between gap-3"><dt>Interest band</dt><dd className="font-semibold text-navy">{viewModel.interestBand}</dd></div>
            <div className="flex justify-between gap-3"><dt>Processing fee</dt><dd className="font-semibold text-navy">{viewModel.processingFeeAmount} ({viewModel.processingFeeRate})</dd></div>
            <div className="flex justify-between gap-3"><dt>Total upfront fees</dt><dd className="font-semibold text-navy">{viewModel.totalUpfrontFees}</dd></div>
            <div className="flex justify-between gap-3"><dt>Net disbursal</dt><dd className="font-semibold text-navy">{viewModel.netDisbursal}</dd></div>
          </dl>
        </div>
        <div className="rounded-lg border border-navy/10 bg-background p-4">
          <h3 className="text-base font-semibold text-navy">Tenure guidance</h3>
          <p className="mt-2 text-sm leading-6 text-navy/72">{viewModel.recommendedTenure}</p>
          <p className="mt-3 text-sm leading-6 text-navy/72">Final borrower recommendation: {viewModel.verdict.title}.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-base font-semibold text-navy">Questions to ask the lender</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-navy/72">
            {viewModel.negotiationPoints.map((point) => (
              <li key={point.id} className="rounded-lg bg-background px-4 py-3">
                <span className="font-semibold text-navy">{point.title}:</span> {point.message}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-base font-semibold text-navy">Warning signs</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-navy/72">
            {signs.map((sign) => (
              <li key={sign} className="rounded-lg bg-background px-4 py-3">{sign}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm leading-6 text-navy/78">
        <p>This is an educational affordability estimate, not a loan approval or financial guarantee.</p>
        <p>This card contains financial estimates. Share it only with people or institutions you trust.</p>
      </div>
    </section>
  );
}

function AssessmentErrorScreen({ error, onRetry, onReviewAnswers }) {
  return (
    <Card className="space-y-5" role="alert">
      <ShieldAlert className="text-danger" aria-hidden="true" size={32} />
      <div>
        <h2 className="text-2xl font-semibold text-navy">We could not generate the result.</h2>
        <p className="mt-2 text-sm leading-6 text-navy/70">{error?.message ?? "An internal calculation problem stopped the assessment."}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onRetry}>Try again</Button>
        <Button variant="secondary" onClick={onReviewAnswers}>Review answers</Button>
      </div>
    </Card>
  );
}

function NoAssessmentScreen({ onReviewAnswers }) {
  return (
    <Card className="space-y-5">
      <h2 className="text-2xl font-semibold text-navy">Complete the questionnaire first</h2>
      <p className="text-sm leading-6 text-navy/70">A borrowing assessment is created only after the questionnaire is complete.</p>
      <Button onClick={onReviewAnswers}>Back to questionnaire</Button>
    </Card>
  );
}

export function ResultsScreen() {
  const { state, dispatch } = useAssessment();
  const assessment = state.assessment;
  const viewModel = createResultsViewModel(assessment);
  const VerdictIcon = verdictIcons[assessment?.verdict] ?? AlertTriangle;

  const reviewAnswers = () => dispatch({ type: "SET_PHASE", payload: PHASES.ESSENTIAL });
  const restart = () => {
    if (Object.keys(state.answers).length === 0 || window.confirm("Restart and clear the answers from this page?")) {
      dispatch({ type: "RESTART" });
    }
  };

  if (state.assessmentStatus === "error") {
    return <AssessmentErrorScreen error={state.assessmentError} onRetry={reviewAnswers} onReviewAnswers={reviewAnswers} />;
  }

  if (!assessment) {
    return <NoAssessmentScreen onReviewAnswers={reviewAnswers} />;
  }

  return (
    <div className="results-layout">
      <section className={`results-verdict rounded-lg border p-5 sm:p-6 ${toneClasses[viewModel.verdict.tone] ?? toneClasses.neutral}`} aria-live="polite">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-navy sm:text-3xl">
              {viewModel.verdict.title}
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-navy/78">{viewModel.verdict.message}</p>
            {assessment.decisionStatus === DECISION_STATUSES.INSUFFICIENT_DATA ? (
              <p className="mt-3 text-sm font-semibold text-navy">This does not mean you definitely cannot afford a loan.</p>
            ) : null}
          </div>
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface/80 text-navy">
            <VerdictIcon aria-hidden="true" size={28} />
          </span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard icon={ShieldCheck} label="Recommended amount" value={viewModel.recommendedAmount} emphasis={!viewModel.hasNoRecommendedAmount} />
        <MetricCard icon={Gauge} label="Safe EMI" value={viewModel.safeEmi} helper="Maximum comfortable monthly payment from this estimate." />
        <MetricCard icon={Gauge} label="Proposed EMI" value={viewModel.proposedEmi} helper="Calculated using the conservative maximum estimated rate." />
      </div>

      <ComparisonBar assessment={assessment} viewModel={viewModel} />
      <PricingSection viewModel={viewModel} />
      <TenureTradeoff assessment={assessment} viewModel={viewModel} />
      <StressSummary viewModel={viewModel} />
      <RiskList risks={viewModel.risks} />
      <MissingInformationList viewModel={viewModel} />
      <ExplanationPanels explanations={viewModel.explanations} />
      <NegotiationCard viewModel={viewModel} />

      <div className="no-print flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2">
          <Printer aria-hidden="true" size={18} />
          Print negotiation card
        </Button>
        <Button variant="secondary" onClick={restart} className="inline-flex items-center justify-center gap-2">
          <RefreshCcw aria-hidden="true" size={18} />
          Restart
        </Button>
      </div>
    </div>
  );
}



