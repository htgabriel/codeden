import {
  type FactoryItem,
  type FactoryItemCost,
  type MergeCheck,
  type Session,
  stoppedRetry,
  WorkType,
} from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { SectionLabel } from "@/components/common/bits";
import { Markdown } from "@/components/thread/markdown";
import { Button } from "@/components/ui/button";
import { useClient } from "@/lib/api";
import { factoryKeys } from "@/lib/factory";
import { ago } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { useSessionLookups } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { CheckPill } from "./factory-columns";
import { costFact, costTitle, hasCost } from "./item-cost";
import { CHECK_HELP, OUTCOME_LABEL, TYPE_LABEL } from "./meta";
import { RetryButton } from "./retry-button";

/**
 * Parts of the factory item page and the Factory view's item sheet (§10.1): the first step's
 * result, the item's actions, its merge checks, its session links and its cost.
 */

/** A link to the builder's or reviewer's session, or a dash when there is none. */
export function SessionLink({ id, label }: { id: string | null; label: string }) {
  const { t } = useTranslation();
  if (!id)
    return <span className="text-muted-foreground">{label === "session" ? "—" : label}</span>;
  return (
    <Link
      to="/sessions/$sessionId"
      params={{ sessionId: id }}
      className="text-primary hover:underline"
    >
      {label === "session" ? t("factory.parts.session") : label}
    </Link>
  );
}

/** What a session did for the item, from its work key. */
function sessionRole(s: Session): "reviewer" | "integrator" | "builder" {
  if (s.workKey.startsWith("factory:review:")) return "reviewer";
  if (s.workKey.startsWith("factory:integrate:")) return "integrator";
  return "builder";
}

/**
 * The item's other sessions: earlier attempts, and reviewers or builders that failed and were
 * replaced. The factory archives those, so they leave the sidebar; they stay reachable here.
 */
export function EarlierSessions({ item }: { item: FactoryItem }) {
  const { t } = useTranslation();
  const current = new Set([item.builderSessionId, item.reviewerSessionId]);
  const ids = item.sessionIds.filter((id) => !current.has(id));
  const sessions = useSessionLookups(ids);
  if (ids.length === 0) return null;
  return (
    <div className="space-y-1 text-xs" data-testid="item-earlier-sessions">
      <p className="text-muted-foreground">{t("factory.parts.earlierSessions")}</p>
      <ul className="space-y-0.5">
        {ids.map((id) => {
          const s = sessions.get(id);
          return (
            <li key={id} className="flex items-baseline justify-between gap-3">
              <SessionLink
                id={id}
                label={
                  s
                    ? `${t(`factory.parts.role.${sessionRole(s)}`)} · ${s.provider}`
                    : t("factory.parts.sessionTitle")
                }
              />
              {s && (
                <span
                  className={cn(
                    "text-3xs",
                    s.status === "failed" ? "text-status-failed" : "text-muted-foreground",
                  )}
                >
                  {s.status}
                  {s.archivedAt && ` · ${t("factory.parts.archived")}`}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * What the item cost so far, "≈ $12.40 · 4.1M tokens", with what kind of figure it is on hover;
 * "No usage yet" before an agent worked on it.
 */
export function CostValue({ cost }: { cost: FactoryItemCost | null }) {
  const { t } = useTranslation();
  if (!hasCost(cost))
    return <span className="text-muted-foreground">{t("factory.parts.noUsage")}</span>;
  return (
    <span className="tabular-nums" title={costTitle(cost)} data-testid="item-cost">
      {costFact(cost)}
    </span>
  );
}

/** One merge check with its result. */
export function CheckRow({ check }: { check: MergeCheck }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 border-b border-border px-3.5 py-2.5 last:border-0">
      <CheckPill check={check} />
      <div className="min-w-0 flex-1 text-2xs">
        <p className={cn(check.state === "fail" && "text-status-failed")}>
          {check.detail ?? CHECK_HELP[check.name]}
        </p>
        {check.escalate && (
          <p className="mt-0.5 flex items-center gap-1 text-status-waiting">
            <AlertTriangle className="size-3" /> {t("factory.parts.escalated")}
          </p>
        )}
      </div>
      <span className="shrink-0 text-3xs text-muted-foreground">{ago(check.at)}</span>
    </div>
  );
}

/** The first step's result: the bug's reproduction or the feature's analysis. */
export function InvestigationCard({ item }: { item: FactoryItem }) {
  const { t } = useTranslation();
  const inv = item.investigation;
  if (!inv) return null;
  const ok = inv.outcome === "reproduced" || inv.outcome === "implement";
  return (
    <section>
      <SectionLabel className="mb-2">
        {inv.kind === "reproduction"
          ? t("factory.parts.reproduction")
          : t("factory.parts.analysis")}
      </SectionLabel>
      <div className="rounded-xl border border-border bg-card p-4 text-[13px]">
        <p className={cn("font-medium", ok ? "text-status-done" : "text-status-waiting")}>
          {OUTCOME_LABEL[inv.outcome]}
        </p>
        <p className="mt-1 leading-relaxed">{inv.summary}</p>
        {inv.testPath && (
          <p className="mt-2 text-2xs text-muted-foreground">
            {t("factory.parts.test")} <code className="font-mono">{inv.testPath}</code>
          </p>
        )}
        {/* The spec (or the reproduction's notes) as the agent wrote it, in Markdown, in full. */}
        {inv.details && (
          <div className="mt-3 border-t border-border pt-3" data-testid="investigation-details">
            <Markdown>{inv.details}</Markdown>
          </div>
        )}
      </div>
    </section>
  );
}

/** What you can do with the item: let it in, change its pipeline, or retry it. */
export function ItemActions({ item, projectId }: { item: FactoryItem; projectId: string }) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const done = (title: string) => () => {
    toast.success(title);
    void queryClient.invalidateQueries({ queryKey: factoryKeys.all });
  };
  const fail = (title: string) => (e: Error) => toast.error(title, { description: e.message });
  const admit = useMutation({
    mutationFn: () => client.factory.admit(projectId, { itemId: item.id }),
    onSuccess: done(t("factory.parts.letIn")),
    onError: fail(t("factory.columns.letInFailed")),
  });
  const setType = useMutation({
    mutationFn: (type: WorkType) => client.factory.setType(projectId, { itemId: item.id, type }),
    onSuccess: done(t("factory.parts.pipelineChanged")),
    onError: fail(t("factory.parts.pipelineFailed")),
  });
  const notStarted = item.stage === "candidate" || item.stage === "backlog";
  if (item.stage === "ignored") {
    return (
      <Button
        size="sm"
        className="w-full"
        onClick={() => admit.mutate()}
        disabled={admit.isPending}
      >
        <UserCheck /> {t("factory.parts.takeItOn")}
      </Button>
    );
  }
  const stopped = stoppedRetry(item);
  if (stopped) {
    const pr = stopped.pr;
    return (
      <div className="space-y-1.5">
        {stopped.label && <p className="text-2xs text-muted-foreground">{stopped.label}</p>}
        <div className="flex gap-1.5">
          <RetryButton
            projectId={projectId}
            item={item}
            size="sm"
            variant="outline"
            className="flex-1"
          />
          {/* With its PR open, Retry re-reviews it; starting over is the other choice. */}
          {pr && (
            <RetryButton
              projectId={projectId}
              item={item}
              mode="rebuild"
              size="sm"
              variant="ghost"
            />
          )}
        </div>
        {pr && (
          <p className="text-3xs text-muted-foreground">
            {t("factory.parts.retryOrRebuild", { number: pr.number })}
          </p>
        )}
      </div>
    );
  }
  if (!notStarted) return null;
  return (
    <div className="space-y-1">
      <p className="text-3xs text-muted-foreground">{t("factory.parts.pipeline")}</p>
      <fieldset className="flex gap-1 border-0 p-0" aria-label={t("factory.parts.pipeline")}>
        {WorkType.options.map((type) => (
          <Button
            key={type}
            size="xs"
            variant={item.type === type ? "default" : "outline"}
            disabled={setType.isPending || item.type === type}
            onClick={() => setType.mutate(type)}
          >
            {TYPE_LABEL[type]}
          </Button>
        ))}
      </fieldset>
    </div>
  );
}
