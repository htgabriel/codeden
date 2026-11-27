import type { Project, ProjectExecutionBackend, Snapshot } from "@codeden/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { i18n } from "@/lib/i18n";
import { useClient } from "./api";
import { moveWithinGroup, restoreOrder, withOrder, withPinned } from "./project-order";
import { snapshotKey } from "./queries";

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** A project's own defaults for new sessions (#261); see `setSessionDefaults`. */
export type ProjectSessionDefaults =
  | Pick<Project, "defaultProvider" | "defaultModel" | "defaultEffort">
  | Pick<Project, "autonomy">;

/**
 * Pin, unpin, reorder and archive projects (§13), set their defaults for new sessions, and turn
 * `CI=true` in their agent sessions on or off (§4.2). Other than archiving, changes apply to the snapshot at once and
 * are rolled back with a toast if the server rejects them; the server's event then confirms them.
 */
export function useProjectActions() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMemo(() => {
    const projects = () => queryClient.getQueryData<Snapshot>(snapshotKey)?.projects ?? [];
    const setProjects = (change: (list: Project[]) => Project[]) =>
      queryClient.setQueryData<Snapshot>(snapshotKey, (s) =>
        s ? { ...s, projects: change(s.projects) } : s,
      );

    async function optimistic(
      change: (list: Project[]) => Project[],
      save: () => Promise<unknown>,
      failure: string,
    ): Promise<boolean> {
      const before = projects();
      setProjects(change);
      try {
        await save();
        return true;
      } catch (error) {
        setProjects((list) => restoreOrder(list, before));
        toast.error(failure, { description: message(error) });
        return false;
      }
    }

    const reorder = (projectIds: string[]) =>
      optimistic(
        (list) => withOrder(list, projectIds),
        () => client.reorderProjects(projectIds),
        i18n.t("messages.projectActions.orderFailed"),
      );

    return {
      setPinned: (project: Project, pinned: boolean) =>
        optimistic(
          (list) => withPinned(list, project.id, pinned),
          () => client.updateProject(project.id, { pinned }),
          pinned
            ? i18n.t("messages.projectActions.pinFailed", { name: project.name })
            : i18n.t("messages.projectActions.unpinFailed", { name: project.name }),
        ),
      /**
       * The project's defaults for new sessions: provider, model and effort (set together, since
       * a model id belongs to its provider) and permissions. Null falls back to Settings.
       */
      setSessionDefaults: async (project: Project, patch: ProjectSessionDefaults) => {
        const set = (
          value: Partial<
            Pick<Project, "defaultProvider" | "defaultModel" | "defaultEffort" | "autonomy">
          >,
        ) => setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, ...value } : p)));
        set(patch);
        try {
          await client.updateProject(project.id, patch);
          return true;
        } catch (error) {
          const { defaultProvider, defaultModel, defaultEffort, autonomy } = project;
          set({ defaultProvider, defaultModel, defaultEffort, autonomy });
          toast.error(i18n.t("messages.projectActions.defaultsFailed", { name: project.name }), {
            description: message(error),
          });
          return false;
        }
      },
      setAgentCiEnv: async (project: Project, agentCiEnv: boolean) => {
        const set = (value: boolean) =>
          setProjects((list) =>
            list.map((p) => (p.id === project.id ? { ...p, agentCiEnv: value } : p)),
          );
        set(agentCiEnv);
        try {
          await client.updateProject(project.id, { agentCiEnv });
          return true;
        } catch (error) {
          set(project.agentCiEnv);
          toast.error(i18n.t("messages.projectActions.envFailed", { name: project.name }), {
            description: message(error),
          });
          return false;
        }
      },
      /** Where the project's new agent sessions run (`Project.execution`); refused with a toast. */
      setExecutionBackend: async (project: Project, backend: ProjectExecutionBackend) => {
        const set = (value: ProjectExecutionBackend) =>
          setProjects((list) =>
            list.map((p) => (p.id === project.id ? { ...p, execution: { backend: value } } : p)),
          );
        set(backend);
        try {
          await client.updateProject(project.id, { execution: { backend } });
          return true;
        } catch (error) {
          set(project.execution?.backend ?? "local");
          toast.error(i18n.t("messages.projectActions.executionFailed", { name: project.name }), {
            description: message(error),
          });
          return false;
        }
      },
      /**
       * Archive a project: it leaves the list here once the server has archived it (the
       * `project.archived` event says the same). Adding its folder again restores it.
       */
      archive: async (project: Project) => {
        try {
          await client.archiveProject(project.id);
        } catch (error) {
          toast.error(i18n.t("messages.projectActions.archiveFailed", { name: project.name }), {
            description: message(error),
          });
          return false;
        }
        setProjects((list) => list.filter((p) => p.id !== project.id));
        toast.success(i18n.t("messages.projectActions.archived", { name: project.name }), {
          description: i18n.t("messages.projectActions.archivedDescription"),
        });
        return true;
      },
      reorder,
      /** Move a project to position `to` within its group (pinned or not). */
      moveTo: async (projectId: string, to: number) => {
        const ids = moveWithinGroup(projects(), projectId, to);
        return ids ? reorder(ids) : false;
      },
    };
  }, [client, queryClient]);
}
