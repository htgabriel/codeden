import type { FactoryLimits } from "@codeden/contracts";
import { useId } from "react";
import { Field } from "@/components/automations/form-bits";
import { NumberField } from "@/components/common/number-field";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";

type Budget = FactoryLimits["dailyBudget"];

/** A budget with the amounts left empty removed (none set is no budget). */
function setBudget(budget: Budget, patch: Partial<Budget>): Budget {
  const next = { ...budget, ...patch };
  for (const k of ["usd", "tokens"] as const) if (!next[k]) delete next[k];
  return next;
}

/** One budget as a pair of fields: USD and tokens, either or both. */
function BudgetPair({
  label,
  budget,
  onChange,
  usdHelp,
  tokensHelp,
  usdPlaceholder,
  tokensPlaceholder,
}: {
  label: string;
  budget: Budget;
  onChange: (b: Budget) => void;
  usdHelp: string;
  tokensHelp: string;
  usdPlaceholder: string;
  tokensPlaceholder: string;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t("factory.budget.usd", { label })} htmlFor={`${id}-usd`} help={usdHelp}>
        <NumberField
          id={`${id}-usd`}
          decimal
          optional
          min={0}
          value={budget.usd}
          placeholder={usdPlaceholder}
          onChange={(usd) => onChange(setBudget(budget, { usd: usd || undefined }))}
          className="text-[13px]"
        />
      </Field>
      <Field label={t("factory.budget.tokens", { label })} htmlFor={`${id}-tok`} help={tokensHelp}>
        <NumberField
          id={`${id}-tok`}
          optional
          min={0}
          value={budget.tokens}
          placeholder={tokensPlaceholder}
          onChange={(tokens) => onChange(setBudget(budget, { tokens: tokens || undefined }))}
          className="text-[13px]"
        />
      </Field>
    </div>
  );
}

/**
 * The factory's spend limits (§10.1): the daily budget (required in factory modes), what counts
 * against it, and the optional per-item cap.
 */
export function BudgetFields({
  limits,
  onChange,
}: {
  limits: FactoryLimits;
  onChange: (l: FactoryLimits) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <BudgetPair
        label={t("factory.budget.daily")}
        budget={limits.dailyBudget}
        onChange={(dailyBudget) => onChange({ ...limits, dailyBudget })}
        usdHelp={t("factory.budget.dailyHelp")}
        tokensHelp={t("factory.budget.tokensHelp")}
        usdPlaceholder={t("factory.budget.usdPlaceholder")}
        tokensPlaceholder={t("factory.budget.tokensPlaceholder")}
      />
      <div className="flex items-start gap-2.5 text-xs">
        <Switch
          checked={limits.budgetScope === "project"}
          aria-label={t("factory.budget.scopeAria")}
          onCheckedChange={(all) =>
            onChange({ ...limits, budgetScope: all ? "project" : "factory" })
          }
          className="mt-0.5"
        />
        <span>
          {t("factory.budget.scope")}
          <span className="block text-3xs text-muted-foreground">
            {t("factory.budget.scopeHelp")}
          </span>
        </span>
      </div>
      <BudgetPair
        label={t("factory.budget.item")}
        budget={limits.itemBudget}
        onChange={(itemBudget) => onChange({ ...limits, itemBudget })}
        usdHelp={t("factory.budget.itemHelp")}
        tokensHelp={t("factory.budget.tokensHelp")}
        usdPlaceholder={t("factory.budget.noCap")}
        tokensPlaceholder={t("factory.budget.noCap")}
      />
    </>
  );
}
