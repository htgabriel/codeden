import {
  type ArchiveSessionResponse,
  describeUnpushedWork,
  type HandoffSessionRequest,
  type Session,
  type UnpushedWork,
} from "@codeden/contracts";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { i18n } from "@/lib/i18n";
import { useUiStore } from "@/stores/ui";
import { useClient } from "./api";
import { copyWithFeedback, notifyCopyFailed } from "./copy";
import { saveMarkdown } from "./download";
import { platform } from "./platform";
import { useProject, useSnapshotData } from "./queries";
import {
  canReview,
  canStop,
  forkBlocked,
  forkSupported,
  notARepoReason,
  useHandoffBlocked,
  useReviewBlocked,
} from "./session-availability";

export {
  canReview,
  canStop,
  forkBlocked,
  forkSupported,
  handoffBlocked,
  notARepoActionReason,
  reviewBlocked,
  useHandoffBlocked,
  useReviewBlocked,
  useTurnCount,
} from "./session-availability";

/**
 * Hand a session off (§9): a new session on the chosen provider with this one's code and a
 * brief of its work, then open it. Writing the brief can take a moment (the utility model
 * summarises the work), so a loading toast shows meanwhile.
 */
export function useHandoffSession(session: Session) {
  const client = useClient();
  const navigate = useNavigate();
  const providers = useSnapshotData((s) => s.runner.providers, []);
  return useMutation({
    mutationFn: (req: HandoffSessionRequest) => client.handoffSession(session.id, req),
    onMutate: () => ({ toastId: toast.loading(i18n.t("session.handoff.writing")) }),
    onSuccess: ({ sessionId }, req, context) => {
      const name = providers.find((p) => p.id === req.provider)?.displayName ?? req.provider;
      toast.success(i18n.t("session.handoff.continued", { name }), {
        id: context?.toastId,
        description: i18n.t("session.handoff.continuedDescription"),
      });
      void navigate({ to: "/sessions/$sessionId", params: { sessionId } });
    },
    onError: (error, _vars, context) => toast.error(message(error), { id: context?.toastId }),
  });
}

/**
 * Sessions that can be turned into an automation ("Make an automation…"): agent sessions in a
 * project. PM and orchestrator sessions are conversations, not repeatable tasks.
 */
export const canMakeAutomation = (session: Pick<Session, "role" | "projectId">) =>
  session.role === "agent" && session.projectId !== null;

/** A link to the session in this CodeDen (no token: the browser's cookie signs it in). */
export const sessionLink = (sessionId: string, origin = window.location.origin) =>
  `${origin}/sessions/${encodeURIComponent(sessionId)}`;

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

const brief = (text: string | null) =>
  text && text.length > 160 ? `${text.slice(0, 159).trimEnd()}…` : (text ?? undefined);

/**
 * Whether pushing the session's branch would save work a container was kept for: its checked-out
 * branch has commits no remote has (#337).
 */
export const canPushFirst = (unpushed: UnpushedWork | undefined) =>
  unpushed?.current != null && unpushed.branches.some((b) => b.name === unpushed.current);

/**
 * A toast whose text takes the full width, with its buttons on a row of their own below (two
 * long labels beside the text squeeze it into a narrow column). Important: sonner's own rule for
 * the content outranks a utility.
 */
const WIDE_ACTIONS = {
  toast: "flex-wrap",
  content: "basis-[calc(100%-2rem)]!",
  actionButton: "ml-1.5!",
};

/**
 * Toast for an archive: what happened to the worktree, with Undo. A worktree kept because of
 * uncommitted changes offers Remove anyway; a removal that failed (a file still in use) offers
 * Try again. A container kept because its clone holds work that exists nowhere else (#337) says
 * what, offers Push the branch first when that would save it, and Delete anyway, saying the work
 * is deleted for good.
 */
export function announceArchive(
  result: ArchiveSessionResponse,
  actions: { undo: () => void; retry: () => void; force: () => void; push: () => void },
): void {
  const t = i18n.t;
  const undo = { label: t("session.archive.undo"), onClick: actions.undo };
  const { status, message: detail, unpushed } = result.worktree;
  if (status === "removed") {
    toast.success(
      unpushed ? t("session.archive.containerDeleted") : t("session.archive.worktreeRemoved"),
      { action: undo, description: brief(detail) },
    );
  } else if (status === "none") {
    toast.success(t("session.archive.archived"), { action: undo });
  } else if (status === "kept_changes" && unpushed) {
    const work = describeUnpushedWork(unpushed);
    const remove = { label: t("session.archive.deleteAnyway"), onClick: actions.force };
    const push = { label: t("session.archive.pushFirst"), onClick: actions.push };
    toast.warning(t("session.archive.keptUnpushed"), {
      description: t("session.archive.keptUnpushedDescription", {
        work: `${work.charAt(0).toUpperCase()}${work.slice(1)}`,
      }),
      action: canPushFirst(unpushed) ? push : remove,
      cancel: canPushFirst(unpushed) ? remove : undo,
      duration: 20_000,
      classNames: WIDE_ACTIONS,
    });
  } else if (status === "kept_changes") {
    toast(t("session.archive.keptChanges"), {
      action: { label: t("session.archive.removeAnyway"), onClick: actions.force },
      cancel: undo,
      duration: 10_000,
    });
  } else {
    toast.warning(t("session.archive.notRemoved"), {
      description: brief(detail),
      action: { label: t("session.archive.tryAgain"), onClick: actions.retry },
      cancel: undo,
      duration: 10_000,
    });
  }
}

/**
 * Fork a session (§9): at its latest moment, or from a finished turn of its own ("Fork from
 * here"), then open the fork. `canFork` says whether the provider can fork at all, `blocked`
 * why it can't right now (null when it can), `notARepo` that it never can in this project.
 */
export function useForkSession(session: Session) {
  const client = useClient();
  const navigate = useNavigate();
  // Copying the conversation can take a moment (a provider may start a process for it).
  const fork = useMutation({
    mutationFn: (turnId: string | undefined) =>
      turnId ? client.forkSession(session.id, { turnId }) : client.forkSession(session.id),
    onMutate: () => ({ toastId: toast.loading(i18n.t("session.fork.forking")) }),
    onSuccess: ({ sessionId }, turnId, context) => {
      toast.success(i18n.t("session.fork.forked"), {
        id: context?.toastId,
        description: turnId
          ? i18n.t("session.fork.afterTurnDescription")
          : i18n.t("session.fork.soFarDescription"),
      });
      void navigate({ to: "/sessions/$sessionId", params: { sessionId } });
    },
    onError: (error, _vars, context) => toast.error(message(error), { id: context?.toastId }),
  });
  const provider = useSnapshotData(
    (s) => s.runner.providers.find((p) => p.id === session.provider),
    undefined,
  );
  const project = useProject(session.projectId);
  const canFork = forkSupported(session, provider);
  return {
    canFork,
    blocked: canFork
      ? fork.isPending
        ? i18n.t("session.fork.pending")
        : forkBlocked(session, project)
      : null,
    /** The project folder isn't a git repository, so no fork can be made there (§9). */
    notARepo: notARepoReason(project) !== null,
    /** A fork is under way (its "Forking the session…" toast is showing). */
    pending: fork.isPending,
    /** Fork at the latest moment, or through the end of `turnId`. */
    fork: (turnId?: string) => fork.mutate(turnId),
  };
}

/**
 * The second line under Copy and Download as Markdown: the export hides secrets (§13). A
 * function, so it follows the UI language.
 */
export const markdownHint = () => i18n.t("session.actions.markdownHint");

/**
 * What you can do to a session from its row menu, the thread header's ⋯ menu or the command
 * palette: open, rename, copy its link, copy or download it as Markdown, make an automation from
 * it, stop, fork, hand off, review with another agent, archive (with Undo) and unarchive. They
 * all use this, so they show the same toasts.
 */
export function useSessionActions(session: Session) {
  const client = useClient();
  const navigate = useNavigate();
  const onError = (error: unknown) => toast.error(message(error));

  const stop = useMutation({
    mutationFn: () => client.stopSession(session.id),
    onSuccess: () => toast(i18n.t("session.actions.stopped")),
    onError,
  });
  const unarchive = useMutation({
    mutationFn: () => client.unarchiveSession(session.id),
    onSuccess: () => toast.success(i18n.t("session.actions.restored")),
    onError,
  });
  const announce = (result: ArchiveSessionResponse, force: boolean) =>
    announceArchive(result, {
      undo: () => unarchive.mutate(),
      retry: () => archive.mutate(force),
      force: () => archive.mutate(true),
      push: () => pushThenArchive.mutate(),
    });
  const archive = useMutation({
    mutationFn: (force: boolean) => client.archiveSession(session.id, { force }),
    onSuccess: announce,
    onError,
  });
  // A container kept for unpushed commits (#337): push its branch (with the brokered GitHub
  // credential), then archive again, which removes the container when nothing else is left.
  const pushThenArchive = useMutation({
    mutationFn: async () => {
      await client.gitPush(session.id, {});
      return client.archiveSession(session.id, { force: false });
    },
    onSuccess: (result) => announce(result, false),
    onError: (error) =>
      toast.error(i18n.t("session.actions.pushFailed"), { description: message(error) }),
  });
  const rename = useMutation({
    mutationFn: (title: string) => client.updateSession(session.id, { title }),
    onError,
  });
  // Share the transcript (§13): the server writes the Markdown, every thread included.
  const exportMarkdown = useMutation({
    mutationFn: async (how: "copy" | "download") => {
      const file = await client.exportSession(session.id);
      if (how === "download") {
        saveMarkdown(file.fileName, file.markdown);
        return { how, fileName: file.fileName, copied: false };
      }
      // Fetched first, so the click's gesture may have expired; a failed copy says so itself.
      const copied = await platform.writeClipboard(file.markdown);
      if (!copied) notifyCopyFailed();
      return { how, fileName: file.fileName, copied };
    },
    onSuccess: ({ how, fileName, copied }) => {
      if (how === "download") toast.success(i18n.t("session.actions.downloaded", { fileName }));
      else if (copied) toast.success(i18n.t("session.actions.copiedMarkdown"));
    },
    onError: (error) =>
      toast.error(i18n.t("session.actions.exportFailed"), { description: message(error) }),
  });
  const fork = useForkSession(session);
  const setHandoff = useUiStore((s) => s.setHandoff);
  const blocked = useHandoffBlocked(session);
  const setReview = useUiStore((s) => s.setReview);
  const reviewable = canReview(session);
  const notReviewable = useReviewBlocked(session);

  return {
    open: () => void navigate({ to: "/sessions/$sessionId", params: { sessionId: session.id } }),
    /** Save a new title; blank or unchanged titles are ignored. */
    rename: (title: string) => {
      const next = title.trim().slice(0, 200);
      if (next && next !== (session.title ?? session.purpose)) rename.mutate(next);
    },
    copyLink: async () => {
      await copyWithFeedback(sessionLink(session.id), i18n.t("session.actions.linkCopied"));
    },
    /** Copy the transcript as Markdown, to paste into an issue, a PR or a write-up. */
    copyMarkdown: () => exportMarkdown.mutate("copy"),
    /** Download the transcript as a `.md` file. */
    downloadMarkdown: () => exportMarkdown.mutate("download"),
    canMakeAutomation: canMakeAutomation(session),
    /** Open the New automation editor prefilled from this session; nothing is saved yet. */
    makeAutomation: () => {
      if (!session.projectId) return;
      void navigate({
        to: "/projects/$projectId/automations/new",
        params: { projectId: session.projectId },
        search: { session: session.id },
      });
    },
    canStop: canStop(session),
    stop: () => stop.mutate(),
    archived: Boolean(session.archivedAt),
    archive: () => archive.mutate(false),
    unarchive: () => unarchive.mutate(),
    /** The provider can fork this session's conversation: show the Fork action. */
    canFork: fork.canFork,
    /** Why Fork is disabled right now (null when it can run). */
    forkBlocked: fork.blocked,
    fork: () => fork.fork(),
    /** Agent sessions can be handed off to any provider: show the Hand off action. */
    canHandoff: session.role === "agent",
    /** Why Hand off is disabled right now (null when it can run). */
    handoffBlocked: session.role === "agent" ? blocked : null,
    /** Open the handoff dialog, with `provider` chosen when given. */
    handoff: (provider?: string) =>
      setHandoff({ sessionId: session.id, provider: provider ?? null }),
    /** Agent sessions other than reviews can be reviewed: show "Review with another agent". */
    canReview: reviewable,
    /** Why the review can't start right now (null when it can). */
    reviewBlocked: reviewable ? notReviewable : null,
    /** Open the review dialog, with `provider` chosen when given. */
    review: (provider?: string) => setReview({ sessionId: session.id, provider: provider ?? null }),
  };
}

export type SessionActions = ReturnType<typeof useSessionActions>;
