import type { ProviderInfo, Session } from "@codeden/contracts";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/lib/i18n";
import { useTranscriptsStore } from "@/stores/transcripts";
import { useClient } from "./api";
import { useSnapshotData } from "./queries";
import { checksRunning } from "./transcript/checks";

const NOT_STARTED = new Set<Session["status"]>(["created", "queued", "starting"]);

/**
 * Whether "Compact now" applies to a session at all: its provider reports `capabilities.compact`
 * (Principle 5: never the provider's name) and it isn't archived.
 */
export const compactSupported = (
  session: Pick<Session, "archivedAt">,
  provider: Pick<ProviderInfo, "capabilities"> | undefined,
) => provider?.capabilities.compact === true && !session.archivedAt;

/**
 * Why a session that supports compaction can't compact right now, or null when it can (the
 * server checks the same, and also refuses while messages wait in its queue). `checking`: the
 * project's checks are running after its last turn.
 */
export function compactBlocked(
  session: Pick<Session, "status" | "resumeToken">,
  checking = false,
): string | null {
  if (session.status === "waiting") return i18n.t("messages.compact.waiting");
  if (session.status === "running") return i18n.t("messages.compact.running");
  if (NOT_STARTED.has(session.status)) return i18n.t("messages.compact.notStarted");
  if (!session.resumeToken) return i18n.t("messages.compact.noConversation");
  if (checking) return i18n.t("messages.compact.checking");
  return null;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * "Compact now" (§7.1): the provider summarizes the conversation to free up context, as a turn of
 * its own whose notice shows in the transcript. `supported` says whether to show the action,
 * `blocked` why it can't run right now (null when it can).
 */
export function useCompactSession(session: Session) {
  const client = useClient();
  const provider = useSnapshotData(
    (s) => s.runner.providers.find((p) => p.id === session.provider),
    undefined,
  );
  const checking = useTranscriptsStore((s) => {
    const transcript = s.byId[session.id];
    const threadId = transcript?.rootThreadId ?? session.rootThreadId;
    return Boolean(transcript && threadId && checksRunning(transcript, threadId));
  });
  const compact = useMutation({
    mutationFn: () => client.compactSession(session.id),
    onSuccess: () =>
      toast(i18n.t("messages.compact.started"), {
        description: i18n.t("messages.compact.startedDescription"),
      }),
    onError: (error) =>
      toast.error(i18n.t("messages.compact.failed"), { description: message(error) }),
  });
  const supported = compactSupported(session, provider);
  return {
    supported,
    blocked: supported
      ? compact.isPending
        ? i18n.t("messages.compact.compacting")
        : compactBlocked(session, checking)
      : null,
    pending: compact.isPending,
    compact: () => compact.mutate(),
  };
}
