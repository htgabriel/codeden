import type { RateLimitsResponse, RateLimitWindow } from "@codeden/contracts";
import { AlertTriangle, Gauge, OctagonX } from "lucide-react";
import { ProviderMark } from "@/components/common/bits";
import { ago, until } from "@/lib/format";
import { i18n, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PROVIDER_NAMES } from "./format";

type Tone = "ok" | "warning" | "limited" | "stale";

function toneOf(w: RateLimitWindow, warnPercent: number): Tone {
  if (w.stale) return "stale";
  if (w.status === "limited" || (w.usedPercent ?? 0) >= 100) return "limited";
  if (w.status === "warning" || (w.usedPercent ?? 0) >= warnPercent) return "warning";
  return "ok";
}

const BAR: Record<Tone, string> = {
  ok: "bg-status-running",
  warning: "bg-status-waiting",
  limited: "bg-status-failed",
  stale: "bg-muted-foreground/40",
};

/** "64%", "<1%" for a light window, "—" when not reported. */
export function usedText(p: number | null): string {
  if (p === null) return "—";
  if (p > 0 && p < 1) return "<1%";
  return `${Math.round(p)}%`;
}

function headline(w: RateLimitWindow, tone: Tone): string {
  const t = i18n.t;
  if (tone === "stale") return t("shell.limits.resetSince");
  // What the provider said about a window whose percentage is not known.
  if (w.usedPercent === null) return t(`shell.limits.status.${w.status}`);
  return tone === "limited"
    ? t("shell.limits.status.limited")
    : t("shell.limits.used", { percent: usedText(w.usedPercent) });
}

function WindowMeter({ w, warnPercent }: { w: RateLimitWindow; warnPercent: number }) {
  const { t } = useTranslation();
  const tone = toneOf(w, warnPercent);
  const used = w.usedPercent;
  // "as of" dates the figure shown: the percentage's own reading when there is one.
  const asOf = (used !== null ? w.usedPercentAt : null) ?? w.observedAt;
  return (
    <div className="space-y-1.5" data-testid="limit-window" data-tone={tone}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{w.label}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 tabular-nums",
            tone === "stale" ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {tone === "warning" && <AlertTriangle className="size-3 text-status-waiting" />}
          {tone === "limited" && <OctagonX className="size-3 text-status-failed" />}
          {headline(w, tone)}
        </span>
      </div>
      {/* No bar until a percentage is known: an empty bar would read as "nothing used". */}
      {used !== null && (
        // biome-ignore lint/a11y/useSemanticElements: a native <meter> cannot be themed consistently across browsers.
        <div
          role="meter"
          aria-label={t("shell.limits.meterLabel", { label: w.label })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(used)}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn("h-full rounded-full transition-[width]", BAR[tone])}
            style={{ width: `${tone === "stale" ? 0 : Math.max(used, used > 0 ? 2 : 0)}%` }}
          />
        </div>
      )}
      <div className="flex justify-between gap-2 text-2xs text-muted-foreground">
        <span>
          {w.resetsAt
            ? tone === "stale"
              ? t("shell.limits.reset", { when: ago(w.resetsAt) })
              : t("shell.limits.resets", { when: until(w.resetsAt) })
            : t("shell.limits.noReset")}
        </span>
        <span title={new Date(asOf).toLocaleString()}>
          {t("shell.limits.asOf", { when: ago(asOf) })}
        </span>
      </div>
    </div>
  );
}

/** Subscription windows per provider, as each provider last reported them. */
export function RateLimitMeters({ data }: { data: RateLimitsResponse | undefined }) {
  const { t } = useTranslation();
  const windows = data?.windows ?? [];
  const providers = [...new Set(windows.map((w) => w.provider))];
  if (!data || providers.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
        <Gauge className="mt-0.5 size-4 shrink-0" />
        <p>{t("shell.limits.none")}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
      {providers.map((provider) => {
        const billing = data.billing[provider];
        return (
          <div key={provider} className="space-y-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <ProviderMark provider={provider} className="size-5 text-[10px]" />
              <span className="text-sm font-medium">{PROVIDER_NAMES[provider] ?? provider}</span>
              <span className="ml-auto text-2xs text-muted-foreground">
                {billing === "subscription"
                  ? t("shell.limits.subscription")
                  : billing === "api"
                    ? t("shell.limits.apiKey")
                    : t("shell.limits.unknownLogin")}
              </span>
            </div>
            {windows
              .filter((w) => w.provider === provider)
              .map((w) => (
                <WindowMeter key={w.windowId} w={w} warnPercent={data.warnPercent} />
              ))}
          </div>
        );
      })}
    </div>
  );
}
