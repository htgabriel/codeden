import { providersWith } from "@codeden/contracts";

/** The Agents page's tabs; apart from the page so the router can check `?tab=` without it. */
export type AgentTab = "memory" | "skills" | "subagents" | "mcp" | "hooks";

/** The tabs on offer; Hooks only when some provider's native config has hooks. Labels: `pages.agents.tabs`. */
export const AGENT_TABS: { id: AgentTab }[] = [
  { id: "memory" },
  { id: "skills" },
  { id: "subagents" },
  { id: "mcp" },
  ...(providersWith("hooks").length > 0 ? [{ id: "hooks" as const }] : []),
];
