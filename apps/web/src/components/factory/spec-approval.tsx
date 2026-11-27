import {
  type FactoryItem,
  type FactorySpecDecisionRequest,
  SPEC_FEEDBACK_MAX,
  type SpecApproval,
} from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquareWarning, PencilLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SectionLabel } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClient } from "@/lib/api";
import { factoryKeys } from "@/lib/factory";
import { ago } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

/**
 * The optional spec approval (§10.1, "Approve specs before building"): a feature's spec waits for
 * you after Analyze. Approve it and the agent builds it; ask for changes and it revises its
 * analysis first. Used on the item page and on the spec's inbox card.
 */

/**
 * Approve a spec that waits for you, or ask for changes (with what to change). The decision
 * carries the version shown, so one made on a spec the agent revised since is refused.
 */
export function SpecDecision({
  projectId,
  itemId,
  version,
  compact = false,
}: {
  projectId: string;
  itemId: string;
  /** The version of the spec shown (`SpecApproval.requestedAt`). */
  version: string;
  /** Smaller buttons, for an inbox card. */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const decide = useMutation({
    mutationFn: (req: FactorySpecDecisionRequest) =>
      client.factory.decideSpec(projectId, itemId, { ...req, version }),
    onSuccess: (_item, req) => {
      toast.success(
        req.decision === "approve"
          ? t("factory.spec.approved")
          : t("factory.spec.changesRequested"),
      );
      setAsking(false);
      setFeedback("");
      void queryClient.invalidateQueries({ queryKey: factoryKeys.all });
    },
    onError: (e: Error) => {
      toast.error(t("factory.spec.recordFailed"), { description: e.message });
      // The spec changed or was decided meanwhile: show it as it is now.
      void queryClient.invalidateQueries({ queryKey: factoryKeys.all });
    },
  });
  const size = compact ? "sm" : "default";
  const text = feedback.trim();
  return (
    <div className="space-y-2" data-testid="spec-decision">
      <div className="flex flex-wrap gap-1.5">
        <Button
          size={size}
          onClick={() => decide.mutate({ decision: "approve" })}
          disabled={decide.isPending}
        >
          <Check /> {t("factory.spec.approve")}
        </Button>
        <Button
          size={size}
          variant={asking ? "secondary" : "outline"}
          onClick={() => setAsking((v) => !v)}
          disabled={decide.isPending}
          aria-expanded={asking}
        >
          <PencilLine /> {t("factory.spec.requestChanges")}
        </Button>
      </div>
      {asking && (
        <div className="space-y-1.5">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={SPEC_FEEDBACK_MAX}
            placeholder={t("factory.spec.placeholder")}
            aria-label={t("factory.spec.feedbackAria")}
            className="min-h-20 text-[13px]"
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => decide.mutate({ decision: "request_changes", feedback: text })}
            disabled={decide.isPending || !text}
          >
            {t("factory.spec.send")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Why a revised analysis decided not to build the feature after all (`factory.spec.notBuilt`). */
const NOT_BUILT = new Set(["already_done", "needs_info", "out_of_scope"]);

/**
 * After a request for changes: the agent revises its analysis while the item is in building;
 * once it stopped, what the revision decided (or that it stopped before one was submitted).
 */
function ChangesRequested({ item, spec }: { item: FactoryItem; spec: SpecApproval }) {
  const { t } = useTranslation();
  const asked = spec.decidedAt
    ? t("factory.spec.askedAgo", { ago: ago(spec.decidedAt) })
    : t("factory.spec.asked");
  const inv = item.investigation;
  const notBuilt = inv?.kind === "analysis" && inv.outcome !== "implement";
  const text =
    item.stage === "building"
      ? t("factory.spec.revising", { asked })
      : notBuilt
        ? t("factory.spec.notBuiltText", {
            asked,
            why: NOT_BUILT.has(inv.outcome)
              ? t(
                  `factory.spec.notBuilt.${inv.outcome as "already_done" | "needs_info" | "out_of_scope"}`,
                )
              : inv.outcome,
          })
        : t("factory.spec.stoppedBefore", { asked });
  return (
    <p className="flex items-start gap-2">
      <MessageSquareWarning className="mt-0.5 size-3.5 shrink-0 text-status-waiting" />
      <span>
        {text}
        {spec.feedback && (
          <span className="mt-1 block text-2xs text-muted-foreground">{spec.feedback}</span>
        )}
      </span>
    </p>
  );
}

/**
 * Where the item's spec is in its approval, on the item page: the decision controls while it
 * waits for you, then what was decided. Nothing for a spec that needed no approval.
 */
export function SpecApprovalCard({ item, projectId }: { item: FactoryItem; projectId: string }) {
  const { t } = useTranslation();
  const spec = item.specApproval;
  if (!spec) return null;
  const waiting = spec.state === "pending" && item.stage === "building";
  return (
    <section data-testid="spec-approval">
      <SectionLabel className="mb-2">{t("factory.spec.title")}</SectionLabel>
      {waiting ? (
        <div className="space-y-3 rounded-xl border border-status-waiting/35 bg-status-waiting/[0.06] p-4 text-[13px]">
          <p className="leading-relaxed">
            <span className="font-medium">{t("factory.spec.waits")}</span>
            <span className="text-muted-foreground">
              {" "}
              {t("factory.spec.waitsHint", { ago: ago(spec.requestedAt) })}
            </span>
          </p>
          {spec.feedback && (
            <p className="text-2xs text-muted-foreground">
              {t("factory.spec.askedEarlier")}{" "}
              <span className="text-foreground">{spec.feedback}</span>
            </p>
          )}
          <SpecDecision projectId={projectId} itemId={item.id} version={spec.requestedAt} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 text-[13px]">
          {spec.state === "changes_requested" ? (
            <ChangesRequested item={item} spec={spec} />
          ) : spec.state === "approved" ? (
            <p className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-status-done" />
              <span>
                {spec.by === "auto"
                  ? t("factory.spec.approvedAuto")
                  : spec.decidedAt
                    ? t("factory.spec.approvedByYouAgo", { ago: ago(spec.decidedAt) })
                    : t("factory.spec.approvedByYou")}
                {spec.rounds > 0 && ` ${t("factory.spec.afterRounds", { count: spec.rounds })}`}
              </span>
            </p>
          ) : (
            <p className="text-muted-foreground">{t("factory.spec.waitingWhenStopped")}</p>
          )}
        </div>
      )}
    </section>
  );
}
