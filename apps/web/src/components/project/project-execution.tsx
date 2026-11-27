import type { Project, ProjectExecutionBackend } from "@codeden/contracts";
import { useQuery } from "@tanstack/react-query";
import { ExperimentalBadge } from "@/components/factory/autonomy-dialog";
import { Segmented, SettingsSection } from "@/components/settings/settings-ui";
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { useProjectActions } from "@/lib/project-actions";

/**
 * Project page > Settings: where the project's new agent sessions run (`Project.execution`,
 * `docs/remote-runners.md` §5). This machine (worktrees) or, experimentally, a Docker container
 * per session. Docker can't be picked while it isn't available, or for a project that isn't on
 * GitHub, and the reason is shown.
 */
export function ProjectExecution({ project }: { project: Project }) {
  const { t } = useTranslation();
  const client = useClient();
  const { setExecutionBackend } = useProjectActions();
  const backends = useQuery({
    queryKey: ["execution", "backends", project.id, project.kind],
    queryFn: () => client.executionBackends({ projectId: project.id }),
    retry: false,
    staleTime: 30_000,
  });
  const docker = backends.data?.backends.find((b) => b.backend === "docker");
  // A project from an older server has no setting: it runs locally.
  const current = project.execution?.backend ?? "local";
  const blocked = !docker?.available;
  const reason = docker
    ? [docker.reason, docker.fix].filter(Boolean).join(". ")
    : backends.isPending
      ? t("project.execution.checkingDocker")
      : t("project.execution.dockerUncheckable");

  return (
    <SettingsSection
      title={t("project.execution.title")}
      description={t("project.execution.description")}
    >
      <div className="space-y-3 px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[13.5px] font-medium">
            {t("project.execution.agentSessions")}
            {current === "docker" && <ExperimentalBadge />}
          </div>
          <div className="mt-0.5 text-2xs leading-relaxed text-muted-foreground">
            {current === "docker"
              ? t("project.execution.dockerHelp")
              : t("project.execution.localHelp")}
          </div>
        </div>
        <Segmented<ProjectExecutionBackend>
          value={current}
          onChange={(backend) => {
            if (backend !== current) void setExecutionBackend(project, backend);
          }}
          options={[
            { value: "local", label: t("project.execution.thisMachine") },
            {
              value: "docker",
              label: t("project.execution.dockerExperimental"),
              disabled: blocked && current !== "docker",
              title: blocked ? reason : undefined,
            },
          ]}
        />
        {blocked && (
          <p className="text-2xs text-muted-foreground" data-testid="docker-unavailable">
            {reason}
          </p>
        )}
      </div>
    </SettingsSection>
  );
}
