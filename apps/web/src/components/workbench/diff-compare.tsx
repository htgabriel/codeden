import type { DiffAgainst, Session } from "@codeden/contracts";
import { Link } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { ForkRelation, RelatedSession } from "@/lib/fork-origin";
import { ago } from "@/lib/format";
import { i18n, useTranslation } from "@/lib/i18n";

/**
 * Comparing a session's code with a related session's (§12.3): the "Compare with" entries of
 * the Diff panel's view menu, and the legend that says which side is which.
 */

const RELATION: Record<ForkRelation, () => string> = {
  source: () => i18n.t("workbench.compare.relation.source"),
  fork: () => i18n.t("workbench.compare.relation.fork"),
  handoff: () => i18n.t("workbench.compare.relation.handoff"),
  sibling: () => i18n.t("workbench.compare.relation.sibling"),
};

/** How the Diff panel names a session: its title, else its purpose. */
export const sessionName = (s: Session | undefined) =>
  s ? (s.title ?? s.purpose) : i18n.t("session.anotherSession");

/** The view menu's "Compare with" section; nothing when no session is related. */
export function CompareMenuItems({
  related,
  onPick,
}: {
  related: RelatedSession[];
  onPick: (sessionId: string) => void;
}) {
  const { t } = useTranslation();
  if (related.length === 0) return null;
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-2xs">{t("workbench.compare.with")}</DropdownMenuLabel>
      {related.map(({ session, relation }) => (
        <DropdownMenuItem key={session.id} onSelect={() => onPick(session.id)}>
          <GitCompareArrows className="text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{sessionName(session)}</span>
          <span className="shrink-0 text-2xs text-muted-foreground">
            {RELATION[relation]()}
            {session.archivedAt ? t("workbench.compare.archived") : ""}
          </span>
        </DropdownMenuItem>
      ))}
    </>
  );
}

/**
 * Which side of a comparison is which: `−` lines are the other session's latest checkpoint,
 * `+` lines this session's files as they are now.
 */
export function CompareLegend({
  sessionId,
  other,
  against,
}: {
  /** The session compared with. */
  sessionId: string;
  other: Session | undefined;
  /** Its checkpoint the diff starts from, once loaded. */
  against: DiffAgainst | undefined;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-border px-3 py-1.5 text-2xs text-muted-foreground"
      data-testid="compare-legend"
    >
      <span className="flex min-w-0 items-center gap-1">
        <span className="font-mono text-diff-del" aria-hidden>
          −
        </span>
        <Link
          to="/sessions/$sessionId"
          params={{ sessionId }}
          className="min-w-0 truncate text-foreground hover:underline"
          title={t("workbench.compare.open", { name: sessionName(other) })}
        >
          {sessionName(other)}
        </Link>
        {against && (
          <span className="shrink-0">
            {against.index === 0
              ? t("workbench.compare.asStarted", { when: ago(against.at) })
              : t("workbench.compare.asLastTurn", { when: ago(against.at) })}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <span className="font-mono text-diff-add" aria-hidden>
          +
        </span>
        {t("workbench.compare.thisSession")}
      </span>
    </div>
  );
}
