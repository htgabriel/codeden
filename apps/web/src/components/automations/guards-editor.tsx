import type { AutomationGuards, OverlapPolicy } from "@codeden/contracts";
import { useId } from "react";
import { NumberField } from "@/components/common/number-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";
import { Field, Segmented } from "./form-bits";
import { OVERLAP_HELP, OVERLAP_LABEL } from "./meta";

const POLICIES: OverlapPolicy[] = ["skip-if-running", "queue", "run-anyway"];

/**
 * Guards (§10, §8.4): overlap policy for the work-key check, concurrency cap, quiet hours,
 * a daily maximum and catching up a missed run after downtime.
 */
export function GuardsEditor({
  guards,
  onChange,
  disabled,
  projectTimezone,
}: {
  guards: AutomationGuards;
  onChange: (g: AutomationGuards) => void;
  disabled?: boolean;
  projectTimezone: string;
}) {
  const { t } = useTranslation();
  const id = useId();
  const quiet = guards.quietHours;
  return (
    <div className="space-y-4">
      <Field label={t("automations.guards.whenMatching")} help={OVERLAP_HELP[guards.overlapPolicy]}>
        <Segmented
          label={t("automations.guards.overlapPolicy")}
          value={guards.overlapPolicy}
          disabled={disabled}
          onChange={(overlapPolicy) => onChange({ ...guards, overlapPolicy })}
          options={POLICIES.map((p) => ({ id: p, label: OVERLAP_LABEL[p] }))}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("automations.guards.concurrent")}
          htmlFor={`${id}-conc`}
          help={t("automations.guards.concurrentHelp")}
        >
          <NumberField
            id={`${id}-conc`}
            min={1}
            value={guards.maxConcurrent}
            disabled={disabled}
            onChange={(maxConcurrent) => onChange({ ...guards, maxConcurrent })}
            className="w-28 text-[13px]"
          />
        </Field>
        <Field
          label={t("automations.guards.perDay")}
          htmlFor={`${id}-day`}
          help={t("automations.guards.perDayHelp")}
        >
          <NumberField
            id={`${id}-day`}
            optional
            min={1}
            value={guards.maxPerDay}
            placeholder={t("automations.guards.noLimit")}
            disabled={disabled}
            onChange={(maxPerDay) => onChange({ ...guards, maxPerDay })}
            className="w-28 text-[13px]"
          />
        </Field>
      </div>
      <Field
        label={t("automations.guards.quietHours")}
        help={t("automations.guards.quietHelp", { tz: quiet?.timezone ?? projectTimezone })}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Switch
            checked={quiet !== null}
            disabled={disabled}
            aria-label={t("automations.guards.quietHours")}
            onCheckedChange={(on) =>
              onChange({ ...guards, quietHours: on ? { start: "22:00", end: "07:00" } : null })
            }
          />
          {quiet && (
            <>
              <Input
                type="time"
                aria-label={t("automations.guards.quietFrom")}
                value={quiet.start}
                disabled={disabled}
                onChange={(e) =>
                  onChange({ ...guards, quietHours: { ...quiet, start: e.target.value } })
                }
                className="w-28 text-[13px]"
              />
              <span className="text-2xs text-muted-foreground">{t("automations.guards.to")}</span>
              <Input
                type="time"
                aria-label={t("automations.guards.quietUntil")}
                value={quiet.end}
                disabled={disabled}
                onChange={(e) =>
                  onChange({ ...guards, quietHours: { ...quiet, end: e.target.value } })
                }
                className="w-28 text-[13px]"
              />
            </>
          )}
        </div>
      </Field>
      <div className="flex items-start gap-2.5 text-xs">
        <Switch
          checked={guards.catchUpMissed}
          aria-label={t("automations.guards.catchUp")}
          disabled={disabled}
          onCheckedChange={(catchUpMissed) => onChange({ ...guards, catchUpMissed })}
          className="mt-0.5"
        />
        <span>
          {t("automations.guards.catchUp")}
          <span className="block text-3xs text-muted-foreground">
            {t("automations.guards.catchUpHelp")}
          </span>
        </span>
      </div>
    </div>
  );
}
