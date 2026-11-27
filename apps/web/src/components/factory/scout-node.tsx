import type { ScoutStatus } from "@codeden/contracts";
import { useNavigate } from "@tanstack/react-router";
import { InfoHint } from "@/components/common/info-hint";
import { StatusDot } from "@/components/common/status-dot";
import { useTranslation } from "@/lib/i18n";
import { HeldFollowUps } from "./held-follow-ups";
import { AREA_LABEL, reviewAreasHelp, roundHelp, scoutHelp } from "./meta";
import { Badge } from "./node-badge";

/**
 * The dark factory's scout on the pipeline diagram (§10.1): its round, its review areas (one
 * long-lived area reviewer each) and the review follow-ups held for it.
 */
export function ScoutNode({
  projectId,
  scout,
  scheduled = true,
}: {
  projectId: string;
  scout: ScoutStatus;
  /** False when scheduled rounds are off (`minBacklog` 0): it only runs when started. */
  scheduled?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const phase =
    scout.phase === "idle"
      ? !scheduled
        ? t("factory.scoutNode.onDemand")
        : scout.nextRoundAt
          ? t("factory.scoutNode.resting")
          : t("factory.scoutNode.waiting")
      : scout.phase === "planning"
        ? t("factory.scoutNode.planning")
        : scout.phase === "reviewing"
          ? t("factory.scoutNode.reviewing")
          : t("factory.scoutNode.filing");
  const roundHint = <InfoHint label={t("factory.scoutNode.rounds")}>{roundHelp()}</InfoHint>;
  return (
    <div
      className="relative flex min-h-[64px] w-[132px] shrink-0 flex-col items-center gap-1 rounded-lg border border-foreground/30 bg-card px-2 pt-3.5 pb-2 text-center"
      data-testid="pipeline-scout"
    >
      <Badge kind="scout" hint={scoutHelp()} />
      <button
        type="button"
        disabled={!scout.sessionId}
        onClick={() =>
          scout.sessionId &&
          void navigate({ to: "/sessions/$sessionId", params: { sessionId: scout.sessionId } })
        }
        className="text-[12px] leading-tight font-medium hover:text-primary disabled:hover:text-foreground"
        title={scout.sessionId ? t("factory.scoutNode.openSession") : undefined}
      >
        {t("factory.scoutNode.title")}
      </button>
      <span className="text-[10px] leading-tight text-muted-foreground">
        {phase}
        {scout.rounds > 0 ? (
          <span className="flex items-center justify-center gap-1">
            {t("factory.scoutNode.round", { n: scout.rounds })}
            {roundHint}
          </span>
        ) : (
          <span className="ml-1">{roundHint}</span>
        )}
      </span>
      {scout.lenses.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1" data-testid="scout-areas">
          {scout.lenses.map((l) => (
            <button
              key={l.area}
              type="button"
              onClick={() =>
                void navigate({ to: "/sessions/$sessionId", params: { sessionId: l.sessionId } })
              }
              className="flex items-center gap-1 rounded-md border border-border px-1 text-[10px] hover:border-primary/60"
              title={t("factory.scoutNode.areaReview", {
                area: AREA_LABEL[l.area],
                state: l.reported
                  ? t("factory.scoutNode.reported")
                  : t("factory.scoutNode.inReview"),
              })}
              aria-label={t("factory.scoutNode.areaReviewAria", {
                area: AREA_LABEL[l.area],
                state: l.reported
                  ? t("factory.scoutNode.reported")
                  : t("factory.scoutNode.inReview"),
              })}
            >
              <StatusDot
                tone={l.active ? "running" : l.reported ? "done" : "idle"}
                className="size-1.5 [&>span]:size-1.5"
              />
              {AREA_LABEL[l.area]}
            </button>
          ))}
          <InfoHint label={t("factory.scoutNode.areas")}>{reviewAreasHelp()}</InfoHint>
        </div>
      )}
      {scout.phase === "filing" || scout.filed > 0 ? (
        <span className="text-[10px] text-muted-foreground">
          {t("factory.scoutNode.filed", { n: scout.filed })}
        </span>
      ) : null}
      <HeldFollowUps projectId={projectId} held={scout.heldFollowUps} />
    </div>
  );
}
