import {
  type FactorySpotChecks,
  SPOT_CHECK_WINDOW_DAYS,
  type SpotCheckReason,
  type SpotCheckState,
  spotCheckProblemPercent,
} from "@codeden/contracts";
import { i18n } from "@/lib/i18n";

/**
 * Spot-checks as the factory panel and the item page word them (§10.1): why a merge was set aside,
 * what a person found, the share in force and the share of checks that found a problem.
 */

/**
 * The Spot-checks card's anchor on the project page: `/projects/<id>#spot-checks` (the inbox's
 * Open spot-checks) opens the page scrolled to the card, open.
 */
export const SPOT_CHECKS_ANCHOR = "spot-checks";

/** Why a merge was set aside, in a few words. */
export const SPOT_CHECK_REASON: Record<SpotCheckReason, { label: string; title: string }> = (() => {
  const out = {} as Record<SpotCheckReason, { label: string; title: string }>;
  for (const key of ["sampled", "untrusted_author", "large_change"] as const) {
    out[key] = {
      get label() {
        return i18n.t(`factory.spotReason.${key}.label`);
      },
      get title() {
        return i18n.t(`factory.spotReason.${key}.title`);
      },
    };
  }
  return out;
})();

/** What a person found. */
export const SPOT_CHECK_STATE: Record<SpotCheckState, string> = Object.defineProperties(
  {} as Record<SpotCheckState, string>,
  Object.fromEntries(
    (["pending", "looks_good", "problem"] as const).map((key) => [
      key,
      { get: () => i18n.t(`factory.spotState.${key}`), enumerable: true },
    ]),
  ),
);

/** "10% of automatic merges, plus untrusted-author work and large changes", or that it is off. */
export function spotCheckShareText(percent: number): string {
  if (percent === 0) return i18n.t("factory.spotText.shareOff");
  return i18n.t("factory.spotText.share", { percent });
}

/** "A person found a problem in 1 of 7 checked merges (14%) over 30 days". */
export function spotCheckProblemText(s: Pick<FactorySpotChecks, "checked30d" | "problems30d">) {
  const share = spotCheckProblemPercent(s.checked30d, s.problems30d);
  if (share === null)
    return i18n.t("factory.spotText.noneChecked", { days: SPOT_CHECK_WINDOW_DAYS });
  return i18n.t("factory.spotText.problems", {
    count: s.checked30d,
    problems: s.problems30d,
    share,
    days: SPOT_CHECK_WINDOW_DAYS,
  });
}

/** Whether the panel shows the card: spot-checks are on, or there is something to show. */
export function showSpotChecks(s: FactorySpotChecks): boolean {
  return s.percent > 0 || s.pending.length > 0 || s.recent.length > 0;
}
