import type { FactoryLimits, FactoryTuning, MergePolicy } from "@codeden/contracts";
import { useId, useState } from "react";
import { Field } from "@/components/automations/form-bits";
import { NumberField } from "@/components/common/number-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";
import { type AgentsDraft, AgentsTuning } from "./agents-tuning";
import { BudgetFields } from "./budget-fields";
import { wipHelp } from "./meta";
import { type ScoutDraft, ScoutTuning } from "./scout-tuning";
import { SpotCheckField } from "./spot-check-tuning";

/**
 * The tuning knobs the editor exposes. It saves them as a patch, so the rest (review areas, the
 * idle grace) keep their saved values.
 */
export type TuningDraft = AgentsDraft &
  ScoutDraft &
  Pick<
    FactoryTuning,
    | "requireCi"
    | "maxChangedLines"
    | "maxChangedFiles"
    | "auditCommand"
    | "maxFixAttempts"
    | "watchTimeoutMin"
    | "maxOpenPrs"
    | "learnFromReviews"
    | "specApproval"
    | "spotCheckPercent"
  >;

/** The editable tuning knobs of a saved tuning. */
export function tuningDraft(t: FactoryTuning): TuningDraft {
  return {
    maxOpenPrs: t.maxOpenPrs,
    requireCi: t.requireCi,
    maxChangedLines: t.maxChangedLines,
    maxChangedFiles: t.maxChangedFiles,
    auditCommand: t.auditCommand,
    maxFixAttempts: t.maxFixAttempts,
    watchTimeoutMin: t.watchTimeoutMin,
    learnFromReviews: t.learnFromReviews,
    specApproval: t.specApproval,
    spotCheckPercent: t.spotCheckPercent,
    minBacklog: t.minBacklog,
    discoveryIntervalMin: t.discoveryIntervalMin,
    discoveryPerRound: t.discoveryPerRound,
    maxIssuesPerRound: t.maxIssuesPerRound,
    scoutProvider: t.scoutProvider,
    scoutModel: t.scoutModel,
    builderProvider: t.builderProvider,
    builderModel: t.builderModel,
    docsBuilderProvider: t.docsBuilderProvider,
    docsBuilderModel: t.docsBuilderModel,
    reviewerProvider: t.reviewerProvider,
    reviewerModel: t.reviewerModel,
    reviewerFallback: t.reviewerFallback,
  };
}

/** One GitHub login per line (a leading @ is fine), as the limits store them. */
export function parseLogins(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\s,]+/)
        .map((l) => l.trim().replace(/^@/, ""))
        .filter((l) => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})(?:\[bot\])?$/.test(l)),
    ),
  ];
}

const SELECT =
  "h-9 w-full rounded-md border border-border bg-background px-2.5 text-[13px] disabled:opacity-60";

/** True when the limits carry the daily budget factory modes require. */
export function hasBudget(limits: FactoryLimits): boolean {
  return Boolean(limits.dailyBudget.usd || limits.dailyBudget.tokens);
}

/**
 * Factory settings (§10.1), enforced by the server rather than left to agents: who the factory
 * works for (trusted authors) and whether it merges by itself, a daily budget and an optional
 * per-item cap, the agent pool,
 * merges per day, the failure streak that pauses the loop, protected paths and deploys.
 * Optionally the merge-check tuning and, for a dark factory, the scout's limits.
 */
export function LimitsEditor({
  limits,
  onChange,
  tuning,
  onTuningChange,
  githubLogin,
  dark = false,
}: {
  limits: FactoryLimits;
  onChange: (l: FactoryLimits) => void;
  tuning?: TuningDraft;
  onTuningChange?: (t: TuningDraft) => void;
  /** The account CodeDen uses on GitHub (always trusted), when known. */
  githubLogin?: string | null;
  /** Show the dark factory's scout limits. */
  dark?: boolean;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [authors, setAuthors] = useState(() => limits.trustedAuthors.join("\n"));
  return (
    <div className="space-y-4" data-testid="limits-editor">
      <div className="flex items-start gap-2.5 text-xs">
        <Switch
          checked={limits.autoMerge}
          aria-label={t("factory.limits.autoMergeAria")}
          onCheckedChange={(autoMerge) => onChange({ ...limits, autoMerge })}
          className="mt-0.5"
        />
        <span>
          {t("factory.limits.autoMerge")}
          <span className="block text-3xs text-muted-foreground">
            {t("factory.limits.autoMergeHelp")}
          </span>
        </span>
      </div>
      {limits.autoMerge && (
        <Field
          label={t("factory.limits.policy")}
          htmlFor={`${id}-policy`}
          hint={t("factory.limits.policyHint")}
          help={t(`factory.limits.policyHelp.${limits.mergePolicy}`)}
        >
          <select
            id={`${id}-policy`}
            className={SELECT}
            value={limits.mergePolicy}
            onChange={(e) => onChange({ ...limits, mergePolicy: e.target.value as MergePolicy })}
          >
            <option value="fast">{t("factory.limits.policyFast")}</option>
            <option value="strict">{t("factory.limits.policyStrict")}</option>
          </select>
        </Field>
      )}
      {tuning && onTuningChange && (
        <SpotCheckField
          value={tuning.spotCheckPercent}
          dark={dark}
          onChange={(spotCheckPercent) => onTuningChange({ ...tuning, spotCheckPercent })}
        />
      )}
      {!dark && tuning && onTuningChange && (
        <div className="flex items-start gap-2.5 text-xs">
          <Switch
            checked={tuning.specApproval}
            aria-label={t("factory.limits.specApproval")}
            onCheckedChange={(specApproval) => onTuningChange({ ...tuning, specApproval })}
            className="mt-0.5"
          />
          <span>
            {t("factory.limits.specApproval")}
            <span className="block text-3xs text-muted-foreground">
              {t("factory.limits.specApprovalHelp")}
            </span>
          </span>
        </div>
      )}
      <Field
        label={t("factory.limits.trusted")}
        htmlFor={`${id}-authors`}
        help={
          githubLogin
            ? t("factory.limits.trustedHelpLogin", { login: githubLogin })
            : t("factory.limits.trustedHelp")
        }
      >
        <Textarea
          id={`${id}-authors`}
          value={authors}
          placeholder={"octocat\nmy-teammate"}
          onChange={(e) => {
            setAuthors(e.target.value);
            onChange({ ...limits, trustedAuthors: parseLogins(e.target.value) });
          }}
          className="min-h-16 font-mono text-[12.5px]"
        />
      </Field>
      <BudgetFields limits={limits} onChange={onChange} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label={t("factory.limits.agentsAtOnce")}
          htmlFor={`${id}-conc`}
          help={t("factory.limits.agentsAtOnceHelp")}
        >
          <NumberField
            id={`${id}-conc`}
            min={1}
            value={limits.maxConcurrentSessions}
            onChange={(maxConcurrentSessions) => onChange({ ...limits, maxConcurrentSessions })}
            className="text-[13px]"
          />
        </Field>
        <Field
          label={t("factory.limits.mergesPerDay")}
          htmlFor={`${id}-merges`}
          hint={t("factory.limits.mergesPerDayHint")}
        >
          <NumberField
            id={`${id}-merges`}
            min={0}
            value={limits.maxMergesPerDay}
            onChange={(maxMergesPerDay) => onChange({ ...limits, maxMergesPerDay })}
            className="text-[13px]"
          />
        </Field>
        <Field
          label={t("factory.limits.pauseAfter")}
          htmlFor={`${id}-fails`}
          hint={t("factory.limits.pauseAfterHint")}
        >
          <NumberField
            id={`${id}-fails`}
            min={1}
            value={limits.pauseAfterConsecutiveFailures}
            onChange={(pauseAfterConsecutiveFailures) =>
              onChange({ ...limits, pauseAfterConsecutiveFailures })
            }
            className="text-[13px]"
          />
        </Field>
      </div>
      {tuning && onTuningChange && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label={t("factory.limits.openPrs")}
            htmlFor={`${id}-open-prs`}
            hint={wipHelp()}
            help={t("factory.limits.openPrsHelp")}
          >
            <NumberField
              id={`${id}-open-prs`}
              optional
              min={1}
              value={tuning.maxOpenPrs}
              placeholder={t("factory.limits.openPrsPlaceholder", {
                n: limits.maxConcurrentSessions,
              })}
              onChange={(maxOpenPrs) => onTuningChange({ ...tuning, maxOpenPrs })}
              className="text-[13px]"
            />
          </Field>
        </div>
      )}
      <Field
        label={t("factory.limits.protectedPaths")}
        htmlFor={`${id}-paths`}
        help={t("factory.limits.protectedPathsHelp")}
      >
        <Textarea
          id={`${id}-paths`}
          value={limits.protectedPaths.join("\n")}
          placeholder={"**/auth/**\ninfra/**"}
          onChange={(e) =>
            onChange({
              ...limits,
              protectedPaths: e.target.value
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean),
            })
          }
          className="min-h-20 font-mono text-[12.5px]"
        />
      </Field>
      <div className="flex items-start gap-2.5 text-xs">
        <Switch
          checked={limits.allowDeploys}
          aria-label={t("factory.limits.allowDeploysAria")}
          onCheckedChange={(allowDeploys) => onChange({ ...limits, allowDeploys })}
          className="mt-0.5"
        />
        <span>
          {t("factory.limits.allowDeploys")}
          <span className="block text-3xs text-muted-foreground">
            {t("factory.limits.allowDeploysHelp")}
          </span>
        </span>
      </div>
      {dark && tuning && onTuningChange && (
        <ScoutTuning tuning={tuning} onChange={onTuningChange} />
      )}
      {tuning && onTuningChange && (
        <div className="space-y-3 border-t border-border pt-4" data-testid="merge-check-tuning">
          <div>
            <p className="text-[13px] font-medium">{t("factory.limits.checks")}</p>
            <p className="text-3xs text-muted-foreground">{t("factory.limits.checksHelp")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("factory.limits.maxLines")}
              htmlFor={`${id}-lines`}
              help={t("factory.limits.maxLinesHelp")}
            >
              <NumberField
                id={`${id}-lines`}
                optional
                min={1}
                value={tuning.maxChangedLines}
                placeholder={t("factory.limits.noLimit")}
                onChange={(maxChangedLines) => onTuningChange({ ...tuning, maxChangedLines })}
                className="text-[13px]"
              />
            </Field>
            <Field
              label={t("factory.limits.maxFiles")}
              htmlFor={`${id}-files`}
              help={t("factory.limits.maxFilesHelp")}
            >
              <NumberField
                id={`${id}-files`}
                optional
                min={1}
                value={tuning.maxChangedFiles}
                placeholder={t("factory.limits.noLimit")}
                onChange={(maxChangedFiles) => onTuningChange({ ...tuning, maxChangedFiles })}
                className="text-[13px]"
              />
            </Field>
          </div>
          <p className="text-3xs text-muted-foreground">{t("factory.limits.overLimit")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("factory.limits.reviseRounds")}
              htmlFor={`${id}-fixes`}
              hint={t("factory.limits.reviseRoundsHint")}
            >
              <NumberField
                id={`${id}-fixes`}
                min={0}
                value={tuning.maxFixAttempts}
                onChange={(maxFixAttempts) => onTuningChange({ ...tuning, maxFixAttempts })}
                className="text-[13px]"
              />
            </Field>
            <Field
              label={t("factory.limits.watch")}
              htmlFor={`${id}-watch`}
              hint={t("factory.limits.watchHint")}
            >
              <NumberField
                id={`${id}-watch`}
                min={1}
                value={tuning.watchTimeoutMin}
                onChange={(watchTimeoutMin) => onTuningChange({ ...tuning, watchTimeoutMin })}
                className="text-[13px]"
              />
            </Field>
          </div>
          <div className="flex items-start gap-2.5 text-xs">
            <Switch
              checked={tuning.requireCi}
              aria-label={t("factory.limits.requireCi")}
              onCheckedChange={(requireCi) => onTuningChange({ ...tuning, requireCi })}
            />
            <span>
              {t("factory.limits.requireCi")}
              <span className="block text-3xs text-muted-foreground">
                {t("factory.limits.requireCiHelp")}
              </span>
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs">
            <Switch
              checked={tuning.learnFromReviews}
              aria-label={t("factory.limits.learn")}
              onCheckedChange={(learnFromReviews) =>
                onTuningChange({ ...tuning, learnFromReviews })
              }
            />
            <span>
              {t("factory.limits.learn")}
              <span className="block text-3xs text-muted-foreground">
                {t("factory.limits.learnHelp")}
              </span>
            </span>
          </div>
          <Field
            label={t("factory.limits.audit")}
            htmlFor={`${id}-audit`}
            help={t("factory.limits.auditHelp")}
          >
            <Input
              id={`${id}-audit`}
              value={tuning.auditCommand ?? ""}
              placeholder="pnpm audit --prod"
              onChange={(e) =>
                onTuningChange({ ...tuning, auditCommand: e.target.value.trim() || null })
              }
              className="font-mono text-[12.5px]"
            />
          </Field>
        </div>
      )}
      {tuning && onTuningChange && (
        <AgentsTuning value={tuning} onChange={(a) => onTuningChange({ ...tuning, ...a })} />
      )}
    </div>
  );
}
