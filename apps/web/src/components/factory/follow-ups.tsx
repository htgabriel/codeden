import type {
  AutonomyMode,
  FactoryFollowUp,
  FactoryItem,
  FollowUpDropReason,
  FollowUpSeverity,
  ReviewFollowUp,
} from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleDot, FilePlus } from "lucide-react";
import { toast } from "sonner";
import { SectionLabel } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { useClient } from "@/lib/api";
import { factoryKeys } from "@/lib/factory";
import { useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";
import { cn } from "@/lib/utils";

/**
 * The reviewer's follow-ups on the factory item page (§10.1): non-blocking findings that never
 * hold up the merge. Before the merge they are listed from the verdict; once it merged, each
 * shows the issue that tracks it, or "File issue" (a dark factory holds them for its scout or
 * files them by itself), with whether it is held for the scout or was dropped from that list.
 */

export const SEVERITY_TONE: Record<FollowUpSeverity, string> = {
  high: "border-status-failed/40 text-status-failed",
  medium: "border-status-waiting/40 text-status-waiting",
  low: "border-border text-muted-foreground",
};

/** A severity as shown on a follow-up's pill (`factory.followUps.severity.<severity>`). */
export function SeverityText({ severity }: { severity: FollowUpSeverity }) {
  const { t } = useTranslation();
  return <>{t(`factory.followUps.severity.${severity}`)}</>;
}

function Facts({ f }: { f: ReviewFollowUp }) {
  if (!f.severity && !f.area) return null;
  return (
    <span className="flex shrink-0 items-center gap-1">
      {f.severity && (
        <span className={cn("rounded-full border px-1.5 text-3xs", SEVERITY_TONE[f.severity])}>
          <SeverityText severity={f.severity} />
        </span>
      )}
      {f.area && (
        <span className="rounded-full border border-border px-1.5 font-mono text-3xs text-muted-foreground">
          {f.area}
        </span>
      )}
    </span>
  );
}

export function FollowUps({
  item,
  projectId,
  mode,
}: {
  item: FactoryItem;
  projectId: string;
  mode: AutonomyMode;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const file = useMutation({
    mutationFn: (index: number) => client.factory.fileFollowUp(projectId, item.id, index),
    onSuccess: (next, index) => {
      const issue = next.followUps[index]?.issue;
      toast.success(
        issue
          ? t("factory.followUps.filedAs", { number: issue.number })
          : t("factory.followUps.filed"),
      );
      void queryClient.invalidateQueries({ queryKey: factoryKeys.all });
    },
    onError: (e: Error) =>
      toast.error(t("factory.followUps.fileFailed"), { description: e.message }),
  });
  const merged = item.followUps.length > 0;
  const listed: Array<ReviewFollowUp & Partial<FactoryFollowUp>> = merged
    ? item.followUps
    : (item.review?.followUps ?? []);
  if (listed.length === 0) return null;
  return (
    <section data-testid="follow-ups">
      <SectionLabel className="mb-2">{t("factory.followUps.title")}</SectionLabel>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {listed.map((f, index) => {
          const issue = f.issue ?? null;
          return (
            <div
              key={f.title}
              className="flex items-center gap-3 border-b border-border px-3.5 py-2.5 text-[13px] last:border-0"
            >
              <span className="min-w-0 flex-1">{f.title}</span>
              <Facts f={f} />
              {merged && !issue && (f.dropped || f.heldAt) && (
                <span
                  className="shrink-0 text-3xs text-muted-foreground"
                  title={
                    f.dropped
                      ? t("factory.followUps.droppedTitle")
                      : t("factory.followUps.heldTitle")
                  }
                >
                  {f.dropped
                    ? t(`factory.followUps.dropped.${f.dropped.reason}`)
                    : t("factory.followUps.held")}
                </span>
              )}
              {merged &&
                (issue ? (
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 text-2xs text-primary hover:underline"
                    onClick={() => platform.openExternal(issue.url)}
                  >
                    <CircleDot className="size-3" />#{issue.number}
                  </button>
                ) : (
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={file.isPending}
                    onClick={() => file.mutate(index)}
                  >
                    <FilePlus /> {t("factory.followUps.fileIssue")}
                  </Button>
                ))}
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-3xs text-muted-foreground">
        {merged
          ? mode === "dark_factory"
            ? t("factory.followUps.mergedDark")
            : t("factory.followUps.merged")
          : mode === "dark_factory"
            ? t("factory.followUps.pendingDark")
            : t("factory.followUps.pending")}
      </p>
    </section>
  );
}
