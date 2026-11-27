import { useTranslation } from "@/lib/i18n";
import { ConfigFilesView } from "./config-files-view";
import { useSkillSwitches } from "./skill-switches";

/** Memory files of every provider (CLAUDE.md, rules, auto memory, AGENTS.md), edited in place. */
export function MemoryEditor({ projectId }: { projectId: string | null }) {
  const { t } = useTranslation();
  return (
    <ConfigFilesView
      projectId={projectId}
      kinds={["memory", "rule", "auto_memory"]}
      emptyText={t("shell.memory.empty")}
    />
  );
}

/**
 * Each provider's user and project skill folders (`<name>/SKILL.md`), each with a switch that
 * writes its provider's own setting.
 */
export function SkillsView({ projectId }: { projectId: string | null }) {
  const { t } = useTranslation();
  const switches = useSkillSwitches(projectId);
  return (
    <>
      <ConfigFilesView
        projectId={projectId}
        kinds={["skill"]}
        create="skill"
        placeholder={t("shell.memory.skillPlaceholder")}
        emptyText={t("shell.memory.skillsEmpty")}
        rowAddon={switches.addon}
        onFilesChanged={() => void switches.refetch()}
      />
      {switches.dialog}
    </>
  );
}

/** Claude subagents (`.claude/agents`) and Codex agents (`.codex/agents`). */
export function SubagentsView({ projectId }: { projectId: string | null }) {
  const { t } = useTranslation();
  return (
    <ConfigFilesView
      projectId={projectId}
      kinds={["subagent"]}
      create="subagent"
      placeholder={t("shell.memory.subagentPlaceholder")}
      emptyText={t("shell.memory.subagentsEmpty")}
    />
  );
}
