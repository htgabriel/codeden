import type { AutomationRun, AutomationRunStatus } from "@codeden/contracts";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, History, X } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/common/bits";
import { StatusDot } from "@/components/common/status-dot";
import { Button } from "@/components/ui/button";
import { useAutomationRuns, useAutomations } from "@/lib/automations";
import { ago, duration } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { RUN_STATUS, SKIP_REASON, TRIGGERED_BY } from "./meta";
import { useAutomationActions } from "./use-automation-actions";

const FILTERS: (AutomationRunStatus | "all")[] = ["all", "running", "queued", "skipped", "failed"];

function RunRow({
  run,
  name,
  projectId,
  onCancel,
  showAutomation,
}: {
  run: AutomationRun;
  name: string;
  projectId: string;
  onCancel: () => void;
  showAutomation: boolean;
}) {
  const { t } = useTranslation();
  const status = RUN_STATUS[run.status];
  const took =
    run.finishedAt && run.status !== "skipped"
      ? duration(Date.parse(run.finishedAt) - Date.parse(run.startedAt))
      : null;
  return (
    <div
      className={cn(
        "grid items-center gap-3 border-b border-border px-3.5 py-2 text-[13px] last:border-0",
        showAutomation
          ? "grid-cols-[100px_minmax(0,1fr)_90px_80px_92px]"
          : "grid-cols-[80px_minmax(0,1fr)_auto] [&>[data-wide]]:hidden",
      )}
      data-testid="run-row"
      data-status={run.status}
    >
      <span className="flex items-center gap-2 text-2xs">
        <StatusDot tone={status.tone} />
        {status.label}
      </span>
      <span className="min-w-0">
        {showAutomation && (
          <Link
            to="/projects/$projectId/automations/$automationId"
            params={{ projectId, automationId: run.automationId }}
            className="block truncate font-medium hover:underline"
          >
            {name}
          </Link>
        )}
        <span className="block truncate text-2xs text-muted-foreground">
          {run.skipReason ? (
            <span className="text-status-waiting">{SKIP_REASON[run.skipReason]}</span>
          ) : run.error ? (
            <span className="text-status-failed">{run.error.message}</span>
          ) : (
            (run.progress?.text ?? (run.purpose === name ? run.workKey : run.purpose))
          )}
        </span>
        {!showAutomation && (
          <span className="block text-3xs text-muted-foreground/80">
            {TRIGGERED_BY[run.triggeredBy]} · {ago(run.startedAt)}
            {took && ` · ${took}`}
          </span>
        )}
      </span>
      <span data-wide className="text-2xs text-muted-foreground">
        {TRIGGERED_BY[run.triggeredBy]}
      </span>
      <span data-wide className="text-2xs text-muted-foreground tabular-nums" title={run.startedAt}>
        {ago(run.startedAt)}
        {took && <span className="block text-3xs">{took}</span>}
      </span>
      <span className="flex justify-end">
        {run.status === "queued" ? (
          <Button size="xs" variant="ghost" className="text-muted-foreground" onClick={onCancel}>
            <X /> {t("common.cancel")}
          </Button>
        ) : run.sessionId ? (
          <Link
            to="/sessions/$sessionId"
            params={{ sessionId: run.sessionId }}
            className="flex items-center gap-0.5 text-2xs text-primary hover:underline"
            data-testid="run-session-link"
          >
            {t("automations.runs.session")} <ArrowUpRight className="size-3" />
          </Link>
        ) : null}
      </span>
    </div>
  );
}

/** Runs history (§10): status, trigger, skip reasons, the linked session, cancel queued. */
export function RunsTable({
  projectId,
  automationId,
  limit = 100,
}: {
  projectId: string;
  automationId?: string;
  limit?: number;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<AutomationRunStatus | "all">("all");
  const runs = useAutomationRuns({
    projectId,
    automationId,
    limit,
    ...(filter === "all" ? {} : { status: filter }),
  });
  const { data } = useAutomations(projectId);
  const actions = useAutomationActions(projectId);
  const nameOf = (id: string) =>
    data?.automations.find((i) => i.automation.id === id)?.automation.name ?? id;
  const list = runs.data ?? [];

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex w-fit items-center gap-1 rounded-lg border border-border bg-card/50 p-0.5 text-xs",
          automationId && "hidden",
        )}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "h-6 rounded-md px-2.5 text-muted-foreground transition-colors hover:text-foreground",
              filter === f && "bg-accent text-foreground",
            )}
          >
            {f === "all" ? t("automations.runs.all") : RUN_STATUS[f].label}
          </button>
        ))}
      </div>
      {list.length === 0 && !runs.isLoading ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState icon={<History />} title={t("automations.runs.emptyTitle")}>
            {t("automations.runs.emptyBody")}
          </EmptyState>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card" data-testid="runs">
          {list.map((run) => (
            <RunRow
              key={run.id}
              run={run}
              name={nameOf(run.automationId)}
              projectId={projectId}
              showAutomation={!automationId}
              onCancel={() => actions.cancelRun.mutate(run.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
