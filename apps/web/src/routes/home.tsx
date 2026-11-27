import { Link } from "@tanstack/react-router";
import { Bot, FolderPlus, GitPullRequest, ListChecks, ShieldAlert, Sparkles } from "lucide-react";
import { RoleChat } from "@/components/orchestration/role-chat";
import { ProjectTile } from "@/components/shell/sidebar/project-group";
import { useTranslation } from "@/lib/i18n";
import { useSnapshotData } from "@/lib/queries";
import { useComposerStore } from "@/stores/composer";
import { useUiStore } from "@/stores/ui";

const suggestions = [
  { icon: Sparkles, key: "orchestrator.home.suggestions.overview" },
  { icon: ListChecks, key: "orchestrator.home.suggestions.triage" },
  { icon: ShieldAlert, key: "orchestrator.home.suggestions.security" },
  { icon: GitPullRequest, key: "orchestrator.home.suggestions.pullRequests" },
] as const;

/** Suggestions that fill the composer; shared by the orchestrator and PM empty states. */
export function SuggestionGrid({
  draftKey,
  items,
}: {
  draftKey: string;
  items: { icon: typeof Bot; text: string }[];
}) {
  const setText = useComposerStore((s) => s.setText);
  const focus = useComposerStore((s) => s.focus);
  return (
    <div className="relative mt-8 grid w-full max-w-2xl grid-cols-2 gap-2">
      {items.map((s) => (
        <button
          key={s.text}
          type="button"
          onClick={() => {
            setText(draftKey, s.text);
            focus();
          }}
          className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-3.5 py-3 text-left text-[13px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-card hover:text-foreground"
        >
          <s.icon className="size-4 shrink-0 text-primary/80" />
          {s.text}
        </button>
      ))}
    </div>
  );
}

function ProjectsStrip() {
  const projects = useSnapshotData((s) => s.projects, []);
  const setAddProject = useUiStore((s) => s.setAddProjectOpen);
  const { t } = useTranslation();
  return (
    <div className="relative mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-1.5">
      {projects.map((p) => (
        <Link
          key={p.id}
          to="/projects/$projectId"
          params={{ projectId: p.id }}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ProjectTile project={p} /> {p.name}
        </Link>
      ))}
      <button
        type="button"
        onClick={() => setAddProject(true)}
        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <FolderPlus className="size-3.5" /> {t("orchestrator.home.addProject")}
      </button>
    </div>
  );
}

function OrchestratorEmpty({ draftKey }: { draftKey: string }) {
  const { t } = useTranslation();
  const items = suggestions.map((s) => ({ icon: s.icon, text: t(s.key) }));
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,var(--glow),transparent)]"
      />
      <div className="relative mb-5 flex size-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
        <Bot className="size-6 text-primary" />
      </div>
      <h2 className="relative text-2xl font-semibold tracking-tight">
        {t("orchestrator.home.title")}
      </h2>
      <p className="relative mt-2 max-w-md text-center text-sm text-muted-foreground">
        {t("orchestrator.home.intro")}
      </p>
      <SuggestionGrid draftKey={draftKey} items={items} />
      <ProjectsStrip />
    </div>
  );
}

/** The orchestrator chat, pinned at the top of the sidebar (§8.1). */
export function HomePage() {
  return (
    <RoleChat
      kind="orchestrator"
      projectId={null}
      empty={(draftKey) => <OrchestratorEmpty draftKey={draftKey} />}
    />
  );
}
