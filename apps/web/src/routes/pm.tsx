import { Bot, CircleDot, GitPullRequest, ListTodo, Workflow } from "lucide-react";
import { RoleChat } from "@/components/orchestration/role-chat";
import { useTranslation } from "@/lib/i18n";
import { useProject } from "@/lib/queries";
import { SuggestionGrid } from "./home";

const suggestions = [
  { icon: ListTodo, key: "orchestrator.pm.suggestions.running" },
  { icon: CircleDot, key: "orchestrator.pm.suggestions.triage" },
  { icon: GitPullRequest, key: "orchestrator.pm.suggestions.pullRequests" },
  { icon: Workflow, key: "orchestrator.pm.suggestions.plan" },
] as const;

/** A project's PM chat (§8.1): triages, plans, starts and steers agent sessions. */
export function PmPage({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const { t } = useTranslation();
  if (!project) return null;
  const items = suggestions.map((s) => ({ icon: s.icon, text: t(s.key) }));
  return (
    <RoleChat
      kind="pm"
      projectId={projectId}
      empty={(draftKey) => (
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <Bot className="size-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("orchestrator.pm.title", { project: project.name })}
          </h2>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            {t("orchestrator.pm.intro", { project: project.name })}
          </p>
          <SuggestionGrid draftKey={draftKey} items={items} />
        </div>
      )}
    />
  );
}
