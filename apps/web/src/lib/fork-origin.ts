import type { ForkOrigin, Session } from "@codeden/contracts";
import { i18n } from "@/lib/i18n";

/**
 * How a fork describes where it came from (§9): `upTo` finishes "the conversation and the code
 * …" in its empty transcript; `code` and `conversation` are its Details lines. A fork from a
 * turn names it by the source's turn number, never by a checkpoint number (a checkpoint that
 * failed to write takes none, so the two can differ); without one it names no number.
 */
export function forkOriginText(origin: ForkOrigin): {
  upTo: string;
  code: string;
  conversation: string | null;
} {
  const t = i18n.t;
  const n = origin.turnNumber ?? null;
  if (origin.turnId) {
    return {
      upTo: n ? t("session.origin.upToAfterTurn", { n }) : t("session.origin.upToAfterForkedTurn"),
      code:
        origin.checkpoint === null
          ? t("session.origin.codeBranch")
          : n
            ? t("session.origin.codeAfterTurn", { n })
            : t("session.origin.codeEndOfTurn"),
      conversation: n
        ? t("session.origin.conversationUpToTurn", { n })
        : t("session.origin.conversationUpToForkedTurn"),
    };
  }
  return {
    upTo: t("session.origin.upToSoFar"),
    code:
      origin.checkpoint === null
        ? t("session.origin.codeBranch")
        : origin.checkpoint === 0
          ? t("session.origin.codeStarted")
          : t("session.origin.codeAfterTurn", { n: origin.checkpoint }),
    // A handoff or a review starts a new conversation, possibly on another provider (§9).
    conversation:
      origin.kind === "handoff"
        ? t("session.origin.conversationHandoff")
        : origin.kind === "review"
          ? t("session.origin.conversationReview")
          : null,
  };
}

/** Whether a session was handed off from another (a new conversation), not forked. */
export const isHandoff = (origin: ForkOrigin) => origin.kind === "handoff";

/** Whether a session is a read-only review of another one's changes (§9). */
export const isReview = (origin: ForkOrigin | null | undefined) => origin?.kind === "review";

/**
 * How a session made from another one names it: `from` in Details and tooltips, `chip` in the
 * thread header ("Fork of …", "Handed off from …", "Review of …").
 */
export function forkOriginLabel(origin: ForkOrigin): { from: string; chip: string } {
  const t = i18n.t;
  if (origin.kind === "handoff") {
    const from = t("session.origin.handedOffFrom");
    return { from, chip: from };
  }
  if (origin.kind === "review") {
    const from = t("session.origin.reviewOf");
    return { from, chip: from };
  }
  return { from: t("session.origin.forkedFrom"), chip: t("session.origin.forkOf") };
}

/** How a session is related to the one whose diff is open. */
export type ForkRelation = "source" | "fork" | "handoff" | "sibling";

/** A session whose code the Diff panel can compare with, and how it is related. */
export interface RelatedSession {
  session: Session;
  relation: ForkRelation;
}

const newestFirst = (a: Session, b: Session) => b.createdAt.localeCompare(a.createdAt);

/**
 * The sessions `session`'s code can be compared with (§12.3), in this order: the one it was
 * forked or handed off from, the ones forked or handed off from it, and its siblings (other
 * forks and handoffs of its source), each group newest first. Only the same project's. Reviews
 * are left out: a read-only reviewer has no code of its own, only its source's.
 */
export function relatedSessions(session: Session, all: readonly Session[]): RelatedSession[] {
  if (!session.projectId) return [];
  const candidates = all.filter(
    (s) => s.id !== session.id && s.projectId === session.projectId && !isReview(s.forkedFrom),
  );
  const sourceId = session.forkedFrom?.sessionId;
  const source = candidates.find((s) => s.id === sourceId);
  const children = candidates
    .filter((s) => s.forkedFrom?.sessionId === session.id)
    .sort(newestFirst)
    .map(
      (s): RelatedSession => ({
        session: s,
        relation: s.forkedFrom && isHandoff(s.forkedFrom) ? "handoff" : "fork",
      }),
    );
  const siblings = sourceId
    ? candidates
        .filter((s) => s.forkedFrom?.sessionId === sourceId)
        .sort(newestFirst)
        .map((s): RelatedSession => ({ session: s, relation: "sibling" }))
    : [];
  return [
    ...(source ? [{ session: source, relation: "source" as const }] : []),
    ...children,
    ...siblings,
  ];
}
