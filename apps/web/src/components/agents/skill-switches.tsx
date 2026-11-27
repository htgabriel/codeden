import {
  type AgentConfigFile,
  type AgentSkill,
  agentConfigFeatures,
  type SkillSwitchDiff,
  type SkillSwitchRequest,
} from "@codeden/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { fileKey, type RowAddon } from "./config-files-view";
import { PatchDialog } from "./patch-dialog";
import { SWITCH_SCOPE_NOTE, skillStateLabel, skillStateTitle } from "./skill-state";

/** Per-session queries that list skills: What's loaded and the composer's `/` menu. */
export const SESSION_SKILL_QUERIES = [["agent-config-loaded"], ["commands"]] as const;

/** A switch waiting for its diff to be confirmed. */
interface Pending {
  skill: AgentSkill;
  req: SkillSwitchRequest;
}

/**
 * Skill switches for the Skills tab (§12.4): each skill's state from its provider's native
 * setting, a switch per row, and the diff preview before the setting is written.
 */
export function useSkillSwitches(projectId: string | null) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const queryKey = ["agent-config-skills", projectId];
  const list = useQuery({ queryKey, queryFn: () => client.agentConfig.listSkills(projectId) });
  const [pending, setPending] = useState<Pending | null>(null);
  const [diff, setDiff] = useState<SkillSwitchDiff | undefined>();
  const [diffError, setDiffError] = useState<string | null>(null);

  const byFile = new Map((list.data?.skills ?? []).map((s) => [fileKey(s.file), s]));

  const ask = async (skill: AgentSkill, enabled: boolean) => {
    const { root, projectId: fileProject, path } = skill.file;
    const req: SkillSwitchRequest = {
      root,
      ...(fileProject ? { projectId: fileProject } : {}),
      path,
      provider: skill.provider,
      enabled,
      ...(projectId ? { listProjectId: projectId } : {}),
    };
    setPending({ skill, req });
    setDiff(undefined);
    setDiffError(null);
    try {
      setDiff(await client.agentConfig.diffSkillSwitch(req));
    } catch (e) {
      setDiffError(e instanceof Error ? e.message : String(e));
    }
  };

  const change = useMutation({
    mutationFn: (p: Pending) => client.agentConfig.switchSkill(p.req),
    onSuccess: (res, p) => {
      setPending(null);
      queryClient.setQueryData(queryKey, { skills: res.skills });
      // Every session's What's loaded and composer `/` menu (`use-suggestions.ts`, cached for
      // a minute) read the same setting, so a cached menu must not keep offering the skill.
      for (const key of SESSION_SKILL_QUERIES)
        void queryClient.invalidateQueries({ queryKey: key });
      toast.success(
        p.req.enabled
          ? t("shell.skills.switchedOn", { name: p.skill.name })
          : t("shell.skills.switchedOff", { name: p.skill.name }),
        {
          description: res.backupPath
            ? t("shell.configEditor.backup", { path: res.backupPath })
            : (res.file ?? undefined),
        },
      );
    },
    onError: (e) => toast.error(t("shell.hooks.notChanged"), { description: e.message }),
  });

  /** The switch, chip and dimming for a skill row; nothing for files that aren't listed skills. */
  const addon = (f: AgentConfigFile): RowAddon | undefined => {
    const skill = byFile.get(fileKey(f));
    if (!skill || !agentConfigFeatures[skill.provider].skillSwitches) return undefined;
    const label = skillStateLabel(skill);
    const title = skillStateTitle(skill);
    return {
      muted: !skill.enabled,
      chip: label ? (
        <span className="text-muted-foreground" title={title}>
          {label}
        </span>
      ) : undefined,
      end: (
        <Switch
          size="sm"
          className="pointer-coarse:after:-inset-y-3.5"
          checked={skill.enabled}
          onCheckedChange={(on) => void ask(skill, on)}
          aria-label={
            skill.enabled
              ? t("shell.skills.ariaOn", { name: skill.name })
              : t("shell.skills.ariaOff", { name: skill.name })
          }
          title={title}
          data-testid="skill-switch"
        />
      ),
    };
  };

  const on = pending?.req.enabled ?? false;
  const dialog = (
    <PatchDialog
      open={pending !== null}
      onOpenChange={(open) => !open && setPending(null)}
      title={
        pending
          ? on
            ? t("shell.skills.switchOnTitle", { name: pending.skill.name })
            : t("shell.skills.switchOffTitle", { name: pending.skill.name })
          : ""
      }
      note={diff?.changed ? SWITCH_SCOPE_NOTE[diff.scope] : undefined}
      diff={diff}
      error={diffError}
      saving={change.isPending}
      confirmLabel={on ? t("shell.skills.switchOn") : t("shell.skills.switchOff")}
      onConfirm={() => pending && change.mutate(pending)}
    />
  );

  return { addon, dialog, refetch: () => list.refetch() };
}
