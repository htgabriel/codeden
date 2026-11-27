import type { LoadedHooks } from "@codeden/contracts";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { hookSummary } from "@/components/agents/hook-form";
import { i18n, Trans } from "@/lib/i18n";

/** One row of a What's loaded list. */
export interface LoadedRow {
  key: string;
  label: string;
  detail?: string;
  /** A second, muted line (what a hook runs). */
  sub?: string;
  title?: string;
  /** Listed but not in effect (hooks while `disableAllHooks` is on). */
  dim?: boolean;
  /** A live state after the detail (an MCP server's), as a coloured dot and a label. */
  state?: { label: string; dot: string };
}

/**
 * Hooks as rows: event and matcher, scope, and what each one runs; the file is the tooltip. A
 * group with no matcher (or an empty one) matches everything, shown as `all`.
 */
export function hookRows(loaded: LoadedHooks): LoadedRow[] {
  const off = loaded.disabledBy !== null;
  return loaded.hooks.map((h, i) => ({
    key: `${h.file}:${h.event}:${h.groupIndex ?? i}:${h.handlerIndex ?? i}`,
    label: `${h.event} · ${h.matcher || i18n.t("workbench.loaded.all")}`,
    detail: h.scope,
    sub:
      h.handler.type === "command"
        ? hookSummary(h.handler)
        : `${h.handler.type}: ${hookSummary(h.handler)}`,
    title: `${h.file}${off ? `\n${i18n.t("workbench.loaded.notRunning")}` : ""}`,
    dim: off,
  }));
}

/**
 * What to know before reading the list:
 * - hooks are off for the session, and which file decided it (`disabledBy`);
 * - every other file that sets `disableAllHooks: true`: while hooks are off it "also" sets it;
 *   while they're on, a higher-precedence file set it to `false`, so its `true` is overridden;
 * - files that can't be read.
 */
export function hookNotices(loaded: LoadedHooks): ReactNode {
  const items: Array<{ key: string; tone: "warn" | "error"; text: ReactNode }> = [];
  const winner = loaded.disabledBy;
  if (winner) {
    items.push({
      key: "off",
      tone: "warn",
      text: (
        <Trans
          i18nKey="workbench.loaded.hooksOff"
          values={{ file: winner }}
          components={{ path: <Path file={winner} /> }}
        />
      ),
    });
  }
  for (const s of loaded.sources) {
    if (s.error) {
      items.push({ key: `error:${s.file}`, tone: "error", text: s.error });
    } else if (s.disableAllHooks && s.file !== winner) {
      items.push({
        key: `sets:${s.file}`,
        tone: "warn",
        text: winner ? (
          <Trans
            i18nKey="workbench.loaded.alsoSets"
            values={{ file: s.file }}
            components={{ path: <Path file={s.file} /> }}
          />
        ) : (
          <Trans
            i18nKey="workbench.loaded.overridden"
            values={{ file: s.file }}
            components={{ path: <Path file={s.file} /> }}
          />
        ),
      });
    }
  }
  if (items.length === 0) return null;
  return (
    <div className="space-y-1 border-b border-border px-3 py-1.5">
      {items.map((n) => (
        <p
          key={n.key}
          className={`flex gap-1.5 text-3xs ${n.tone === "error" ? "text-status-failed" : "text-status-waiting"}`}
        >
          <AlertTriangle className="mt-px size-3 shrink-0" />
          <span className="min-w-0 break-words">{n.text}</span>
        </p>
      ))}
    </div>
  );
}

function Path({ file }: { file: string }) {
  return (
    <span className="font-mono" title={file}>
      {file}
    </span>
  );
}
