import type {
  AutomationListItem,
  ConflictDecision,
  RunAutomationResponse,
  WorkSummary,
} from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useClient } from "@/lib/api";
import { automationKeys, toastRunResult } from "@/lib/automations";
import { useTranslation } from "@/lib/i18n";

const fail = (title: string) => (e: Error) => toast.error(title, { description: e.message });

/** A run-now that matched running work (§8.4), waiting for wait / skip / join / force. */
export interface RunConflict {
  automationId: string;
  name: string;
  workKey: string;
  existing: WorkSummary[];
}

/**
 * Switches and schedule controls of one automation in a project (§10, §8.4): enable, pause,
 * resume, skip the next run, run now (with the conflict result) and cancel a queued run.
 * Views refetch through `automation.*` events; mutations also invalidate right away.
 */
export function useAutomationActions(projectId: string) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [conflict, setConflict] = useState<RunConflict | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: automationKeys.all });

  const toggle = useMutation({
    mutationFn: (v: { item: AutomationListItem; enabled: boolean }) =>
      client.automations.setEnabled(
        v.item.automation.id,
        v.enabled,
        v.item.automation.target.type === "all_projects" ? projectId : undefined,
      ),
    onSuccess: (_d, v) => {
      toast.success(
        v.enabled
          ? t("automations.actions.toggledOn", { name: v.item.automation.name })
          : t("automations.actions.toggledOff", { name: v.item.automation.name }),
      );
      refresh();
    },
    onError: fail(t("automations.actions.changeFailed")),
  });

  const pause = useMutation({
    mutationFn: (v: { id: string; paused: boolean }) =>
      v.paused
        ? client.automations.pause(v.id, projectId)
        : client.automations.resume(v.id, projectId),
    onSuccess: (_d, v) => {
      toast.success(
        v.paused ? t("automations.scheduleCard.pausedHere") : t("automations.actions.resumed"),
      );
      refresh();
    },
    onError: fail(t("automations.actions.scheduleFailed")),
  });

  const skipNext = useMutation({
    mutationFn: (id: string) => client.automations.skipNext(id, projectId),
    onSuccess: (skipped) => {
      toast.success(
        skipped ? t("automations.actions.skipped") : t("automations.actions.nothingToSkip"),
      );
      refresh();
    },
    onError: fail(t("automations.actions.skipFailed")),
  });

  const onRun = (res: RunAutomationResponse, item: { id: string; name: string }) => {
    if (res.status === "conflict") {
      setConflict({
        automationId: item.id,
        name: item.name,
        workKey: res.existing[0]?.workKey ?? "automation:run",
        existing: res.existing,
      });
      return;
    }
    setConflict(null);
    refresh();
    toastRunResult(
      res,
      (sessionId) => void navigate({ to: "/sessions/$sessionId", params: { sessionId } }),
    );
  };

  const run = useMutation({
    mutationFn: (v: { id: string; name: string; conflict?: ConflictDecision }) =>
      client.automations.run(v.id, { projectId, conflict: v.conflict }),
    onSuccess: (res, v) => onRun(res, v),
    onError: fail(t("automations.actions.runFailed")),
  });

  const cancelRun = useMutation({
    mutationFn: (runId: string) => client.automations.cancelRun(runId),
    onSuccess: () => {
      toast.success(t("automations.actions.cancelled"));
      refresh();
    },
    onError: fail(t("automations.actions.cancelFailed")),
  });

  const unskipNext = useMutation({
    mutationFn: (id: string) => client.automations.unskipNext(id, projectId),
    onSuccess: (next) => {
      toast.success(
        next ? t("automations.actions.willHappen") : t("automations.actions.nothingSkipped"),
      );
      refresh();
    },
    onError: fail(t("automations.actions.undoFailed")),
  });

  const clearOverride = useMutation({
    mutationFn: (id: string) => client.automations.clearOverride(id, projectId),
    onSuccess: () => {
      toast.success(t("automations.actions.follows"));
      refresh();
    },
    onError: fail(t("automations.actions.clearFailed")),
  });

  return {
    toggle,
    pause,
    skipNext,
    unskipNext,
    clearOverride,
    run,
    cancelRun,
    conflict,
    setConflict,
  };
}
