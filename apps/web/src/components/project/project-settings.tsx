import type { AutonomyLevel, Project } from "@codeden/contracts";
import { Link } from "@tanstack/react-router";
import { PickerFooterChoice } from "@/components/composer/model-picker/footer";
import { ModelPicker } from "@/components/composer/model-picker/model-picker";
import { Segmented, SettingRow, SettingsSection } from "@/components/settings/settings-ui";
import { ProjectTokenSaverRow } from "@/components/settings/token-saver";
import { AUTONOMY, AUTONOMY_LEVELS } from "@/components/thread/autonomy";
import { Trans, useTranslation } from "@/lib/i18n";
import { useProjectActions } from "@/lib/project-actions";
import { useSnapshotData } from "@/lib/queries";
import { SessionsKeepingLevel } from "./sessions-keeping-level";

const SETTINGS_DEFAULT = "default";

/**
 * Project page > Settings: what new sessions in this project start with (#261). The default
 * agent (provider, model and effort) and permissions override Settings for this project; the
 * New session draft starts from them, and a pick there still wins. Sessions that exist keep the
 * permissions they have (§11.2), so the ones on another level are named, with a button that
 * applies the project's level to them (`SessionsKeepingLevel`).
 */
export function ProjectSettings({ project }: { project: Project }) {
  const { t } = useTranslation();
  const providers = useSnapshotData((s) => s.runner.providers, []);
  const globalAutonomy = useSnapshotData<AutonomyLevel>((s) => s.settings.autonomy.default, "auto");
  const { setSessionDefaults } = useProjectActions();
  const level = project.autonomy ?? globalAutonomy;
  const inherits = project.defaultProvider === null;
  const toSettings = (
    <Link
      to="/settings/$section"
      params={{ section: "providers" }}
      className="underline underline-offset-2 hover:text-foreground"
    />
  );

  return (
    <SettingsSection
      title={t("project.settings.title")}
      description={t("project.settings.description")}
    >
      <SettingRow
        label={t("project.settings.defaultAgent")}
        help={
          inherits ? (
            <Trans i18nKey="project.settings.agentNotSet" components={{ link: toSettings }} />
          ) : (
            <Trans i18nKey="project.settings.agentOverride" components={{ link: toSettings }} />
          )
        }
      >
        <div className="rounded-lg border border-border px-1 py-0.5" data-testid="project-agent">
          <ModelPicker
            providers={providers}
            projectId={project.id}
            align="end"
            placeholder={t("project.settings.settingsDefault")}
            value={
              inherits
                ? null
                : {
                    provider: project.defaultProvider as string,
                    model: project.defaultModel,
                    effort: project.defaultEffort,
                  }
            }
            onChange={(next) =>
              void setSessionDefaults(project, {
                defaultProvider: next.provider,
                defaultModel: next.model,
                defaultEffort: next.effort,
              })
            }
            footer={(close) => (
              <PickerFooterChoice
                active={inherits}
                onClick={() => {
                  void setSessionDefaults(project, {
                    defaultProvider: null,
                    defaultModel: null,
                    defaultEffort: null,
                  });
                  close();
                }}
              >
                {t("project.settings.settingsDefaultChoice")}
              </PickerFooterChoice>
            )}
          />
        </div>
      </SettingRow>
      <SettingRow
        label={t("project.settings.permissions")}
        help={t("project.settings.permissionsHelp", { level: AUTONOMY[globalAutonomy].short })}
        stacked
      >
        <Segmented<AutonomyLevel | typeof SETTINGS_DEFAULT>
          value={project.autonomy ?? SETTINGS_DEFAULT}
          onChange={(v) =>
            void setSessionDefaults(project, { autonomy: v === SETTINGS_DEFAULT ? null : v })
          }
          options={[
            { value: SETTINGS_DEFAULT, label: t("project.settings.default") },
            ...AUTONOMY_LEVELS.map((level) => ({ value: level, label: AUTONOMY[level].short })),
          ]}
        />
        <SessionsKeepingLevel projectId={project.id} level={level} />
      </SettingRow>
      <ProjectTokenSaverRow project={project} />
    </SettingsSection>
  );
}
