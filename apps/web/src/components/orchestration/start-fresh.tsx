import type { Session } from "@codeden/contracts";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import { Archive } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { useProjectArchived, useSnapshotData } from "@/lib/queries";

type RoleSession = Session & { role: "orchestrator" | "pm" };

const isRole = (session: Session): session is RoleSession => session.role !== "agent";

const roleName = (session: Pick<Session, "role">, t: TFunction) =>
  session.role === "pm"
    ? t("orchestrator.startFresh.namePm")
    : t("orchestrator.startFresh.nameOrchestrator");

/**
 * Why "Start fresh" can't run now, or null when it can. The server refuses the same: archiving
 * the session would cut off its turn or drop a question the person hasn't answered.
 */
export function startFreshBlocked(
  session: Pick<Session, "role" | "status">,
  running: boolean,
  openRequests: number,
  t: TFunction,
): string | null {
  const name = roleName(session, t);
  if (session.status === "waiting" || openRequests > 0) {
    return t("orchestrator.startFresh.answerFirst", { name });
  }
  if (running || session.status === "running") {
    return t("orchestrator.startFresh.waitForTurn", { name });
  }
  if (session.status === "created" || session.status === "queued" || session.status === "starting")
    return t("orchestrator.startFresh.stillStarting", { name });
  return null;
}

/** The role chat's own page: the orchestrator's home or the project's PM. */
function useOpenRoleChat() {
  const navigate = useNavigate();
  return (session: Session) =>
    session.role === "pm" && session.projectId
      ? navigate({ to: "/projects/$projectId/pm", params: { projectId: session.projectId } })
      : navigate({ to: "/" });
}

/**
 * "Start fresh" for the orchestrator's or a PM's thread menu (§8.1): whether it shows, why it
 * is disabled, and the confirmation dialog it opens. Only for the role's current session.
 */
export function useStartFresh(session: Session, running: boolean) {
  const client = useClient();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const openRoleChat = useOpenRoleChat();
  const [confirming, setConfirming] = useState(false);
  const openRequests = useSnapshotData(
    (s) =>
      s.inbox.filter(
        (i) =>
          i.sessionId === session.id &&
          i.status === "open" &&
          (i.kind === "question" || i.kind === "approval"),
      ).length,
    0,
  );
  const mutation = useMutation({
    mutationFn: () =>
      client.orchestration.startFresh(
        session.role === "pm" ? "pm" : "orchestrator",
        session.projectId,
        session.id,
      ),
    onSuccess: ({ archivedSessionId }) => {
      setConfirming(false);
      void openRoleChat(session);
      toast.success(t("orchestrator.startFresh.started", { name: roleName(session, t) }), {
        description: t("orchestrator.startFresh.startedHint"),
        action: {
          label: t("orchestrator.startFresh.openEarlier"),
          onClick: () =>
            void navigate({ to: "/sessions/$sessionId", params: { sessionId: archivedSessionId } }),
        },
      });
    },
    onError: (error) =>
      toast.error(t("orchestrator.startFresh.failed"), {
        description: error instanceof Error ? error.message : String(error),
      }),
  });
  const projectArchived = useProjectArchived(session.projectId);
  const available = isRole(session) && !session.archivedAt;
  return {
    /** Show "Start fresh": the role's current session. */
    available,
    /** Why it can't run right now (null when it can). */
    blocked: available
      ? mutation.isPending
        ? t("orchestrator.startFresh.starting")
        : projectArchived
          ? t("orchestrator.startFresh.projectArchived")
          : startFreshBlocked(session, running, openRequests, t)
      : null,
    open: () => setConfirming(true),
    dialog: (
      <StartFreshDialog
        session={session}
        open={confirming}
        onOpenChange={setConfirming}
        pending={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      />
    ),
  };
}

function StartFreshDialog({
  session,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const name = roleName(session, t);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("orchestrator.startFresh.dialogTitle", { name })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("orchestrator.startFresh.dialogBody", { name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              // Closed by `onSuccess`, so a refusal keeps the dialog's context.
              e.preventDefault();
              onConfirm();
            }}
          >
            {t("orchestrator.startFresh.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * In place of the composer on an archived orchestrator or PM conversation: it is read-only
 * (a newer session holds the role), with a link to the current one.
 */
export function ArchivedRoleNotice({ session }: { session: Session }) {
  const { t } = useTranslation();
  const name =
    session.role === "pm"
      ? t("orchestrator.startFresh.archivedNamePm")
      : t("orchestrator.startFresh.archivedNameOrchestrator");
  return (
    <div className="mx-auto flex w-full max-w-[46rem] items-center gap-2.5 px-6 pb-4">
      <p className="flex flex-1 items-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-2.5 text-xs text-muted-foreground">
        <Archive className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1">
          {t("orchestrator.startFresh.archivedNotice", { name })}{" "}
          {session.role === "pm" && session.projectId ? (
            <Link
              to="/projects/$projectId/pm"
              params={{ projectId: session.projectId }}
              className="text-foreground underline-offset-2 hover:underline"
            >
              {t("orchestrator.startFresh.openCurrent")}
            </Link>
          ) : (
            <Link to="/" className="text-foreground underline-offset-2 hover:underline">
              {t("orchestrator.startFresh.openCurrent")}
            </Link>
          )}
        </span>
      </p>
    </div>
  );
}

/** An archived orchestrator or PM conversation: read-only (§8.1). */
export const isArchivedRole = (session: Pick<Session, "role" | "archivedAt">) =>
  session.role !== "agent" && Boolean(session.archivedAt);
