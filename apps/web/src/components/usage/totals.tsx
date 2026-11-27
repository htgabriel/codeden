import type { UsageReport } from "@codeden/contracts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isApiEquivalent, money, percent, tokens, totalTokens, trend } from "./format";

function Tile({
  label,
  value,
  sub,
  delta,
  testId,
}: {
  label: ReactNode;
  value: string;
  sub: ReactNode;
  delta?: { text: string; up: boolean } | null;
  testId?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span data-testid={testId} className="truncate text-2xl font-semibold tabular-nums">
          {value}
        </span>
        {delta && (
          <span
            title={t("shell.totals.compared")}
            className="inline-flex items-center text-2xs text-muted-foreground tabular-nums"
          >
            {delta.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {delta.text}
          </span>
        )}
      </div>
      <div className="mt-0.5 truncate text-2xs text-muted-foreground tabular-nums">{sub}</div>
    </div>
  );
}

/** Headline numbers for the range: spend, tokens, cache hit rate and averages. */
export function UsageTotals({ report }: { report: UsageReport }) {
  const { t: tr } = useTranslation();
  const t = report.totals;
  const p = report.previousTotals;
  const estimated = t.estimatedCostUsd > 0;
  const apiEquivalent = isApiEquivalent(report.billing);
  const perDay = t.costUsd / Math.max(1, report.days.length);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <Tile
        testId="usage-total"
        label={
          <>
            {apiEquivalent ? tr("shell.usageFormat.apiEquivalent") : tr("shell.totals.spend")}
            {apiEquivalent && (
              <span
                className="rounded border border-border px-1 text-3xs"
                title={tr("shell.totals.subscriptionTip")}
              >
                {tr("shell.totals.subscription")}
              </span>
            )}
          </>
        }
        value={money(t.costUsd, estimated)}
        delta={trend(t.costUsd, p.costUsd)}
        sub={
          estimated
            ? tr("shell.totals.perDayEstimated", {
                perDay: money(perDay),
                estimated: money(t.estimatedCostUsd),
              })
            : tr("shell.totals.perDayAverage", { perDay: money(perDay) })
        }
      />
      <Tile
        testId="usage-tokens"
        label={tr("shell.breakdown.tokens")}
        value={tokens(totalTokens(t))}
        delta={trend(totalTokens(t), totalTokens(p))}
        sub={tr("shell.totals.tokensSub", {
          input: tokens(t.inputTokens),
          output: tokens(t.outputTokens),
          cached: tokens(t.cacheReadTokens),
        })}
      />
      <Tile
        label={tr("shell.totals.cacheHitRate")}
        value={percent(t.cacheHitRate)}
        sub={tr("shell.totals.written", { n: tokens(t.cacheWriteTokens) })}
      />
      <Tile
        label={tr("shell.totals.perSession")}
        value={
          report.averages.perSessionUsd === null
            ? "—"
            : money(report.averages.perSessionUsd, estimated)
        }
        sub={tr("shell.totals.sessionsTurns", {
          sessions: t.sessions.toLocaleString("en-US"),
          turns: t.turns.toLocaleString("en-US"),
        })}
      />
      <Tile
        label={tr("shell.totals.perMergedPr")}
        value={
          report.averages.perMergedPrUsd === null ? "—" : money(report.averages.perMergedPrUsd)
        }
        sub={
          report.averages.mergedPrs > 0
            ? tr("shell.totals.mergedPrs", { count: report.averages.mergedPrs })
            : tr("shell.totals.noMergedPrs")
        }
      />
    </div>
  );
}

/** A short note under the totals when some turns could not be priced. */
export function UnpricedNote({ report, className }: { report: UsageReport; className?: string }) {
  const { t } = useTranslation();
  if (report.totals.unpricedTurns === 0) return null;
  return (
    <p className={cn("text-2xs text-muted-foreground", className)}>
      {t("shell.totals.unpriced", { count: report.totals.unpricedTurns })}
    </p>
  );
}
