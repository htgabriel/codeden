import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Trans, useTranslation } from "@/lib/i18n";
import { useProjectActions } from "@/lib/project-actions";
import { useSnapshot } from "@/lib/queries";
import { SettingRow, SettingsSection } from "./settings-ui";

/**
 * Settings > General: per project, whether agent sessions run with `CI=true` (§4.2,
 * `Project.agentCiEnv`). On by default; off when the project's own tools misbehave under CI.
 */
export function AgentEnvironmentSettings() {
  // Undefined until the snapshot loads, so "Add a project" never shows before it has (#400).
  const { t } = useTranslation();
  const projects = useSnapshot().data?.projects;
  const { setAgentCiEnv } = useProjectActions();
  return (
    <SettingsSection
      title={t("prefs.agentEnv.title")}
      description={t("prefs.agentEnv.description")}
    >
      {projects === undefined ? (
        <div className="px-4 py-3.5" role="status" aria-label={t("prefs.agentEnv.loading")}>
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : projects.length === 0 ? (
        <p className="px-4 py-3.5 text-2xs text-muted-foreground">{t("prefs.agentEnv.empty")}</p>
      ) : (
        projects.map((project) => (
          <SettingRow
            key={project.id}
            label={project.name}
            help={
              project.agentCiEnv ? (
                t("prefs.agentEnv.withCi")
              ) : (
                <Trans i18nKey="prefs.agentEnv.withoutCi" components={{ code: <code /> }} />
              )
            }
          >
            <Switch
              aria-label={t("prefs.agentEnv.switchLabel", { name: project.name })}
              checked={project.agentCiEnv}
              onCheckedChange={(on) => void setAgentCiEnv(project, on)}
            />
          </SettingRow>
        ))
      )}
    </SettingsSection>
  );
}
