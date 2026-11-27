import type { FactoryItem } from "@codeden/contracts";
import { Check, Eye, TriangleAlert } from "lucide-react";
import { SectionLabel } from "@/components/common/bits";
import { ago } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";
import { FileSpotCheckIssueButton, OpenPrButton, SpotCheckDecision } from "./spot-check-actions";
import { SPOT_CHECK_REASON } from "./spot-checks";

/**
 * The item page's spot-check (§10.1): why its merge was set aside for a person's look, and what
 * they found, with the same actions as the factory panel's Spot-checks list. Nothing for a merge
 * that wasn't set aside.
 */
export function SpotCheckSection({ item, projectId }: { item: FactoryItem; projectId: string }) {
  const { t } = useTranslation();
  const check = item.spotCheck;
  if (!check) return null;
  const reason = SPOT_CHECK_REASON[check.reason];
  return (
    <section data-testid="spot-check">
      <SectionLabel className="mb-2">{t("factory.spotSection.title")}</SectionLabel>
      <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-[13px]">
        {check.state === "pending" ? (
          <>
            <p className="flex items-start gap-2">
              <Eye className="mt-0.5 size-3.5 shrink-0 text-status-waiting" />
              <span>
                <span className="font-medium">{t("factory.spotSection.setAside")}</span>
                <span className="text-muted-foreground">
                  {" "}
                  {t("factory.spotSection.setAsideHint", {
                    reason: reason.label.toLowerCase(),
                    ago: ago(check.sampledAt),
                  })}
                </span>
              </span>
            </p>
            <div className="flex flex-wrap gap-1">
              {item.pr && (
                <OpenPrButton
                  projectId={projectId}
                  pr={item.pr}
                  itemId={item.id}
                  title={item.title}
                />
              )}
              <SpotCheckDecision projectId={projectId} itemId={item.id} title={item.title} />
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2">
            {check.state === "problem" ? (
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-status-failed" />
            ) : (
              <Check className="mt-0.5 size-3.5 shrink-0 text-status-done" />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p>
                {check.state === "problem"
                  ? t("factory.spotSection.foundProblem")
                  : t("factory.spotSection.looksGood")}
                <span className="text-muted-foreground">
                  {check.checkedAt && ` · ${ago(check.checkedAt)}`} · {reason.label.toLowerCase()}
                </span>
              </p>
              {check.note && (
                <p className="text-2xs whitespace-pre-wrap text-muted-foreground">{check.note}</p>
              )}
              {check.state === "problem" &&
                (check.issue ? (
                  <button
                    type="button"
                    className="text-2xs text-muted-foreground hover:text-foreground hover:underline"
                    onClick={() => check.issue && platform.openExternal(check.issue.url)}
                  >
                    {t("factory.spotSection.followUp", { number: check.issue.number })}
                  </button>
                ) : (
                  <FileSpotCheckIssueButton projectId={projectId} itemId={item.id} />
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
