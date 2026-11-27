import { GitPullRequest } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { prRequestedHint } from "@/lib/pull-request";
import { useLayoutStore } from "@/stores/layout";
import { useAskForPullRequest, usePullRequestOffer } from "./open-pr";

/**
 * The disabled "PR requested" control that replaces **Open PR** while a request is in progress.
 * A disabled button takes no pointer events, so the wrapper carries the hover text: queued
 * behind the running turn, or being opened.
 */
export function PrRequestedButton({
  requested,
  size,
  variant,
}: {
  requested: "queued" | "sent";
  size: "xs" | "sm";
  variant?: "ghost";
}) {
  const { t } = useTranslation();
  return (
    <span title={prRequestedHint(requested)} className="inline-flex">
      <Button size={size} variant={variant} disabled>
        <GitPullRequest /> {t("workbench.git.prRequested")}
      </Button>
    </span>
  );
}

/**
 * The Push toast's action, kept live: **Open PR**, "PR requested" while a request is in
 * progress (pressed here, in the Git bar or in the Issue / PR tab), or the session's open PR.
 */
export function PushToastPrAction({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation();
  const offer = usePullRequestOffer(sessionId);
  const askForPr = useAskForPullRequest(sessionId);
  const openTab = useLayoutStore((s) => s.openRightTab);
  if (offer.pr) {
    return (
      <button type="button" data-button data-action onClick={() => openTab("github")}>
        {t("workbench.git.viewPr", { number: offer.pr.number })}
      </button>
    );
  }
  if (offer.requested) {
    return (
      <span title={prRequestedHint(offer.requested)} className="inline-flex">
        <button
          type="button"
          data-button
          data-action
          disabled
          className="opacity-60"
          style={{ cursor: "default" }}
        >
          {t("workbench.git.prRequested")}
        </button>
      </span>
    );
  }
  if (!offer.canAsk) return null;
  return (
    <button type="button" data-button data-action onClick={askForPr}>
      {t("workbench.git.openPr")}
    </button>
  );
}
