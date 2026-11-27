import type { RunnerConnectionStatus } from "@codeden/contracts";
import { i18n } from "@/lib/i18n";

export type RunnerStatusTone = "done" | "waiting" | "failed";

/**
 * The sidebar's one-line connection status and its tooltip. While the server waits for a
 * runner it is starting, the line says so; a runner that crashed during start-up shows why in
 * the tooltip (the server puts the end of `logs/runner.log` in `lastError`).
 */
export function runnerStatusText(
  socket: string,
  runner: RunnerConnectionStatus | null,
): { tone: RunnerStatusTone; label: string; detail: string } {
  const t = i18n.t;
  if (socket !== "open") {
    const connecting = t("messages.runner.connecting");
    return { tone: "failed", label: connecting, detail: connecting };
  }
  if (!runner) {
    const unknown = t("messages.runner.unknown");
    return { tone: "waiting", label: unknown, detail: unknown };
  }
  const providers = runner.providers.map((p) => p.displayName).join(", ");
  const note = runner.lastError ? `\n${runner.lastError}` : "";
  switch (runner.state) {
    case "connected":
      return {
        tone: "done",
        label: t("messages.runner.ready"),
        detail: `${t("messages.runner.connected", { providers })}${note}`,
      };
    case "starting":
      return {
        tone: "waiting",
        label: t("messages.runner.starting"),
        detail: `${t("messages.runner.starting")}${note}`,
      };
    default:
      return {
        tone: runner.lastError ? "failed" : "waiting",
        label: t("messages.runner.state", { state: runner.state }),
        detail: `${t("messages.runner.state", { state: runner.state })}${note}`,
      };
  }
}
