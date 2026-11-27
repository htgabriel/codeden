import type { AgentConfigScope, AgentSkill } from "@codeden/contracts";
import { i18n } from "@/lib/i18n";

/** A short label for a skill that isn't plainly on: "off", or a partial state's native name. */
export function skillStateLabel(s: Pick<AgentSkill, "enabled" | "visibility">): string | null {
  if (!s.enabled) return i18n.t("shell.skills.off");
  if (s.visibility === "name-only") return "name-only";
  if (s.visibility === "user-invocable-only") return "user-only";
  return null;
}

/** What a skill's state means, for tooltips. */
export function skillStateTitle(s: Pick<AgentSkill, "enabled" | "visibility" | "setIn">): string {
  const t = i18n.t;
  const what = !s.enabled
    ? t("shell.skills.titleOff")
    : s.visibility === "name-only"
      ? t("shell.skills.titleNameOnly")
      : s.visibility === "user-invocable-only"
        ? t("shell.skills.titleUserOnly")
        : t("shell.skills.titleOn");
  return s.setIn ? t("shell.skills.setIn", { what, file: s.setIn }) : what;
}

/** Who a switch written at this scope applies to (in the UI language). */
export const SWITCH_SCOPE_NOTE: Record<AgentConfigScope, string> = Object.defineProperties(
  {} as Record<AgentConfigScope, string>,
  {
    user: { get: () => i18n.t("shell.skills.note.user"), enumerable: true },
    project: { get: () => i18n.t("shell.skills.note.project"), enumerable: true },
    local: { get: () => i18n.t("shell.skills.note.local"), enumerable: true },
  },
);
