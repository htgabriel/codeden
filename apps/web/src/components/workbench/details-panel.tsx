import type { ForkOrigin, Session, SessionChecks } from "@codeden/contracts";
import { Link } from "@tanstack/react-router";
import { Brain, FoldVertical } from "lucide-react";
import type { ReactNode } from "react";
import { ProviderMark } from "@/components/common/bits";
import { AutonomyBadge } from "@/components/thread/autonomy";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SessionCostText } from "@/components/usage/session-cost";
import { useCompactSession } from "@/lib/compact-session";
import { forkOriginLabel, forkOriginText } from "@/lib/fork-origin";
import { ago, compact, duration, statusLabel } from "@/lib/format";
import { i18n, useTranslation } from "@/lib/i18n";
import { useSession } from "@/lib/queries";
import { useTranscriptsStore } from "@/stores/transcripts";
import { useVoiceStore } from "@/stores/voice";
import { LoadedConfig } from "./loaded-config";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-3 py-1.5 text-[13px]">
      <span className="text-2xs text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

const startedByLabel = {
  user: () => i18n.t("workbench.details.startedBy.user"),
  orchestrator: () => i18n.t("workbench.details.startedBy.orchestrator"),
  pm: () => i18n.t("workbench.details.startedBy.pm"),
  automation: () => i18n.t("workbench.details.startedBy.automation"),
};

/**
 * The session's project checks, frozen when it was created (§9 Project checks): exactly what
 * CodeDen runs for it, whatever its agent writes in `.codeden/project.json` since.
 */
function ChecksRow({ checks }: { checks: SessionChecks }) {
  const { t } = useTranslation();
  return (
    <Row label={t("workbench.details.checks")}>
      <ul className="space-y-0.5" data-testid="session-checks">
        {checks.commands.map((c, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the frozen list never changes
          <li key={i} className="flex items-baseline gap-1.5">
            <code className="min-w-0 truncate font-mono text-[12px]" title={c.command}>
              {c.command}
            </code>
            {c.timeoutSec !== undefined && (
              <span className="shrink-0 text-2xs text-muted-foreground">
                · {t("workbench.details.limit", { duration: duration(c.timeoutSec * 1000) })}
              </span>
            )}
          </li>
        ))}
      </ul>
      <span className="block text-2xs text-muted-foreground">
        {checks.untilPass
          ? t("workbench.details.untilPass", { count: checks.maxRounds })
          : t("workbench.details.untilPassOff")}
        {t("workbench.details.fixed")}
      </span>
    </Row>
  );
}

/**
 * The session a fork, a handoff or a review came from, the checkpoint its worktree started at
 * and, for a fork from a turn ("Fork from here"), where its conversation ends (§9).
 */
function ForkedFromRow({ origin }: { origin: ForkOrigin }) {
  const source = useSession(origin.sessionId);
  const text = forkOriginText(origin);
  return (
    <Row label={forkOriginLabel(origin).from}>
      <Link
        to="/sessions/$sessionId"
        params={{ sessionId: origin.sessionId }}
        className="underline-offset-2 hover:underline"
      >
        {source ? (source.title ?? source.purpose) : origin.sessionId}
      </Link>
      <span className="block text-2xs text-muted-foreground">{text.code}</span>
      {text.conversation && (
        <span className="block text-2xs text-muted-foreground">{text.conversation}</span>
      )}
    </Row>
  );
}

/**
 * "Compact now": the provider summarizes the conversation to free up context, as a turn of its
 * own. Shown only where the provider can (`capabilities.compact`); disabled with the reason while
 * it can't run.
 */
function CompactNow({ session }: { session: Session }) {
  const { t } = useTranslation();
  const action = useCompactSession(session);
  if (!action.supported) return null;
  return (
    <Button
      size="xs"
      variant="ghost"
      className="-my-1 text-muted-foreground"
      onClick={action.compact}
      disabled={action.blocked !== null}
      title={action.blocked ?? t("workbench.details.compactHint")}
      data-testid="compact-now"
    >
      <FoldVertical />{" "}
      {action.pending ? t("workbench.details.compacting") : t("workbench.details.compactNow")}
    </Button>
  );
}

/**
 * How full the context window is, as the provider last reported it in this view, and the
 * session's cost from the usage ledger. A figure that wasn't reported shows as "—" (§12.6).
 */
function ContextWindow({ session }: { session: Session }) {
  const { t } = useTranslation();
  const usage = useTranscriptsStore((s) => s.byId[session.id]?.usage ?? null);
  const used = usage?.contextTokens;
  const size = usage?.contextWindow;
  const pct = used !== undefined && size ? Math.min(100, (used / size) * 100) : null;
  const reading =
    used === undefined && size === undefined
      ? "—"
      : t("workbench.details.tokens", {
          used: used !== undefined ? compact(used) : "—",
          size: size ? compact(size) : "—",
        });
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-2xs font-medium tracking-wider text-muted-foreground uppercase">
          {t("workbench.details.contextWindow")}
        </h3>
        <CompactNow session={session} />
      </div>
      {pct !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="flex justify-between gap-3 text-2xs text-muted-foreground tabular-nums">
        <span title={pct === null ? t("workbench.details.notReported") : undefined}>{reading}</span>
        <SessionCostText sessionId={session.id} />
      </div>
    </section>
  );
}

/** Session metadata, usage and what's loaded into its context (§8.4, §12.4). */
export function DetailsPanel({ session }: { session: Session }) {
  const { t } = useTranslation();
  const muted = useVoiceStore((s) => Boolean(s.muted[session.id]));
  const setMuted = useVoiceStore((s) => s.setMuted);

  return (
    <div className="h-full space-y-5 overflow-y-auto p-4 scroll-thin">
      <section className="divide-y divide-border/60">
        <Row label={t("workbench.details.status")}>
          {statusLabel[session.status]}
          {session.progress && (
            <span className="block text-2xs text-muted-foreground">{session.progress.text}</span>
          )}
        </Row>
        <Row label={t("workbench.details.purpose")}>{session.purpose}</Row>
        <Row label={t("workbench.details.workKey")}>
          <code className="font-mono text-[12px]">{session.workKey}</code>
        </Row>
        <Row label={t("workbench.details.startedByLabel")}>
          {startedByLabel[session.startedBy.kind]()} · {ago(session.createdAt)}
        </Row>
        {session.forkedFrom && <ForkedFromRow origin={session.forkedFrom} />}
        <Row label={t("workbench.details.provider")}>
          <span className="inline-flex items-center gap-1.5">
            <ProviderMark provider={session.provider} /> {session.provider} ·{" "}
            {session.model ?? t("workbench.details.defaultModel")}
            {session.effort ? ` · ${session.effort}` : ""}
          </span>
        </Row>
        <Row label={t("workbench.details.autonomy")}>
          <AutonomyBadge level={session.autonomy} />
        </Row>
        {session.checks && session.checks.commands.length > 0 && (
          <ChecksRow checks={session.checks} />
        )}
        {session.branch && (
          <Row label={t("workbench.details.branch")}>
            <code className="font-mono text-[12px]">{session.branch}</code>{" "}
            <span className="text-2xs text-muted-foreground">
              {t("workbench.details.fromBranch", { branch: session.baseBranch ?? "" })}
            </span>
          </Row>
        )}
        {session.worktreePath ? (
          <Row label={t("workbench.details.worktree")}>
            <code className="font-mono text-[11.5px] text-muted-foreground">
              {session.worktreePath}
            </code>
          </Row>
        ) : (
          // Runs in place: in the project folder, or the folder it was started in.
          <Row label={t("workbench.details.folder")}>
            <code className="font-mono text-[11.5px] text-muted-foreground">{session.cwd}</code>
          </Row>
        )}
        {session.scope.paths && (
          <Row label={t("workbench.details.scope")}>
            <code className="font-mono text-[12px]">{session.scope.paths.join(", ")}</code>
          </Row>
        )}
      </section>

      <ContextWindow session={session} />

      <LoadedConfig session={session} />
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span>
          {t("workbench.details.readAloud")}
          <span className="block text-2xs text-muted-foreground">
            {t("workbench.details.readAloudHint")}
          </span>
        </span>
        <Switch
          checked={!muted}
          onCheckedChange={(on) => setMuted(session.id, !on)}
          aria-label={t("workbench.details.readAloud")}
        />
      </div>
      <p className="flex items-center gap-1.5 text-3xs text-muted-foreground/70">
        <Brain className="size-3" />{" "}
        {session.resumeToken
          ? t("workbench.details.resumable", { id: session.id })
          : t("workbench.details.resumableAfter", { id: session.id })}
      </p>
    </div>
  );
}
