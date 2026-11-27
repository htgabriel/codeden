import type { AutomationListItem } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Eraser,
  FileCode2,
  Pause,
  Play,
  RefreshCw,
  SkipForward,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useClient } from "@/lib/api";
import { automationKeys, stateIn, switchValue } from "@/lib/automations";
import { formatAt } from "@/lib/cron";
import { until } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { useSnapshotData } from "@/lib/queries";
import { SOURCE_LABEL } from "./meta";
import type { useAutomationActions } from "./use-automation-actions";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  );
}

/**
 * The automation's switch and schedule in this project: why it is off, the next run with
 * skip-next, pause / resume, run now, and where its definition lives (§10, §8.4).
 */
export function ScheduleCard({
  item,
  projectId,
  actions,
}: {
  item: AutomationListItem;
  projectId: string;
  actions: ReturnType<typeof useAutomationActions>;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const globalOn = useSnapshotData((s) => s.settings.automations.enabled, false);
  const a = item.automation;
  const state = stateIn(item, projectId);
  const on = switchValue(item, projectId);
  const scheduled = a.trigger.type === "cron";
  const why = !on
    ? t("automations.scheduleCard.switchedOff")
    : !globalOn
      ? t("automations.scheduleCard.globalOff")
      : state && !state.enabled
        ? t("automations.scheduleCard.projectOff")
        : state?.paused
          ? t("automations.scheduleCard.pausedHere")
          : t("automations.scheduleCard.on");
  const reload = useMutation({
    mutationFn: () => client.automations.reload(),
    onSuccess: () => {
      toast.success(t("automations.scheduleCard.reloaded"));
      void queryClient.invalidateQueries({ queryKey: automationKeys.all });
    },
  });
  const remove = useMutation({
    mutationFn: () => client.automations.remove(a.id),
    onSuccess: () => {
      toast.success(t("automations.detail.deleted", { name: a.name }));
      void navigate({ to: "/projects/$projectId/automations", params: { projectId } });
    },
    onError: (e) => toast.error(t("automations.detail.deleteFailed"), { description: e.message }),
  });

  return (
    <div
      className="space-y-3 rounded-xl border border-border bg-card p-4"
      data-testid="schedule-card"
    >
      <div className="flex items-center gap-2.5">
        <Switch
          checked={on}
          onCheckedChange={(enabled) => actions.toggle.mutate({ item, enabled })}
          aria-label={t("automations.row.enableAria", { name: a.name })}
        />
        <span className="text-[13px] font-medium">
          {on ? t("automations.scheduleCard.enabled") : t("automations.scheduleCard.disabled")}
        </span>
        <span className="ml-auto text-3xs text-muted-foreground">{why}</span>
      </div>
      <div className="space-y-1.5 border-t border-border pt-3">
        {scheduled && (
          <Row label={t("automations.scheduleCard.nextRun")}>
            {state?.nextRunAt ? (
              <span title={formatAt(state.nextRunAt)}>
                {until(state.nextRunAt)}
                {state.skipNextAt === state.nextRunAt && (
                  <span className="text-status-waiting">
                    {t("automations.scheduleCard.willSkip")}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {t("automations.scheduleCard.notScheduled")}
              </span>
            )}
          </Row>
        )}
        <Row label={t("automations.scheduleCard.source")}>
          {SOURCE_LABEL[a.source]}
          {a.templateId && <span className="text-muted-foreground"> · {a.templateId}</span>}
        </Row>
        <Row label={t("automations.form.workKey")}>
          <code className="font-mono text-2xs">{a.workKey ?? `automation:${a.templateId}`}</code>
        </Row>
        <Row label={t("automations.scheduleCard.appliesTo")}>
          {a.target.type === "project"
            ? t("automations.form.thisProject")
            : t("automations.form.allProjects")}
        </Row>
      </div>
      {item.path && (
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-2xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileCode2 className="size-3.5" /> {t("automations.scheduleCard.definedInFile")}
          </div>
          <code className="mt-1 block font-mono break-all">{item.path}</code>
          <Button
            size="xs"
            variant="outline"
            className="mt-2"
            onClick={() => reload.mutate()}
            disabled={reload.isPending}
          >
            <RefreshCw /> {t("automations.scheduleCard.reload")}
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
        <Button
          size="sm"
          onClick={() => actions.run.mutate({ id: a.id, name: a.name })}
          disabled={actions.run.isPending || a.action.type === "triage"}
        >
          <Play /> {t("automations.row.runNow")}
        </Button>
        {scheduled &&
          state?.enabled &&
          (state.nextRunAt && state.skipNextAt === state.nextRunAt ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => actions.unskipNext.mutate(a.id)}
              disabled={actions.unskipNext.isPending}
            >
              <Undo2 /> {t("automations.scheduleCard.undoSkip")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => actions.skipNext.mutate(a.id)}
              disabled={!state.nextRunAt || actions.skipNext.isPending}
            >
              <SkipForward /> {t("automations.scheduleCard.skipNext")}
            </Button>
          ))}
        {a.target.type === "all_projects" && state?.enabledOverride != null && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => actions.clearOverride.mutate(a.id)}
            disabled={actions.clearOverride.isPending}
            title={t("automations.scheduleCard.clearOverrideTitle")}
          >
            <Eraser /> {t("automations.scheduleCard.clearOverride")}
          </Button>
        )}
        {state?.enabled && a.trigger.type !== "manual" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => actions.pause.mutate({ id: a.id, paused: !state.paused })}
          >
            {state.paused ? <Play /> : <Pause />}{" "}
            {state.paused
              ? t("automations.scheduleCard.resume")
              : t("automations.scheduleCard.pause")}
          </Button>
        )}
        {a.source === "database" && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-muted-foreground hover:text-status-failed"
            aria-label={t("automations.scheduleCard.deleteAria")}
            onClick={() => {
              if (window.confirm(t("automations.scheduleCard.confirmDelete", { name: a.name })))
                remove.mutate();
            }}
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </div>
  );
}
