import type { Role, UiLanguagePreference } from "@codeden/contracts";
import { ProviderMark } from "@/components/common/bits";
import { NumberField } from "@/components/common/number-field";
import { PickerFooterChoice } from "@/components/composer/model-picker/footer";
import { providerAvailability } from "@/components/composer/model-picker/logic";
import { ModelPicker } from "@/components/composer/model-picker/model-picker";
import { KillSwitchButton } from "@/components/factory/kill-switch";
import { AUTONOMY } from "@/components/thread/autonomy";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";
import { useSetupStatus, useSnapshotData } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/stores/language";
import { type ThemePreference, useThemeStore } from "@/stores/theme";
import { AgentEnvironmentSettings } from "./agent-environment";
import { CustomModelSettings } from "./custom-models";
import { ModelVisibilitySettings } from "./model-visibility";
import { ProviderHistorySettings } from "./provider-history";
import { Segmented, SettingRow, SettingsSection, useSettings } from "./settings-ui";
import { TokenSaverSettingsSection } from "./token-saver";
import { UpdateModeSetting } from "./update-mode";

export function GeneralSettings() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const language = useLanguageStore((s) => s.preference);
  const setLanguage = useLanguageStore((s) => s.setPreference);
  return (
    <>
      <SettingsSection title={t("settings.appearance.title")}>
        <SettingRow
          label={t("settings.appearance.theme")}
          help={t("settings.appearance.themeHelp")}
        >
          <Segmented<ThemePreference>
            value={preference}
            onChange={(v) => {
              setPreference(v);
              update({ appearance: { theme: v } });
            }}
            options={[
              { value: "dark", label: t("settings.appearance.dark") },
              { value: "light", label: t("settings.appearance.light") },
              { value: "system", label: t("settings.appearance.system") },
            ]}
          />
        </SettingRow>
        <SettingRow
          label={t("settings.appearance.language")}
          help={t("settings.appearance.languageHelp")}
        >
          <Segmented<UiLanguagePreference>
            value={language}
            onChange={(v) => {
              setLanguage(v);
              update({ appearance: { language: v } });
            }}
            options={[
              { value: "auto", label: t("settings.appearance.auto") },
              // Each language is named in itself, so it can be found from any language.
              { value: "en", label: "English" },
              { value: "pt-BR", label: "Português (Brasil)" },
            ]}
          />
        </SettingRow>
      </SettingsSection>
      <SettingsSection
        title={t("prefs.general.followupsTitle")}
        description={t("prefs.general.followupsDescription")}
      >
        <SettingRow label={t("prefs.general.showFollowups")}>
          <Switch
            checked={settings.followups.enabled}
            onCheckedChange={(v) => update({ followups: { enabled: v } })}
          />
        </SettingRow>
        <SettingRow
          label={t("prefs.general.sendOnClick")}
          help={t("prefs.general.sendOnClickHelp")}
        >
          <Switch
            checked={settings.followups.sendOnClick}
            onCheckedChange={(v) => update({ followups: { sendOnClick: v } })}
          />
        </SettingRow>
      </SettingsSection>
      <SettingsSection
        title={t("prefs.general.agentSessionsTitle")}
        description={t("prefs.general.agentSessionsDescription")}
      >
        <SettingRow label={t("prefs.general.prFeedback")} help={t("prefs.general.prFeedbackHelp")}>
          <Switch
            checked={settings.sessions.prFeedback}
            onCheckedChange={(v) => update({ sessions: { prFeedback: v } })}
          />
        </SettingRow>
        <SettingRow label={t("prefs.general.autoRetry")} help={t("prefs.general.autoRetryHelp")}>
          <Switch
            checked={settings.sessions.autoRetry}
            onCheckedChange={(v) => update({ sessions: { autoRetry: v } })}
          />
        </SettingRow>
      </SettingsSection>
      <TokenSaverSettingsSection />
      <AgentEnvironmentSettings />
      <SettingsSection title={t("prefs.general.backgroundTitle")}>
        <SettingRow
          label={t("prefs.general.automations")}
          help={t("prefs.general.automationsHelp")}
        >
          <Switch
            checked={settings.automations.enabled}
            onCheckedChange={(v) => update({ automations: { enabled: v } })}
          />
        </SettingRow>
        <SettingRow
          label={t("prefs.general.killSwitch")}
          help={
            settings.factory.killSwitch
              ? t("prefs.general.killSwitchOn")
              : t("prefs.general.killSwitchOff")
          }
        >
          <KillSwitchButton scope="global" on={settings.factory.killSwitch} size="xs" />
        </SettingRow>
        <UpdateModeSetting />
      </SettingsSection>
      <SettingsSection
        title={t("prefs.general.worktreesTitle")}
        description={t("prefs.general.worktreesDescription")}
      >
        <SettingRow label={t("prefs.general.cleanup")} help={t("prefs.general.cleanupHelp")}>
          <Switch
            checked={settings.worktrees.cleanup}
            onCheckedChange={(v) => update({ worktrees: { cleanup: v } })}
          />
        </SettingRow>
        <SettingRow
          label={t("prefs.general.inactiveFor")}
          help={t("prefs.general.inactiveForHelp")}
        >
          <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
            <NumberField
              min={1}
              max={365}
              aria-label={t("prefs.general.daysBeforeCleanup")}
              disabled={!settings.worktrees.cleanup}
              value={settings.worktrees.afterDays}
              onChange={(afterDays) => update({ worktrees: { afterDays } })}
              wrapperClassName="w-20"
              className="h-8 text-xs"
            />
            {t("prefs.general.days")}
          </div>
        </SettingRow>
      </SettingsSection>
    </>
  );
}

const roles: Role[] = ["orchestrator", "pm", "agent"];

export function ProviderSettings() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const providers = useSnapshotData((s) => s.runner.providers, []);
  // The same checks as the setup checklist, so the two screens never disagree.
  const checks = useSetupStatus({ staleTime: 60_000 }).data?.checks;
  return (
    <>
      <SettingsSection
        title={t("prefs.providers.installedTitle")}
        description={t("prefs.providers.installedDescription")}
      >
        {providers.map((p) => {
          const availability = providerAvailability(p.id, checks);
          return (
            <SettingRow
              key={p.id}
              label={p.displayName}
              help={
                availability.ready
                  ? t("prefs.providers.summary", {
                      models: p.models.length,
                      capabilities: Object.entries(p.capabilities).filter(([, v]) => v).length,
                    })
                  : (availability.detail ?? undefined)
              }
            >
              <div className="flex items-center gap-2">
                <ProviderMark provider={p.id} className="size-5" />
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-2xs",
                    availability.ready
                      ? "bg-status-done/12 text-status-done"
                      : "bg-status-waiting/12 text-status-waiting",
                  )}
                >
                  {availability.ready ? t("prefs.providers.ready") : availability.reason}
                </span>
              </div>
            </SettingRow>
          );
        })}
      </SettingsSection>
      <SettingsSection
        title={t("prefs.providers.rolesTitle")}
        description={t("prefs.providers.rolesDescription")}
      >
        {roles.map((role) => {
          const current = settings.providers[role];
          const auto = current.provider === "auto";
          return (
            <SettingRow
              key={role}
              label={t(`prefs.providers.roles.${role}.label`)}
              help={t(`prefs.providers.roles.${role}.help`)}
            >
              <div className="rounded-lg border border-border px-1 py-0.5">
                <ModelPicker
                  providers={providers}
                  align="end"
                  placeholder={t("settings.appearance.auto")}
                  value={
                    auto
                      ? null
                      : { provider: current.provider, model: current.model, effort: current.effort }
                  }
                  onChange={(next) => update({ providers: { [role]: next } })}
                  footer={(close) => (
                    <PickerFooterChoice
                      active={auto}
                      onClick={() => {
                        update({
                          providers: { [role]: { provider: "auto", model: null, effort: null } },
                        });
                        close();
                      }}
                    >
                      {t("prefs.providers.autoChoice")}
                    </PickerFooterChoice>
                  )}
                />
              </div>
            </SettingRow>
          );
        })}
        <SettingRow
          label={t("prefs.providers.autoSwitch")}
          help={t("prefs.providers.autoSwitchHelp")}
        >
          <Switch
            checked={settings.providers.autoSwitchOnLimit}
            onCheckedChange={(v) => update({ providers: { autoSwitchOnLimit: v } })}
          />
        </SettingRow>
      </SettingsSection>
      <ModelVisibilitySettings />
      <CustomModelSettings />
      <ProviderHistorySettings />
    </>
  );
}

export function AutonomySettings() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  return (
    <SettingsSection
      title={t("prefs.autonomy.title")}
      description={t("prefs.autonomy.description")}
    >
      <div className="grid gap-2 p-3">
        {(Object.keys(AUTONOMY) as (keyof typeof AUTONOMY)[]).map((level) => {
          const a = AUTONOMY[level];
          const active = settings.autonomy.default === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => update({ autonomy: { default: level } })}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                active ? "border-primary/50 bg-primary/[0.06]" : "border-border hover:bg-accent/40",
              )}
            >
              <a.icon className={cn("mt-0.5 size-4", a.tone)} />
              <span>
                <span className="block text-[13.5px] font-medium">
                  {a.label}
                  {level === "auto" && (
                    <span className="ml-2 text-2xs font-normal text-muted-foreground">
                      {t("prefs.autonomy.recommended")}
                    </span>
                  )}
                </span>
                <span className="block text-2xs text-muted-foreground">{a.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      <SettingRow label={t("prefs.autonomy.risky")} help={t("prefs.autonomy.riskyHelp")}>
        <span className="text-2xs text-muted-foreground">{t("prefs.autonomy.alwaysAsk")}</span>
      </SettingRow>
    </SettingsSection>
  );
}

export function UtilitySettings() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const providers = useSnapshotData((s) => s.runner.providers, []);
  const jobs = ["followups", "sessionTitles", "noticeSummaries", "handoffSummaries"] as const;
  const utilityAuto = settings.utilityModel.provider === "auto";
  return (
    <SettingsSection
      title={t("settings.sections.utility")}
      description={t("prefs.utility.description")}
    >
      <SettingRow label={t("prefs.utility.model")}>
        <div className="rounded-lg border border-border px-1 py-0.5">
          <ModelPicker
            providers={providers}
            align="end"
            effort={false}
            placeholder={t("prefs.utility.placeholder")}
            value={
              utilityAuto
                ? null
                : {
                    provider: settings.utilityModel.provider,
                    model: settings.utilityModel.model,
                    effort: null,
                  }
            }
            onChange={(next) =>
              update({ utilityModel: { provider: next.provider, model: next.model } })
            }
            footer={(close) => (
              <PickerFooterChoice
                active={utilityAuto}
                onClick={() => {
                  update({ utilityModel: { provider: "auto", model: null } });
                  close();
                }}
              >
                {t("prefs.utility.autoChoice")}
              </PickerFooterChoice>
            )}
          />
        </div>
      </SettingRow>
      {jobs.map((key) => (
        <SettingRow
          key={key}
          label={t(`prefs.utility.jobs.${key}.label`)}
          help={t(`prefs.utility.jobs.${key}.help`)}
        >
          <Switch
            checked={settings.utilityModel.jobs[key]}
            onCheckedChange={(v) => update({ utilityModel: { jobs: { [key]: v } } })}
          />
        </SettingRow>
      ))}
    </SettingsSection>
  );
}
