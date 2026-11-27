import type { FactoryStatus } from "@codeden/contracts";
import { compact, usd } from "@/lib/format";
import { i18n } from "@/lib/i18n";

/**
 * The Factory view's stats strip: six figures, each with an optional small bar. Where the
 * factory panel shows the same figure (spend, merges, agents), it is the same number.
 */
export interface StatTile {
  id: "spend" | "merges" | "agents" | "prs" | "failures" | "median";
  label: string;
  value: string;
  /** A second line in smaller print. */
  detail?: string;
  /** A third line under the figure, for a breakdown over a longer window. */
  note?: string;
  /** A small bar: `value` of `max`; `warn` colours it as it fills up. */
  bar?: { value: number; max: number; warn: boolean };
  /** Draws the value in the failed colour. */
  alert?: boolean;
}

/** "45m", "5h 20m", "2.5d". */
export function shortDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  if (minutes < 48 * 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${(minutes / 1440).toFixed(1)}d`;
}

/** Pull requests the factory still holds: not merged and not replaced by a newer one. */
export function openPrs(f: FactoryStatus) {
  return f.pullRequests.filter((p) => p.state !== "merged" && p.state !== "superseded");
}

/**
 * How the merge queue merged over 7 days ("3 fast · 1 re-tested, 7 days"), so the user sees
 * whether fast merges pay off; undefined before any went either way.
 */
export function mergePathNote(stats: FactoryStatus["stats"]): string | undefined {
  if (stats.fastMerges7d + stats.retestedMerges7d === 0) return undefined;
  return i18n.t("factoryView.stats.mergePaths", {
    fast: stats.fastMerges7d,
    retested: stats.retestedMerges7d,
  });
}

export function viewStats(f: FactoryStatus): StatTile[] {
  const budgetUsd = f.limits.dailyBudget.usd;
  const budgetTokens = f.limits.dailyBudget.tokens;
  const open = openPrs(f);
  const queued = open.filter((p) => p.queuePosition !== null).length;
  const forYou = open.filter((p) => p.state === "waiting_for_you" || p.state === "stuck").length;
  const { stats } = f;
  const paths = mergePathNote(stats);
  const t = i18n.t;
  return [
    {
      id: "spend",
      label: t("factoryView.stats.spend"),
      value: budgetUsd ? usd(f.spendToday.usd) : compact(f.spendToday.tokens),
      detail: budgetUsd
        ? t("factoryView.stats.ofBudget", { budget: usd(budgetUsd) })
        : budgetTokens
          ? t("factoryView.stats.ofTokens", { tokens: compact(budgetTokens) })
          : t("factoryView.stats.noBudget"),
      bar: {
        value: budgetUsd ? f.spendToday.usd : f.spendToday.tokens,
        max: budgetUsd ?? budgetTokens ?? 0,
        warn: true,
      },
    },
    f.limits.autoMerge
      ? {
          id: "merges",
          label: t("factoryView.stats.merges"),
          value: String(f.mergesToday),
          detail: t("factoryView.stats.ofPerDay", { n: f.limits.maxMergesPerDay }),
          bar: { value: f.mergesToday, max: f.limits.maxMergesPerDay, warn: false },
          ...(paths ? { note: paths } : {}),
        }
      : {
          id: "merges",
          label: t("factoryView.stats.merges"),
          value: String(stats.mergedToday),
          detail: t("factoryView.stats.autoMergeOff"),
          ...(paths ? { note: paths } : {}),
        },
    {
      id: "agents",
      label: t("factoryView.stats.agents"),
      value: String(f.activeSessions),
      detail: t("factoryView.stats.of", { n: f.limits.maxConcurrentSessions }),
      bar: { value: f.activeSessions, max: f.limits.maxConcurrentSessions, warn: false },
    },
    {
      id: "prs",
      label: t("factoryView.stats.prs"),
      value: String(open.length),
      detail:
        forYou > 0
          ? t("factoryView.stats.forYou", { n: forYou })
          : queued > 0
            ? t("factoryView.stats.queued", { n: queued })
            : undefined,
    },
    {
      id: "failures",
      label: t("factoryView.stats.failures"),
      value: `${stats.failedToday} · ${stats.revertedToday}`,
      detail: t("factoryView.stats.inARow", { n: f.consecutiveFailures }),
      alert: stats.failedToday + stats.revertedToday > 0,
      ...(stats.fastReverts7d > 0
        ? { note: t("factoryView.stats.fastReverts", { count: stats.fastReverts7d }) }
        : {}),
    },
    {
      id: "median",
      label: t("factoryView.stats.median"),
      value: stats.medianMergeMs7d === null ? "—" : shortDuration(stats.medianMergeMs7d),
      detail:
        stats.merged7d > 0
          ? t("factoryView.stats.medianOf", { count: stats.merged7d })
          : t("factoryView.stats.noMerges"),
    },
  ];
}
