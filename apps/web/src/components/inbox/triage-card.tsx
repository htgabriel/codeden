import type { InboxItem, TriageDecisionResponse } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Check, CircleDot, ExternalLink, Filter, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";

/** "Should I take this on? #12 Fix the login" -> the issue title part. */
function questionOf(item: InboxItem): string {
  return item.title.replace(/^Should I take this on\?\s*/, "") || item.title;
}

/**
 * A triage decision (§10, §11.1): the PM classified a new issue as ready and asks whether to
 * take it on. Shows its classification and rationale; accept starts a session for the issue,
 * decline closes the decision with an optional reason.
 */
export function TriageCard({ item }: { item: InboxItem }) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const open = item.status === "open";
  const fail = (e: Error) => toast.error(t("triage.recordFailed"), { description: e.message });

  const onAccepted = (res: TriageDecisionResponse) => {
    const start = res.start;
    if (start?.status === "conflict") {
      void queryClient.invalidateQueries({ queryKey: ["conflicts"] });
      toast.warning(t("triage.conflict"), {
        description: t("triage.conflictHint"),
      });
      return;
    }
    const sessionId = start && "sessionId" in start ? start.sessionId : null;
    toast.success(start?.status === "queued" ? t("triage.queued") : t("triage.taking"), {
      action: sessionId
        ? {
            label: t("triage.openSession"),
            onClick: () => void navigate({ to: "/sessions/$sessionId", params: { sessionId } }),
          }
        : undefined,
    });
  };
  const accept = useMutation({
    mutationFn: () => client.automations.acceptTriage(item.id),
    onSuccess: onAccepted,
    onError: fail,
  });
  const decline = useMutation({
    mutationFn: () =>
      client.automations.declineTriage(item.id, reason.trim() ? { reason: reason.trim() } : {}),
    onSuccess: () => toast.success(t("triage.declinedToast")),
    onError: fail,
  });
  const busy = accept.isPending || decline.isPending;

  return (
    <div className="rounded-xl border border-border bg-card" data-testid="triage-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-2xs">
        <Filter className="size-3.5 text-primary" />
        <span className="font-semibold tracking-wider text-primary uppercase">
          {t("triage.heading")}
        </span>
        <span
          className="ml-auto rounded-full bg-status-done/12 px-2 py-px font-medium text-status-done"
          data-testid="triage-classification"
          title={t("triage.classificationTitle")}
        >
          {t("triage.classification")}
        </span>
      </div>
      <div className="space-y-3 px-4 py-3">
        <div className="flex items-start gap-2">
          <CircleDot className="mt-0.5 size-4 shrink-0 text-status-done" />
          <h3 className="min-w-0 flex-1 text-[14px] font-medium">{questionOf(item)}</h3>
          {item.issue && (
            <Button
              size="xs"
              variant="ghost"
              className="shrink-0 text-muted-foreground"
              onClick={() => item.issue && platform.openExternal(item.issue.url)}
            >
              <ExternalLink /> {t("triage.issue")}
            </Button>
          )}
        </div>
        {item.body && (
          <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="text-3xs font-medium tracking-wider text-muted-foreground uppercase">
              {t("triage.rationale")}
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" data-testid="triage-rationale">
              {item.body}
            </p>
          </div>
        )}
        {!open ? (
          <p className="text-2xs text-muted-foreground">
            {item.status === "resolved" ? t("triage.accepted") : t("triage.declined")}
          </p>
        ) : declining ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("triage.reasonPlaceholder")}
              aria-label={t("triage.reasonLabel")}
              className="h-8 text-[13px]"
            />
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => decline.mutate()}
            >
              {t("triage.decline")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeclining(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" onClick={() => accept.mutate()} disabled={busy}>
              <Check /> {accept.isPending ? t("triage.starting") : t("triage.takeItOn")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setDeclining(true)}
              disabled={busy}
            >
              <X /> {t("triage.declineEllipsis")}
            </Button>
            <span className="ml-auto text-3xs text-muted-foreground">
              {t("triage.takeItOnHint")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
