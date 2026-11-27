import type { McpServerState, Session } from "@codeden/contracts";
import { Link } from "@tanstack/react-router";
import { PlugZap, X } from "lucide-react";
import { Trans, useTranslation } from "@/lib/i18n";
import { dismissMcpProblems, useUndismissedMcpProblems } from "@/lib/mcp-dismissals";
import {
  CODEDEN_MCP_SERVER,
  mcpProblems,
  mcpStateLabel,
  mcpStatusSupported,
} from "@/lib/mcp-status";
import { useSnapshotData } from "@/lib/queries";

/** "db (failed)", with the provider's error as the tooltip. */
function ServerName({ server }: { server: McpServerState }) {
  return (
    <span title={server.error} className="whitespace-nowrap">
      <span className="font-mono">{server.name}</span>{" "}
      <span className="opacity-80">({mcpStateLabel[server.state]})</span>
    </span>
  );
}

/**
 * Below the thread header: the session's MCP servers whose tools the agent lacks (failed, or
 * a configured server waiting for sign-in), as its provider reports them
 * (`capabilities.mcpStatus`), and how to fix them. Goes away once they connect. Dismiss is
 * remembered in this browser for the project (for CodeDen's own server, the session): only a
 * server newly in trouble brings the notice back.
 */
export function McpNotice({ session }: { session: Session }) {
  const { t } = useTranslation();
  const provider = useSnapshotData(
    (s) => s.runner.providers.find((p) => p.id === session.provider),
    undefined,
  );
  const problems = useUndismissedMcpProblems(
    session,
    mcpProblems(session, mcpStatusSupported(provider)),
  );
  if (problems.length === 0) return null;

  const signIn = problems.some((s) => s.state === "needs_sign_in");
  const failed = problems.some((s) => s.state === "failed");
  const ownTools = problems.some((s) => s.name === CODEDEN_MCP_SERVER);
  const providerName = provider?.displayName ?? t("workbench.mcp.theAgent");
  const count = problems.length;
  return (
    <div
      role="status"
      className="flex items-start gap-2 border-b border-status-waiting/30 bg-status-waiting/[0.06] px-4 py-2 text-2xs text-status-waiting"
      data-testid="mcp-notice"
    >
      <PlugZap className="mt-px size-3.5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-foreground/90">
          {t("workbench.mcp.unavailable", { count })}{" "}
          {problems.map((s, i) => (
            <span key={s.name}>
              {i > 0 && ", "}
              <ServerName server={s} />
            </span>
          ))}
          .
        </p>
        <p className="text-muted-foreground">
          {failed && (
            <>
              <Trans
                i18nKey="workbench.mcp.checkIn"
                count={count}
                components={{
                  l: (
                    <Link
                      to="/agents"
                      search={{ tab: "mcp", project: session.projectId ?? "global" }}
                      className="underline underline-offset-2 hover:text-foreground"
                    />
                  ),
                }}
              />
              {signIn ? ". " : t("workbench.mcp.hoverHint")}
            </>
          )}
          {signIn && t("workbench.mcp.signIn", { provider: providerName })}
          {ownTools && <> {t("workbench.mcp.ownServer")}</>}
        </p>
      </div>
      <button
        type="button"
        onClick={() => dismissMcpProblems(session, problems)}
        className="-m-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={t("workbench.mcp.dismiss")}
        title={
          ownTools && count === 1 ? t("workbench.mcp.hideSession") : t("workbench.mcp.hideProject")
        }
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
