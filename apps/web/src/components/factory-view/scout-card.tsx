import type { ScoutStatus } from "@codeden/contracts";
import { Link } from "@tanstack/react-router";
import { Check, Radar } from "lucide-react";
import { HeldFollowUps } from "@/components/factory/held-follow-ups";
import { AREA_LABEL } from "@/components/factory/meta";
import { until } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The dark factory's scout on the Intake stage: its round, its area reviewers, its findings and
 * the review follow-ups held for it.
 */
export function ScoutCard({ scout, projectId }: { scout: ScoutStatus; projectId: string }) {
  const { t } = useTranslation();
  const active = scout.phase !== "idle";
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed px-2.5 py-2 text-2xs",
        active ? "border-primary/40 bg-primary/[0.04]" : "border-border",
      )}
      data-testid="factory-view-scout"
    >
      <div className="flex items-center gap-1.5">
        <Radar className={cn("size-3.5", active ? "text-primary" : "text-muted-foreground")} />
        {scout.sessionId ? (
          <Link
            to="/sessions/$sessionId"
            params={{ sessionId: scout.sessionId }}
            className="text-[12px] font-medium hover:underline"
          >
            {t("factoryView.scout.name")}
          </Link>
        ) : (
          <span className="text-[12px] font-medium">{t("factoryView.scout.name")}</span>
        )}
        <span className="text-muted-foreground">
          {active
            ? t("factoryView.scout.round", { round: scout.rounds })
            : t("factoryView.scout.rounds", { count: scout.rounds })}
        </span>
      </div>
      <div className="mt-0.5 text-muted-foreground">
        {t(`factoryView.scout.phase.${scout.phase}`)}
        {active &&
          ` · ${t("factoryView.scout.found", { found: scout.findings, filed: scout.filed })}`}
        {!active &&
          scout.nextRoundAt &&
          ` · ${t("factoryView.scout.next", { when: until(scout.nextRoundAt) })}`}
      </div>
      {scout.lenses.length > 0 && (
        <ul
          className="mt-1.5 flex flex-wrap gap-1"
          aria-label={t("factoryView.scout.areaReviewers")}
        >
          {scout.lenses.map((l) => (
            <li key={l.area}>
              <Link
                to="/sessions/$sessionId"
                params={{ sessionId: l.sessionId }}
                className="flex items-center gap-1 rounded-full border border-border bg-surface px-1.5 text-[10px] leading-4 hover:border-primary/50"
                title={
                  l.reported
                    ? t("factoryView.scout.reported")
                    : l.active
                      ? t("factoryView.scout.reviewingNow")
                      : t("factoryView.scout.waitingToStart")
                }
              >
                {l.reported ? (
                  <Check className="size-2.5 text-status-done" />
                ) : (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      l.active ? "bg-status-running motion-safe:animate-pulse" : "bg-status-idle",
                    )}
                  />
                )}
                {AREA_LABEL[l.area]}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <HeldFollowUps projectId={projectId} held={scout.heldFollowUps} className="mt-1 block" />
    </div>
  );
}
