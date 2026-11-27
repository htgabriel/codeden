import { type FactoryItemCost, ITEM_BUDGET_WARN, itemBudgetUsed } from "@codeden/contracts";
import { money, tokens } from "@/components/usage/format";
import { i18n } from "@/lib/i18n";

/**
 * A factory work item's cost (§10.1, §12.6) as the Factory view's cards, its side sheet and the
 * item page show it: the same figures and honest labels as the usage reports.
 */

/** The item has usage to show (an agent worked on it). */
export function hasCost(cost: FactoryItemCost | null | undefined): cost is FactoryItemCost {
  return Boolean(cost && cost.turns > 0);
}

/** No turn had a reported cost or a price to estimate one from. */
function notPriced(c: FactoryItemCost): boolean {
  return c.turns > 0 && c.unpricedTurns === c.turns;
}

/** "≈ $12.40" for estimates, "$3.10" when reported, "Not priced" when nothing could be. */
export function costText(c: FactoryItemCost): string {
  return notPriced(c) ? i18n.t("factory.cost.notPriced") : money(c.usd, c.estimatedUsd > 0);
}

/**
 * What kind of figure it is and what it covers: "API-equivalent cost so far (estimated from
 * list prices) · 3 sessions · 42 turns · 4.1M tokens".
 */
export function costTitle(c: FactoryItemCost): string {
  const t = i18n.t;
  if (notPriced(c)) return t("factory.cost.notPricedTitle", { tokens: tokens(c.tokens) });
  const kind = c.apiEquivalent ? t("factory.cost.apiSoFar") : t("factory.cost.soFar");
  const label = c.estimatedUsd > 0 ? t("factory.cost.estimated", { kind }) : kind;
  return [
    label,
    t("factory.cost.sessions", { count: c.sessions }),
    t("factory.cost.turns", { count: c.turns }),
    t("factory.cost.tokens", { tokens: tokens(c.tokens) }),
    c.unpricedTurns > 0 ? t("factory.cost.turnsNotPriced", { count: c.unpricedTurns }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** "≈ $12.40 · 4.1M tokens" for the item's Cost fact. */
export function costFact(c: FactoryItemCost): string {
  return `${costText(c)} · ${i18n.t("factory.cost.tokens", { tokens: tokens(c.tokens) })}`;
}

/**
 * Where the item stands against the per-item cap, since it was last retried: "$9.30 of
 * $15.00", "1.2M of 2M tokens" or both; null without a cap.
 */
export function capText(c: FactoryItemCost | null | undefined): string | null {
  const cap = c?.cap;
  if (!cap) return null;
  return [
    cap.usd !== null
      ? i18n.t("factory.cost.capUsd", { spent: money(cap.spentUsd), cap: money(cap.usd) })
      : null,
    cap.tokens !== null
      ? i18n.t("factory.cost.capTokens", {
          spent: tokens(cap.spentTokens),
          cap: tokens(cap.tokens),
        })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The item is close to (or at) its per-item cap: the Factory view marks its cost. */
export function nearCap(c: FactoryItemCost | null | undefined): boolean {
  const used = itemBudgetUsed(c?.cap ?? null);
  return used !== null && used >= ITEM_BUDGET_WARN;
}
