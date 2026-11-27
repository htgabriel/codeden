import type { EventEnvelope, QueuedMessage, QueueSender } from "@codeden/contracts";
import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { i18n } from "@/lib/i18n";
import { getDraft, useComposerStore } from "@/stores/composer";
import { usePrRequestsStore } from "@/stores/pr-requests";
import { useClient } from "./api";
import { isOpenPrPrompt } from "./pull-request";
import { onLiveEvent } from "./realtime";

/** Query key of a session's queued messages (`GET /api/sessions/:id/queue`). */
export const queueKey = (sessionId: string) => ["session-queue", sessionId] as const;

/** The session a `message.*` queue event belongs to, if it is one. */
export function queueEventSession(env: EventEnvelope): string | undefined {
  if (env.type === "message.queued") return env.payload.message.sessionId;
  if (env.type === "message.dequeued" || env.type === "message.edited") {
    return env.payload.sessionId;
  }
  return undefined;
}

/** "Next", "2nd", "3rd", "4th"… for a queue position (0-based). */
export function queuePosition(index: number): string {
  const t = i18n.t;
  if (index === 0) return t("messages.queue.next");
  const n = index + 1;
  const tens = n % 100;
  const suffix =
    tens >= 11 && tens <= 13 ? "th" : (({ 1: "st", 2: "nd", 3: "rd" } as const)[n % 10] ?? "th");
  return `${n}${t(`messages.queue.${suffix}`)}`;
}

/** Who queued a message, for its label; `null` for the user's own messages. */
export const senderLabel = (from: QueueSender): string | null =>
  from === "user" ? null : i18n.t(`messages.queue.senders.${from}`);

/**
 * A session's queued messages, kept live from the `message.*` events. When an interrupt or
 * stop drops the user's queued messages, their text goes back into the composer draft. A
 * request for a pull request that is deleted or dropped is no longer in progress.
 */
export function useQueuedMessages(sessionId: string) {
  const client = useClient();
  const queryClient = useQueryClient();
  useEffect(() => {
    const restore = droppedRestorer(queryClient, sessionId);
    return onLiveEvent((env) => {
      if (queueEventSession(env) !== sessionId) return;
      if (env.type === "message.dequeued" && env.payload.reason !== "sent") {
        const { messageId, reason } = env.payload;
        const cached = queryClient.getQueryData<QueuedMessage[]>(queueKey(sessionId));
        const message = cached?.find((m) => m.id === messageId);
        if (message && isOpenPrPrompt(message.input.text)) {
          usePrRequestsStore.getState().forget(sessionId);
        }
        if (reason === "dropped") restore(messageId);
      }
      void queryClient.invalidateQueries({ queryKey: queueKey(sessionId) });
    });
  }, [queryClient, sessionId]);
  return useQuery({
    queryKey: queueKey(sessionId),
    queryFn: () => client.queue.list(sessionId),
  });
}

/**
 * Collects the user's messages dropped by one interrupt (they arrive as a burst of events)
 * and moves their text back into the composer draft with a single toast.
 */
function droppedRestorer(queryClient: QueryClient, sessionId: string) {
  let pending: QueuedMessage[] = [];
  const flush = () => {
    const dropped = pending;
    pending = [];
    const texts = dropped.map((m) => m.input.text.trim()).filter(Boolean);
    if (texts.length === 0) return;
    const store = useComposerStore.getState();
    const current = getDraft(store, sessionId).text.trim();
    store.setText(sessionId, [...texts, current].filter(Boolean).join("\n\n"));
    const lostFiles = dropped.some((m) => m.input.attachments.length > 0);
    toast(i18n.t("messages.queue.restored"), {
      description: `${i18n.t("messages.queue.restoredDescription", { count: texts.length })}${
        lostFiles ? i18n.t("messages.queue.attachmentsLost") : ""
      }`,
    });
  };
  return (messageId: string) => {
    const cached = queryClient.getQueryData<QueuedMessage[]>(queueKey(sessionId));
    const message = cached?.find((m) => m.id === messageId);
    if (message?.from !== "user") return;
    if (pending.length === 0) setTimeout(flush, 0);
    pending.push(message);
  };
}
