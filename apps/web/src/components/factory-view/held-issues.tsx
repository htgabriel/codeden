import { FACTORY_HOLD_LABEL, type FactoryHeldIssue } from "@codeden/contracts";
import { PauseCircle } from "lucide-react";
import { ago } from "@/lib/format";
import { i18n, useTranslation } from "@/lib/i18n";

/** Why an issue is held, in words: the recorded reason, or the label it carries. */
export function heldReason(h: FactoryHeldIssue): string {
  return h.reason ?? i18n.t("factoryView.held.labelOn", { label: FACTORY_HOLD_LABEL });
}

/**
 * Issues held out of the factory loop (§10.1, Held work), under Intake: each shows "Held", its
 * issue and why. The loop skips them (not taken in, or parked in the queue) until the hold label
 * comes off; each links to its issue on GitHub.
 */
export function HeldIssues({ held }: { held: FactoryHeldIssue[] }) {
  const { t } = useTranslation();
  if (held.length === 0) return null;
  return (
    <div className="flex flex-col gap-1" data-testid="factory-held">
      {held.map((h) => {
        const since = h.since ? ` ${ago(h.since)}` : "";
        const who =
          h.by === "pm"
            ? t("factoryView.held.byPm", { since })
            : h.by === "user"
              ? t("factoryView.held.byYou", { since })
              : "";
        return (
          <a
            key={h.issue.number}
            href={h.issue.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-md border border-dashed border-border px-2 py-1.5 transition-colors hover:bg-accent/60"
            title={t("factoryView.held.title", {
              who,
              reason: heldReason(h),
              label: FACTORY_HOLD_LABEL,
            })}
            data-testid="factory-held-issue"
          >
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <PauseCircle className="size-3 shrink-0" aria-hidden />
              <span className="font-medium">{t("factoryView.held.held")}</span>
              <span className="font-mono">#{h.issue.number}</span>
            </span>
            <span className="mt-1 line-clamp-2 text-[12px] leading-snug font-medium">
              {h.issue.title}
            </span>
            <span className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
              {heldReason(h)}
            </span>
          </a>
        );
      })}
    </div>
  );
}
