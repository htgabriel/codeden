import {
  type Role,
  type Session,
  TRANSCRIPT_SEARCH_MIN_TERM,
  type TranscriptSearchHit,
} from "@codeden/contracts";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { i18n } from "@/lib/i18n";
import { useClient } from "./api";

/** True when the query has a term long enough to search transcripts with (3+ characters). */
export function canSearchTranscripts(q: string): boolean {
  return q
    .trim()
    .split(/\s+/)
    .some((t) => [...t].length >= TRANSCRIPT_SEARCH_MIN_TERM);
}

/** `value`, once it has stopped changing for `ms`. */
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (ms <= 0) {
      setSettled(value);
      return;
    }
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return ms <= 0 ? value : settled;
}

/** Which sessions a transcript search looks in. */
export interface TranscriptSearchFilters {
  projectId?: string;
  role?: Role;
  /** False leaves out archived sessions (they are included by default). */
  includeArchived?: boolean;
}

/**
 * Search transcripts as the user types (§13), one page of the newest matches: waits
 * `debounceMs` after the last keystroke, keeps the previous hits on screen while the next
 * search runs, and does nothing until the query has a term of 3+ characters.
 */
export function useTranscriptSearch(
  q: string,
  opts: TranscriptSearchFilters & { limit?: number; debounceMs?: number } = {},
) {
  const client = useClient();
  const settled = useDebouncedValue(q.trim(), opts.debounceMs ?? 200);
  const enabled = canSearchTranscripts(settled);
  const { limit, projectId, role, includeArchived } = opts;
  const query = useQuery({
    queryKey: ["search", "transcripts", settled, limit, projectId, role, includeArchived],
    queryFn: () =>
      client.searchTranscripts({ q: settled, limit, projectId, role, includeArchived }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
  return {
    data: enabled ? query.data : undefined,
    error: query.error,
    /** Typing hasn't settled, or a search is running. */
    searching: canSearchTranscripts(q) && (q.trim() !== settled || query.isFetching),
  };
}

/**
 * Every match for `q`, newest first, a page at a time (the results page): `loadMore` fetches
 * the next page while `hasMore`.
 */
export function useTranscriptSearchPages(
  q: string,
  opts: TranscriptSearchFilters & { limit: number },
) {
  const client = useClient();
  const settled = q.trim();
  const enabled = canSearchTranscripts(settled);
  const { limit, projectId, role, includeArchived } = opts;
  const query = useInfiniteQuery({
    queryKey: ["search", "transcripts", "pages", settled, limit, projectId, role, includeArchived],
    queryFn: ({ pageParam }) =>
      client.searchTranscripts({
        q: settled,
        limit,
        projectId,
        role,
        includeArchived,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
  const pages = enabled ? query.data?.pages : undefined;
  return {
    /** Undefined until the first page arrives. */
    hits: pages?.flatMap((p) => p.hits),
    query: pages?.[0]?.query ?? settled,
    error: query.error,
    searching: query.isFetching && !query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    loadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
  };
}

/**
 * Where a hit opens in its session (§13): `item` is the root-thread item to scroll to. For an
 * item inside a subagent's thread that is the subagent card, and `thread` and `threadItem` open
 * that thread beside it at the item itself.
 */
export function hitLinkSearch(
  hit: Pick<TranscriptSearchHit, "itemId" | "threadId" | "anchorItemId">,
): { item: string; thread?: string; threadItem?: string } {
  if (hit.anchorItemId === hit.itemId) return { item: hit.itemId };
  return { item: hit.anchorItemId, thread: hit.threadId, threadItem: hit.itemId };
}

/** What kind of transcript entry matched, in a word. */
export function hitKindLabel(hit: Pick<TranscriptSearchHit, "kind" | "toolKind">): string {
  const t = i18n.t;
  switch (hit.kind) {
    case "user_message":
    case "assistant_message":
    case "plan":
    case "subagent":
    case "user_question":
    case "approval_request":
    case "notice":
    case "hook_run":
    case "error":
      return t(`messages.hitKinds.${hit.kind}`);
    case "tool_call": {
      const tool = hit.toolKind ?? "other";
      return tool in TOOL_KINDS
        ? t(`messages.hitTools.${tool as keyof typeof TOOL_KINDS}`)
        : t("messages.hitTools.other");
    }
    default:
      return t("messages.hitKinds.item");
  }
}

const TOOL_KINDS = {
  command: true,
  file_edit: true,
  file_read: true,
  search: true,
  web: true,
  mcp: true,
  browser: true,
  other: true,
} as const;

/** "PM" and "Orchestrator" for role sessions; null for ordinary agent sessions. */
export function roleBadge(role: Session["role"]): string | null {
  if (role === "pm") return "PM";
  if (role === "orchestrator") return i18n.t("orchestrator.roleBadge.orchestrator");
  return null;
}
