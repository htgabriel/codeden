import type { Project, Role, SettingsPatch, TokenSaverLevel } from "@codeden/contracts";
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { useSnapshotData } from "@/lib/queries";
import { Segmented, SettingRow, SettingsSection, useSettings } from "./settings-ui";

const INHERIT = "inherit";
const LEVEL_IDS: TokenSaverLevel[] = ["off", "lite", "full", "ultra"];
const ROLES: Role[] = ["orchestrator", "pm", "agent"];

type LevelOption<T extends string> = { value: T; label: string };

/** The level options, in the UI language. */
function useLevels(): LevelOption<TokenSaverLevel>[] {
  const { t } = useTranslation();
  return LEVEL_IDS.map((value) => ({ value, label: t(`prefs.tokenSaver.levels.${value}`) }));
}

/** The level options after "Default", which follows the level above it. */
function useLevelsWithInherit(): LevelOption<TokenSaverLevel | typeof INHERIT>[] {
  const { t } = useTranslation();
  return [{ value: INHERIT, label: t("prefs.tokenSaver.inherit") }, ...useLevels()];
}

/** Providers whose system prompt holds for the whole conversation (`capabilities.systemPrompt`). */
function useCoveredProviders(): string {
  const { t } = useTranslation();
  const providers = useSnapshotData((s) => s.runner.providers, []);
  const names = providers.filter((p) => p.capabilities.systemPrompt).map((p) => p.displayName);
  return names.length > 0 ? names.join(", ") : t("prefs.tokenSaver.noProviders");
}

/** Settings > General: the token saver's global level and per-role defaults (#602). */
export function TokenSaverSettingsSection() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const levels = useLevels();
  const withInherit = useLevelsWithInherit();
  const covered = useCoveredProviders();
  const ts = settings.tokenSaver;
  return (
    <SettingsSection
      title={t("prefs.tokenSaver.title")}
      description={t("prefs.tokenSaver.description", { covered })}
    >
      <SettingRow label={t("prefs.tokenSaver.defaultLevel")} stacked>
        <Segmented<TokenSaverLevel>
          value={ts.default}
          onChange={(level) => update({ tokenSaver: { default: level } })}
          options={levels}
        />
      </SettingRow>
      {ROLES.map((role) => (
        <SettingRow key={role} label={t(`prefs.providers.roles.${role}.label`)} stacked>
          <Segmented<TokenSaverLevel | typeof INHERIT>
            value={ts.roles[role] ?? INHERIT}
            onChange={(v) =>
              update({ tokenSaver: { roles: { [role]: v === INHERIT ? null : v } } })
            }
            options={withInherit}
          />
        </SettingRow>
      ))}
    </SettingsSection>
  );
}

/** Project page > Settings: this project's token saver level, or the global one (#602). */
export function ProjectTokenSaverRow({ project }: { project: Project }) {
  const { t } = useTranslation();
  const client = useClient();
  const options = useLevelsWithInherit();
  const level = useSnapshotData(
    (s) => s.settings.tokenSaver.projects[project.id]?.level,
    undefined,
  );
  const set = (v: TokenSaverLevel | typeof INHERIT) =>
    void client.updateSettings({
      tokenSaver: { projects: { [project.id]: v === INHERIT ? null : { level: v } } },
    } as SettingsPatch);
  return (
    <SettingRow
      label={t("prefs.tokenSaver.title")}
      help={t("prefs.tokenSaver.projectHelp")}
      stacked
    >
      <Segmented<TokenSaverLevel | typeof INHERIT>
        value={level ?? INHERIT}
        onChange={set}
        options={options}
      />
    </SettingRow>
  );
}
