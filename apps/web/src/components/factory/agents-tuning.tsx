import type { FactoryTuning, ProviderInfo, ReviewerFallback, SetupCheck } from "@codeden/contracts";
import { type ReactNode, useId } from "react";
import { Field } from "@/components/automations/form-bits";
import {
  lowerFirst,
  providerAvailability,
  providerOptionLabel,
  TOO_OLD,
} from "@/components/composer/model-picker/logic";
import { useTranslation } from "@/lib/i18n";
import { useSetupStatus, useSnapshotData } from "@/lib/queries";

/** The agent knobs of the factory's tuning: who builds and who reviews, on which model. */
export type AgentsDraft = Pick<
  FactoryTuning,
  | "builderProvider"
  | "builderModel"
  | "docsBuilderProvider"
  | "docsBuilderModel"
  | "reviewerProvider"
  | "reviewerModel"
  | "reviewerFallback"
>;

/** The fallbacks in menu order (`factory.agents.fallback.<id>`); `factory.agents.meanwhile.<id>`
 * says what a review does while its chosen provider can't run. */
const FALLBACKS: ReviewerFallback[] = ["builder", "any", "wait"];

const SELECT =
  "h-9 w-full rounded-md border border-border bg-background px-2.5 text-[13px] disabled:opacity-60";

/**
 * Builder, docs builder and reviewer provider and model (§10.1), from the runner's provider
 * list. `Automatic` keeps the defaults: builders on the project's provider, reviewers on a
 * different provider from the builder's; docs build like everything else until a docs builder is
 * chosen. A model applies only to a chosen provider. Providers that can't run (from the setup
 * checks) say why, and choosing one says what happens until it can.
 */
export function AgentsTuning({
  value,
  onChange,
}: {
  value: AgentsDraft;
  onChange: (next: AgentsDraft) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="space-y-3 border-t border-border pt-4" data-testid="agents-tuning">
      <div>
        <p className="text-[13px] font-medium">{t("factory.agents.title")}</p>
        <p className="text-3xs text-muted-foreground">{t("factory.agents.intro")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <AgentPicker
          id={`${id}-b`}
          label={t("factory.agents.builder")}
          provider={value.builderProvider}
          model={value.builderModel}
          meanwhile={t("factory.agents.builderMeanwhile")}
          onChange={(builderProvider, builderModel) =>
            onChange({ ...value, builderProvider, builderModel })
          }
        />
        <AgentPicker
          id={`${id}-d`}
          label={t("factory.agents.docsBuilder")}
          provider={value.docsBuilderProvider ?? ""}
          model={value.docsBuilderModel}
          autoValue=""
          autoLabel={t("factory.agents.sameAsBuilders")}
          hint={t("factory.agents.docsHint")}
          meanwhile={t("factory.agents.docsMeanwhile")}
          onChange={(provider, docsBuilderModel) =>
            onChange({ ...value, docsBuilderProvider: provider || null, docsBuilderModel })
          }
        />
        <AgentPicker
          id={`${id}-r`}
          label={t("factory.agents.reviewer")}
          provider={value.reviewerProvider}
          model={value.reviewerModel}
          autoLabel={t("factory.agents.reviewerAuto")}
          meanwhile={t(`factory.agents.meanwhile.${value.reviewerFallback}`)}
          onChange={(reviewerProvider, reviewerModel) =>
            onChange({ ...value, reviewerProvider, reviewerModel })
          }
        />
      </div>
      <Field
        label={t("factory.agents.fallbackLabel")}
        htmlFor={`${id}-fb`}
        hint={t("factory.agents.fallbackHint")}
      >
        <select
          id={`${id}-fb`}
          className={SELECT}
          value={value.reviewerFallback}
          onChange={(e) =>
            onChange({ ...value, reviewerFallback: e.target.value as ReviewerFallback })
          }
        >
          {FALLBACKS.map((f) => (
            <option key={f} value={f}>
              {t(`factory.agents.fallback.${f}`)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

/**
 * A "<label> provider" picker and its "<label> model" picker, side by side in the settings grid.
 * Changing the provider resets the model to the provider's default.
 */
export function AgentPicker({
  id,
  label,
  provider,
  model,
  autoValue = "auto",
  autoLabel,
  hint,
  meanwhile,
  onChange,
}: {
  id: string;
  /** "Builder": the pickers read "Builder provider" and "Builder model". */
  label: string;
  provider: string;
  model: string | null;
  /** The value of the first option, which keeps the default ("auto"). */
  autoValue?: string;
  autoLabel?: string;
  hint?: string;
  /** What happens while the chosen provider can't run, e.g. "reviews wait". */
  meanwhile: string;
  onChange: (provider: string, model: string | null) => void;
}) {
  const { t } = useTranslation();
  const providers = useSnapshotData((s) => s.runner.providers, []);
  const checks = useSetupStatus({ staleTime: 60_000 }).data?.checks;
  return (
    <>
      <ProviderSelect
        id={`${id}p`}
        label={t("factory.agents.providerLabel", { label })}
        providers={providers}
        checks={checks}
        value={provider}
        autoValue={autoValue}
        autoLabel={autoLabel}
        hint={hint}
        meanwhile={meanwhile}
        onChange={(next) => onChange(next, null)}
      />
      <ModelSelect
        id={`${id}m`}
        label={t("factory.agents.modelLabel", { label })}
        provider={providers.find((p) => p.id === provider)}
        value={model}
        onChange={(next) => onChange(provider, next)}
      />
    </>
  );
}

function ProviderSelect({
  id,
  label,
  providers,
  checks,
  value,
  autoValue = "auto",
  autoLabel,
  hint,
  meanwhile,
  onChange,
}: {
  id: string;
  label: string;
  providers: ProviderInfo[];
  checks: readonly SetupCheck[] | undefined;
  value: string;
  autoValue?: string;
  autoLabel?: string;
  hint?: string;
  /** What happens while the chosen provider can't run, e.g. "reviews wait". */
  meanwhile: string;
  onChange: (provider: string) => void;
}) {
  const { t } = useTranslation();
  const chosen = providers.find((p) => p.id === value);
  const availability = chosen ? providerAvailability(chosen.id, checks) : null;
  let help: ReactNode;
  if (chosen && availability && !availability.ready) {
    // A CLI too old says which version it needs: "Gemini CLI 0.36.0 is too old (needs 0.68.0+)".
    const why =
      availability.reason === TOO_OLD && availability.detail
        ? availability.detail
        : `${chosen.displayName}: ${lowerFirst(availability.reason ?? t("factory.agents.notReady"))}`;
    help = (
      <span className="text-status-waiting">
        {why}
        {availability.command && (
          <>
            {" "}
            {t("factory.agents.runPrefix")}{" "}
            <code className="rounded bg-muted px-1 font-mono">{availability.command}</code>)
          </>
        )}
        {t("factory.agents.untilRun", { meanwhile })}
      </span>
    );
  }
  return (
    <Field label={label} htmlFor={id} hint={hint} help={help}>
      <select id={id} className={SELECT} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={autoValue}>{autoLabel ?? t("factory.agents.automatic")}</option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {providerOptionLabel(p.displayName, providerAvailability(p.id, checks))}
          </option>
        ))}
        {!chosen && value !== autoValue && (
          <option value={value}>{t("factory.agents.notConnected", { value })}</option>
        )}
      </select>
    </Field>
  );
}

function ModelSelect({
  id,
  label,
  provider,
  value,
  onChange,
}: {
  id: string;
  label: string;
  provider: ProviderInfo | undefined;
  value: string | null;
  onChange: (model: string | null) => void;
}) {
  const { t } = useTranslation();
  const models = provider?.models ?? [];
  const known = value === null || models.some((m) => m.id === value);
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        className={SELECT}
        value={value ?? ""}
        disabled={!provider}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">
          {provider ? t("factory.agents.providerDefault") : t("factory.agents.chooseProvider")}
        </option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
        {!known && value && <option value={value}>{value}</option>}
      </select>
    </Field>
  );
}
