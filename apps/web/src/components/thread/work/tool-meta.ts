import {
  Brain,
  FilePen,
  FileText,
  Globe,
  ImageIcon,
  type LucideIcon,
  MousePointerClick,
  Plug,
  Search,
  SquareTerminal,
  Wrench,
} from "lucide-react";
import { i18n } from "@/lib/i18n";
import type { WorkEntry } from "@/lib/transcript/timeline";
import { outputSummary } from "./tool-summary";

export function entryIcon(e: WorkEntry): LucideIcon {
  if (e.kind === "reasoning") return Brain;
  if (isImageTool(e)) return ImageIcon;
  switch (e.toolKind) {
    case "command":
      return SquareTerminal;
    case "file_edit":
      return FilePen;
    case "file_read":
      return FileText;
    case "search":
      return Search;
    case "web":
      return Globe;
    case "mcp":
      return Plug;
    case "browser":
      return MousePointerClick;
    default:
      return Wrench;
  }
}

/** Short verb phrase, a monospace target and a one-line note for a work entry's row. */
export function entryLabel(e: WorkEntry): { verb: string; target?: string; meta?: string } {
  const t = i18n.t;
  if (e.kind === "reasoning")
    return {
      verb:
        e.status === "in_progress" ? t("workbench.tools.thinking") : t("workbench.tools.thought"),
      target: e.summary,
    };
  const running = e.status === "in_progress";
  switch (e.toolKind) {
    case "command":
      return {
        verb: running ? t("workbench.tools.running") : t("workbench.tools.ran"),
        target: e.command,
      };
    case "file_edit": {
      const add = e.changes.reduce((n, c) => n + (c.additions ?? 0), 0);
      const del = e.changes.reduce((n, c) => n + (c.deletions ?? 0), 0);
      const target =
        e.changes.length === 1
          ? e.changes[0]?.path
          : t("workbench.tools.files", { count: e.changes.length });
      return {
        verb: running ? t("workbench.tools.editing") : t("workbench.tools.edited"),
        target,
        meta: `+${add} −${del}`,
      };
    }
    case "file_read": {
      const range = e.startLine ? `:${e.startLine}${e.endLine ? `-${e.endLine}` : ""}` : "";
      return { verb: t("workbench.tools.read"), target: `${e.path}${range}` };
    }
    case "search":
      return {
        verb: t("workbench.tools.searched"),
        target: e.query,
        meta:
          e.matchCount !== undefined
            ? e.path
              ? t("workbench.tools.matchesIn", { count: e.matchCount, path: e.path })
              : t("workbench.tools.matches", { count: e.matchCount })
            : e.path,
      };
    case "web":
      return { verb: t("workbench.tools.fetched"), target: e.title ?? e.url ?? e.query };
    case "mcp":
      if (isImageTool(e))
        return {
          verb: running ? t("workbench.tools.generatingImage") : t("workbench.work.generatedImage"),
          target: e.title,
        };
      return { verb: e.title ?? `${e.server} · ${e.tool}`, meta: outputSummary(e.output?.text) };
    case "browser":
      return { verb: e.title ?? t("workbench.tools.browser", { action: e.action }), target: e.url };
    default:
      return { verb: e.title ?? e.toolName };
  }
}

export function isImageTool(e: WorkEntry): boolean {
  return e.kind === "tool_call" && e.toolKind === "mcp" && e.tool === "generate_image";
}

/** Artifact ids produced by a `generate_image` call. */
export function imageArtifacts(e: WorkEntry): string[] {
  if (e.kind !== "tool_call" || !isImageTool(e) || !e.output?.text) return [];
  try {
    const parsed = JSON.parse(e.output.text) as { artifactIds?: unknown };
    return Array.isArray(parsed.artifactIds)
      ? parsed.artifactIds.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}
