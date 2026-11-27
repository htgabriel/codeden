import type { AutonomyLevel, Session, Snapshot } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import { useState } from "react";
import { toast } from "sonner";
import { AUTONOMY } from "@/components/thread/autonomy";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import {
  appliedNote,
  type LevelChange,
  planLevelChanges,
  sessionsKeepingLevel,
} from "@/lib/project-permissions";
import { snapshotKey, useSnapshotData } from "@/lib/queries";

/** How many sessions on another permission level are named before "and N more". */
const SHOWN = 3;

const sessionName = (s: Session, t: TFunction) =>
  s.title ?? s.purpose ?? t("project.keepingLevel.untitled");
const sessions = (n: number, t: TFunction) => t("project.keepingLevel.sessions", { count: n });
const WHEN = {
  next_tool_call: "project.keepingLevel.when.nextToolCall",
  next_turn: "project.keepingLevel.when.nextTurn",
} as const;

interface Outcome {
  change: LevelChange;
  updated?: Session;
  error?: string;
}

/** The sessions the last apply couldn't change, by id with the server's reason, and its level. */
interface Failures {
  level: AutonomyLevel;
  reasons: Map<string, string>;
}

/**
 * Change each session's level with `PATCH /api/sessions/:id`, the request its own Permissions
 * picker sends (§11.2), all at once. A session the server refuses is reported with the reason
 * instead of failing the rest.
 */
function useApplyLevel(onFailed: (failed: Failures) => void) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: LevelChange[]): Promise<Outcome[]> =>
      Promise.all(
        changes.map((change) =>
          client.updateSession(change.session.id, { autonomy: change.to }).then(
            (updated) => ({ change, updated }),
            (e: unknown) => ({ change, error: e instanceof Error ? e.message : String(e) }),
          ),
        ),
      ),
    onSuccess: (outcomes) => {
      const updated = new Map(
        outcomes.flatMap((o) => (o.updated ? [[o.updated.id, o.updated]] : [])),
      );
      queryClient.setQueryData<Snapshot>(snapshotKey, (s) =>
        s ? { ...s, sessions: s.sessions.map((x) => updated.get(x.id) ?? x) } : s,
      );
      const to = outcomes[0]?.change.to;
      if (!to) return;
      const failed = outcomes.filter((o) => o.error !== undefined);
      onFailed({
        level: to,
        reasons: new Map(failed.map((o) => [o.change.session.id, o.error as string])),
      });
      const applied = outcomes.filter((o) => o.updated).map((o) => o.change);
      const level = AUTONOMY[to].label;
      if (applied.length === 0) {
        toast.error(t("project.keepingLevel.allFailed"), {
          description: t("project.keepingLevel.allFailedHint"),
        });
        return;
      }
      const rest =
        failed.length > 0
          ? ` ${t("project.keepingLevel.someFailed", { sessions: sessions(failed.length, t) })}`
          : "";
      toast.success(
        t("project.keepingLevel.appliedToast", { level, sessions: sessions(applied.length, t) }),
        {
          description: `${appliedNote(applied)}${rest}`,
        },
      );
    },
  });
}

/**
 * The project's open agent sessions on another permission level than its own (#568), with
 * **Apply to open sessions** (#622): each listed session's level changes as its own Permissions
 * picker would change it. Raising any level asks first, naming the sessions it raises; lowering
 * doesn't. The sessions it couldn't change stay listed with the reason. For people only: no tool
 * does this for an agent, the PM or the orchestrator.
 */
export function SessionsKeepingLevel({
  projectId,
  level,
}: {
  projectId: string;
  level: AutonomyLevel;
}) {
  const { t } = useTranslation();
  const keeping = useSnapshotData((s) => sessionsKeepingLevel(s.sessions, projectId, level), []);
  const providers = useSnapshotData((s) => s.runner.providers, []);
  const [confirming, setConfirming] = useState<LevelChange[] | null>(null);
  const [failed, setFailed] = useState<Failures | null>(null);
  const apply = useApplyLevel(setFailed);
  if (keeping.length === 0) return null;

  const run = (changes: LevelChange[]) => {
    setFailed(null);
    apply.mutate(changes);
  };
  const start = () => {
    const changes = planLevelChanges(keeping, level, providers);
    if (changes.some((c) => c.raises)) setConfirming(changes);
    else run(changes);
  };
  // Reasons from applying another level no longer say anything about this one.
  const reasons = failed?.level === level ? failed.reasons : new Map<string, string>();
  const notChanged = keeping.filter((s) => reasons.has(s.id));
  const short = AUTONOMY[level].short;

  return (
    <div className="mt-2 space-y-2 text-2xs leading-relaxed text-muted-foreground">
      <p data-testid="sessions-keeping-level">
        {t("project.keepingLevel.intro", { count: keeping.length })}
        {keeping.slice(0, SHOWN).map((s, i) => (
          <span key={s.id}>
            {i > 0 && ", "}
            <Link
              to="/sessions/$sessionId"
              params={{ sessionId: s.id }}
              className="underline underline-offset-2 hover:text-foreground"
            >
              {sessionName(s, t)}
            </Link>{" "}
            ({AUTONOMY[s.autonomy].short})
          </span>
        ))}
        {keeping.length > SHOWN &&
          ` ${t("project.keepingLevel.andMore", { n: keeping.length - SHOWN })}`}
        . {t("project.keepingLevel.applyHint", { count: keeping.length, level: short })}
      </p>
      <Button
        size="xs"
        variant="outline"
        onClick={start}
        disabled={apply.isPending}
        title={t("project.keepingLevel.applyTitle", { count: keeping.length, level: short })}
        data-testid="apply-level"
      >
        {apply.isPending
          ? t("project.keepingLevel.applying")
          : t("project.keepingLevel.apply", { level: short })}
      </Button>
      {notChanged.length > 0 && (
        <ul className="space-y-0.5 text-status-failed" data-testid="apply-level-failed">
          {notChanged.map((s) => (
            <li key={s.id}>
              {t("project.keepingLevel.failedRow", {
                name: sessionName(s, t),
                reason: reasons.get(s.id) ?? "",
              })}
            </li>
          ))}
        </ul>
      )}
      <ConfirmRaise
        changes={confirming}
        onCancel={() => setConfirming(null)}
        onConfirm={(changes) => {
          setConfirming(null);
          run(changes);
        }}
      />
    </div>
  );
}

/** Asks before raising any session's level, naming each one it raises and when it applies. */
function ConfirmRaise({
  changes,
  onCancel,
  onConfirm,
}: {
  changes: LevelChange[] | null;
  onCancel: () => void;
  onConfirm: (changes: LevelChange[]) => void;
}) {
  const { t } = useTranslation();
  const raised = changes?.filter((c) => c.raises) ?? [];
  const lowered = (changes?.length ?? 0) - raised.length;
  const to = changes?.[0] ? AUTONOMY[changes[0].to].label : "";
  return (
    <AlertDialog open={changes !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("project.keepingLevel.raiseTitle", { count: raised.length, level: to })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("project.keepingLevel.raiseDescription", { count: raised.length })}
            {lowered > 0 &&
              ` ${t("project.keepingLevel.alsoLowers", { sessions: sessions(lowered, t) })}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul
          className="max-h-60 min-w-0 space-y-1.5 overflow-y-auto text-[13px]"
          data-testid="apply-level-raises"
        >
          {raised.map((c) => (
            <li key={c.session.id} className="min-w-0">
              <div className="truncate">{sessionName(c.session, t)}</div>
              <div className="text-2xs text-muted-foreground">
                {AUTONOMY[c.from].short} → {AUTONOMY[c.to].short}, {t(WHEN[c.appliesFrom])}
              </div>
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => changes && onConfirm(changes)}>
            {t("project.keepingLevel.applyTo", { sessions: sessions(changes?.length ?? 0, t) })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
