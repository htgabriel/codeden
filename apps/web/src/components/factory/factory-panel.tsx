import type { Project } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { AlertTriangle, Factory, FileText, Newspaper, Play, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClient } from "@/lib/api";
import { factoryKeys, useFactoryStatus } from "@/lib/factory";
import { ago, compact, usd } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AutonomyDialog, ExperimentalBadge } from "./autonomy-dialog";
import { DrainChip } from "./drain-chip";
import { FactoryRunButtons, OpenFactoryViewButton } from "./factory-actions";
import { ChecksColumn, IgnoredColumn, RecentColumn } from "./factory-columns";
import { FactoryGuideButton } from "./factory-guide";
import { KillSwitchButton } from "./kill-switch";
import { LessonsCard } from "./lessons-card";
import { LOOP_LABEL, MODE_LABEL } from "./meta";
import { PipelineDiagram } from "./pipeline-diagram";
import { PullRequestsCard } from "./pull-requests-card";
import { ScorecardCard } from "./scorecard-card";
import { SPOT_CHECKS_ANCHOR } from "./spot-checks";
import { SpotChecksCard } from "./spot-checks-card";
import { WipChip } from "./wip-chip";

function Meter(props: {
  label: string;
  value: number;
  max: number;
  display: string;
  warn?: boolean;
}) {
  const { label, value, max, display, warn = true } = props;
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const bar = !warn
    ? "bg-status-running"
    : pct > 85
      ? "bg-status-failed"
      : pct > 60
        ? "bg-status-waiting"
        : "bg-primary";
  return (
    <div className="min-w-[9rem] flex-1 rounded-lg border border-border bg-surface px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-3xs tracking-wider text-muted-foreground uppercase">{label}</span>
        <span className="text-[13px] font-medium whitespace-nowrap tabular-nums">{display}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LoopState({ state, stopped }: { state: keyof typeof LOOP_LABEL; stopped: boolean }) {
  const { t } = useTranslation();
  const loop = LOOP_LABEL[stopped ? "stopped" : state];
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-3xs font-medium",
        loop.tone === "failed" && "bg-status-failed/12 text-status-failed",
        loop.tone === "waiting" && "bg-status-waiting/12 text-status-waiting",
        loop.tone === "running" && "bg-status-running/12 text-status-running",
        loop.tone === "idle" && "bg-muted text-muted-foreground",
      )}
      data-testid="factory-loop-state"
    >
      {t("project.factoryPanel.loopState", { state: loop.label.toLowerCase() })}
    </span>
  );
}

/**
 * The software / dark factory panel (§10.1, experimental): the live pipeline diagram, the
 * agent pool and budget, merge checks, recent results and the issues ignored for their author.
 */
export function FactoryPanel({ project }: { project: Project }) {
  const { t } = useTranslation();
  const projectId = project.id;
  const client = useClient();
  const queryClient = useQueryClient();
  const { data: f } = useFactoryStatus(projectId);
  // `#spot-checks`: opened from the inbox's spot-check item.
  const hash = useLocation({ select: (l) => l.hash });
  const [limitsOpen, setLimitsOpen] = useState(false);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: factoryKeys.all });
  const fail = (title: string) => (e: Error) => toast.error(title, { description: e.message });
  const resume = useMutation({
    mutationFn: () => client.factory.resume(projectId),
    onSuccess: () => {
      toast.success(t("project.factoryPanel.resumed"));
      refresh();
    },
    onError: fail(t("project.factoryPanel.resumeFailed")),
  });
  const digest = useMutation({
    mutationFn: () => client.factory.digest(projectId),
    onSuccess: (d) => {
      toast.success(t("project.factoryPanel.digestReady"), {
        description: t("project.factoryPanel.digestCounts", {
          shipped: d.shipped.length,
          rejected: d.rejected.length,
          waiting: d.waiting.length,
        }),
      });
      refresh();
    },
    onError: fail(t("project.factoryPanel.digestFailed")),
  });

  if (!f) return <Skeleton className="h-72 w-full rounded-xl" />;
  const stopped = f.killSwitch || f.globalKillSwitch || f.loopState === "stopped";
  const readyCount = f.inProgress.filter(
    (w) => w.step === "merge" && w.stage === "verifying",
  ).length;
  const budgetUsd = f.limits.dailyBudget.usd;
  const budgetTokens = f.limits.dailyBudget.tokens;

  return (
    <section
      className="overflow-hidden rounded-xl border border-border bg-card"
      data-testid="factory-panel"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Factory className="size-4" />
        </span>
        <div>
          <div className="flex items-center gap-2 text-[14px] font-medium">
            {MODE_LABEL[f.mode]}
            {f.experimental && <ExperimentalBadge />}
          </div>
          <div className="text-2xs text-muted-foreground">
            {f.mode === "dark_factory"
              ? t("project.factoryPanel.feedDark")
              : t("project.factoryPanel.feedTrusted")}
            {f.limits.autoMerge
              ? t("project.factoryPanel.autoMerges")
              : t("project.factoryPanel.youMerge")}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <OpenFactoryViewButton projectId={projectId} variant="outline" />
          {f.loopState === "paused" && !f.drain && (
            <Button size="sm" onClick={() => resume.mutate()} disabled={resume.isPending}>
              <Play /> {t("project.factoryPanel.resume")}
            </Button>
          )}
          <FactoryRunButtons f={f} stopped={stopped} />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => digest.mutate()}
            disabled={digest.isPending}
          >
            <Newspaper /> {t("project.factoryPanel.digest")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setLimitsOpen(true)}>
            <SlidersHorizontal /> {t("common.settings")}
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/projects/$projectId/vision" params={{ projectId }}>
              <FileText /> {t("project.page.vision")}
            </Link>
          </Button>
          <FactoryGuideButton />
          <KillSwitchButton
            scope={{ projectId }}
            on={f.killSwitch}
            drain={f.drain}
            paused={f.loopState === "paused"}
          />
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        {(f.globalKillSwitch || f.pausedReason || !f.visionExists) && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-status-waiting/30 bg-status-waiting/[0.06] px-3 py-2 text-2xs">
            <AlertTriangle className="size-3.5 text-status-waiting" />
            <span className="min-w-0 flex-1">
              {f.globalKillSwitch
                ? t("project.factoryPanel.globalKillSwitch")
                : !f.visionExists
                  ? t("project.factoryPanel.visionMissing")
                  : t("project.factoryPanel.paused", { reason: f.pausedReason ?? "" })}
            </span>
            {f.globalKillSwitch && <KillSwitchButton scope="global" on size="xs" />}
          </div>
        )}
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-2xs font-medium text-muted-foreground">
              {t("project.factoryPanel.pipelines")}
            </span>
            <span className="text-3xs text-muted-foreground/80">
              {t("project.factoryPanel.pipelinesHint")}
            </span>
            <span className="ml-auto flex min-w-0 items-center gap-1.5">
              <WipChip f={f} />
              {f.drain && !stopped ? (
                <DrainChip f={f} />
              ) : (
                <LoopState state={f.loopState} stopped={stopped} />
              )}
            </span>
          </div>
          <PipelineDiagram f={f} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Meter
            label={t("project.factoryPanel.meters.spendToday")}
            value={budgetUsd ? f.spendToday.usd : f.spendToday.tokens}
            max={budgetUsd ?? budgetTokens ?? 0}
            display={
              budgetUsd
                ? `${usd(f.spendToday.usd)} / ${usd(budgetUsd)}`
                : `${compact(f.spendToday.tokens)} / ${compact(budgetTokens ?? 0)}`
            }
          />
          <Meter
            label={t("project.factoryPanel.meters.agentsWorking")}
            value={f.activeSessions}
            max={f.limits.maxConcurrentSessions}
            display={`${f.activeSessions} / ${f.limits.maxConcurrentSessions}`}
            warn={false}
          />
          <Meter
            label={t("project.factoryPanel.meters.prsInProgress")}
            value={f.wip.openPrs}
            max={f.wip.limit}
            display={`${f.wip.openPrs} / ${f.wip.limit}`}
            warn={false}
          />
          {f.limits.autoMerge ? (
            <Meter
              label={t("project.factoryPanel.meters.mergesToday")}
              value={f.mergesToday}
              max={f.limits.maxMergesPerDay}
              display={`${f.mergesToday} / ${f.limits.maxMergesPerDay}`}
              warn={false}
            />
          ) : (
            <Meter
              label={t("project.factoryPanel.meters.readyForYou")}
              value={readyCount}
              max={Math.max(readyCount, 1)}
              display={t("project.factoryPanel.meters.readyPrs", { count: readyCount })}
              warn={false}
            />
          )}
          <Meter
            label={t("project.factoryPanel.meters.failuresInARow")}
            value={f.consecutiveFailures}
            max={f.limits.pauseAfterConsecutiveFailures}
            display={`${f.consecutiveFailures} / ${f.limits.pauseAfterConsecutiveFailures}`}
          />
        </div>
        <PullRequestsCard projectId={projectId} pullRequests={f.pullRequests} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-3">
          <ChecksColumn projectId={projectId} checks={f.mergeChecks} />
          <RecentColumn projectId={projectId} recent={f.recent} />
          <IgnoredColumn projectId={projectId} ignored={f.ignored} />
        </div>
        <SpotChecksCard
          projectId={projectId}
          spotChecks={f.spotChecks}
          focus={hash === SPOT_CHECKS_ANCHOR}
        />
        <LessonsCard
          projectId={projectId}
          lessons={f.lessons}
          learning={f.tuning.learnFromReviews}
        />
        <ScorecardCard projectId={projectId} />
        {f.lastDigest && (
          <details className="rounded-lg border border-border bg-surface px-3 py-2 text-2xs">
            <summary className="cursor-pointer text-muted-foreground">
              {t("project.factoryPanel.lastDigest", {
                day: f.lastDigest.day,
                shipped: f.lastDigest.shipped.length,
                rejected: f.lastDigest.rejected.length,
                waiting: f.lastDigest.waiting.length,
              })}
            </summary>
            <pre className="mt-2 font-sans text-2xs leading-relaxed whitespace-pre-wrap text-foreground/85">
              {f.lastDigest.text}
            </pre>
          </details>
        )}
        <p className="text-3xs text-muted-foreground/80">
          {t("project.factoryPanel.footer.tokensToday", { tokens: compact(f.spendToday.tokens) })} ·{" "}
          {t("project.factoryPanel.footer.trusted")}{" "}
          {[f.githubLogin, ...f.limits.trustedAuthors]
            .filter(Boolean)
            .map((l) => `@${l}`)
            .join(", ") || t("project.factoryPanel.footer.githubAccount")}{" "}
          ·{" "}
          {f.limits.autoMerge
            ? t("project.factoryPanel.footer.autoMergeOn")
            : t("project.factoryPanel.footer.autoMergeOff")}{" "}
          · {t("project.factoryPanel.footer.protected")}{" "}
          {f.limits.protectedPaths.join(", ") || t("project.factoryPanel.footer.fromVision")} ·{" "}
          {f.limits.allowDeploys
            ? t("project.factoryPanel.footer.deploysAllowed")
            : t("project.factoryPanel.footer.deploysOff")}{" "}
          ·{" "}
          {f.tuning.requireCi
            ? t("project.factoryPanel.footer.ciRequired")
            : t("project.factoryPanel.footer.ciOptional")}{" "}
          ·{" "}
          {f.tuning.maxChangedLines !== null
            ? t("project.factoryPanel.footer.maxChangedLines", {
                n: f.tuning.maxChangedLines.toLocaleString(),
              })
            : t("project.factoryPanel.footer.noSizeLimit")}
          {/* As of the panel's last refresh: on factory events, every 30 s while work is in
              flight, every 5 min while idle (`useFactoryStatus`). */}
          {f.lastTickAt &&
            ` · ${t("project.factoryPanel.footer.lastCheck", { ago: ago(f.lastTickAt) })}`}
        </p>
      </div>
      <AutonomyDialog project={project} open={limitsOpen} onOpenChange={setLimitsOpen} />
    </section>
  );
}
