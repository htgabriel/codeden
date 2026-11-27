import type { FactoryTuning } from "@codeden/contracts";
import { useId } from "react";
import { Field } from "@/components/automations/form-bits";
import { InfoHint } from "@/components/common/info-hint";
import { NumberField } from "@/components/common/number-field";
import { i18n, useTranslation } from "@/lib/i18n";
import { AgentPicker } from "./agents-tuning";
import { reviewAreasHelp, scoutHelp } from "./meta";

/** The scout's knobs (dark factory). */
export type ScoutDraft = Pick<
  FactoryTuning,
  | "minBacklog"
  | "discoveryIntervalMin"
  | "discoveryPerRound"
  | "maxIssuesPerRound"
  | "scoutProvider"
  | "scoutModel"
>;

/** What the backlog threshold means, for its hint and the scout's description. */
export function backlogHelp(minBacklog: number): string {
  return minBacklog === 0
    ? i18n.t("factory.scoutTuning.backlogOff")
    : i18n.t("factory.scoutTuning.backlogOn", { low: queueLow(minBacklog) });
}

/** "fewer than 3 issues wait", or "no issue waits" for a threshold of 1. */
function queueLow(minBacklog: number): string {
  return minBacklog === 1
    ? i18n.t("factory.scoutTuning.noneWaits")
    : i18n.t("factory.scoutTuning.fewerWait", { n: minBacklog });
}

/** The dark factory's scout limits in the factory settings. */
export function ScoutTuning<T extends ScoutDraft>({
  tuning,
  onChange,
}: {
  tuning: T;
  onChange: (t: T) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="space-y-3 border-t border-border pt-4" data-testid="scout-tuning">
      <div>
        <p className="flex items-center gap-1 text-[13px] font-medium">
          {t("factory.scoutTuning.title")}
          <InfoHint label={t("factory.scoutTuning.titleLabel")}>{scoutHelp()}</InfoHint>
        </p>
        <p className="text-3xs text-muted-foreground">
          {t("factory.scoutTuning.intro", {
            when:
              tuning.minBacklog === 0
                ? t("factory.scoutTuning.whenRunNow")
                : t("factory.scoutTuning.whenScheduled", { low: queueLow(tuning.minBacklog) }),
          })}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("factory.scoutTuning.reviewWhen")}
          htmlFor={`${id}-backlog`}
          hint={backlogHelp(tuning.minBacklog)}
          help={
            tuning.minBacklog === 0
              ? t("factory.scoutTuning.reviewWhenOff")
              : t("factory.scoutTuning.reviewWhenHelp", { count: tuning.minBacklog })
          }
        >
          <NumberField
            id={`${id}-backlog`}
            min={0}
            value={tuning.minBacklog}
            onChange={(minBacklog) => onChange({ ...tuning, minBacklog })}
            className="text-[13px]"
          />
        </Field>
        <Field
          label={t("factory.scoutTuning.every")}
          htmlFor={`${id}-every`}
          hint={`${t("factory.scoutTuning.everyHint")} ${
            tuning.minBacklog === 0
              ? t("factory.scoutTuning.everyOff")
              : t("factory.scoutTuning.everyWaits", { low: queueLow(tuning.minBacklog) })
          }`}
        >
          <NumberField
            id={`${id}-every`}
            min={1}
            value={Math.round(tuning.discoveryIntervalMin / 60)}
            onChange={(hours) => onChange({ ...tuning, discoveryIntervalMin: hours * 60 })}
            className="text-[13px]"
          />
        </Field>
        <Field
          label={t("factory.scoutTuning.areas")}
          htmlFor={`${id}-areas`}
          hint={reviewAreasHelp()}
        >
          <NumberField
            id={`${id}-areas`}
            min={0}
            max={8}
            value={tuning.discoveryPerRound}
            onChange={(discoveryPerRound) => onChange({ ...tuning, discoveryPerRound })}
            className="text-[13px]"
          />
        </Field>
        <Field
          label={t("factory.scoutTuning.issues")}
          htmlFor={`${id}-issues`}
          hint={t("factory.scoutTuning.issuesHint")}
        >
          <NumberField
            id={`${id}-issues`}
            min={1}
            value={tuning.maxIssuesPerRound}
            onChange={(maxIssuesPerRound) => onChange({ ...tuning, maxIssuesPerRound })}
            className="text-[13px]"
          />
        </Field>
        <AgentPicker
          id={`${id}-agent`}
          label={t("factory.badge.scout")}
          provider={tuning.scoutProvider}
          model={tuning.scoutModel}
          hint={t("factory.scoutTuning.agentHint")}
          meanwhile={t("factory.scoutTuning.agentMeanwhile")}
          onChange={(scoutProvider, scoutModel) =>
            onChange({ ...tuning, scoutProvider, scoutModel })
          }
        />
      </div>
    </div>
  );
}
