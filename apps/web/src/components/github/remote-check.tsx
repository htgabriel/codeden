import type { Project, RefreshProjectResponse } from "@codeden/contracts";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useClient } from "@/lib/api";
import { Trans, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const connected = (r: RefreshProjectResponse) =>
  r.outcome === "github_connected" || r.outcome === "github_changed";

/**
 * Detect a project's git checkout and GitHub remote again (§9): for a folder that got `git init`
 * or a GitHub `origin` after it was added. The project itself updates through the snapshot;
 * the result line ("Connected to owner/repo", "Still no GitHub remote on origin") shows next to
 * the button, and a toast confirms a new connection (the button's view usually goes away then).
 */
export function CheckRemoteButton({
  projectId,
  layout = "stacked",
  className,
}: {
  projectId: string;
  /** `stacked`: centred under the button (empty states); `inline`: on one line (lists). */
  layout?: "stacked" | "inline";
  className?: string;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const check = useMutation({
    mutationFn: () => client.refreshProject(projectId),
    onSuccess: (res) => {
      if (connected(res) && res.changed) toast.success(res.message);
    },
  });
  const result = check.data;
  const text = check.isError
    ? t("shell.github.checkFailed", { error: check.error.message })
    : result?.message;
  return (
    <span
      className={cn(
        "flex gap-1.5",
        layout === "stacked" ? "flex-col items-center" : "flex-wrap items-center",
        className,
      )}
    >
      <Button
        size="xs"
        variant="outline"
        onClick={() => check.mutate()}
        disabled={check.isPending}
        data-testid="check-remote"
      >
        <RefreshCw className={cn(check.isPending && "animate-spin")} />
        {check.isPending ? t("shell.github.checking") : t("shell.github.checkAgain")}
      </Button>
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "text-2xs",
          check.isError
            ? "text-status-failed"
            : result && connected(result)
              ? "text-status-done"
              : "text-muted-foreground",
        )}
      >
        {text}
      </span>
    </span>
  );
}

/**
 * A GitHub project whose folder lost its GitHub `origin` (§9): CodeDen never downgrades it on
 * its own. The user restores the remote and checks again, or makes the project local-only.
 */
export function RemoteWarningBanner({ project }: { project: Project }) {
  const { t } = useTranslation();
  const client = useClient();
  const disconnect = useMutation({
    mutationFn: () => client.disconnectGithub(project.id),
    onSuccess: () => toast.success(t("shell.github.nowLocalOnly", { name: project.name })),
    onError: (e) => toast.error(t("shell.github.disconnectFailed"), { description: e.message }),
  });
  if (project.kind !== "github" || !project.remoteWarning) return null;
  const { owner, repo } = project.github;
  const { remoteUrl } = project.remoteWarning;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-status-waiting/30 bg-status-waiting/10 px-4 py-3"
      data-testid="remote-warning"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-waiting" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[13px] font-medium">{t("shell.github.remoteMissing")}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          <Trans
            i18nKey={remoteUrl ? "shell.github.remoteChanged" : "shell.github.remoteGone"}
            values={{ url: remoteUrl ?? "", repo: `${owner}/${repo}` }}
            components={{ code: <code className="font-mono" /> }}
          />
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <CheckRemoteButton projectId={project.id} layout="inline" />
          <Button
            size="xs"
            variant="ghost"
            onClick={() => disconnect.mutate()}
            disabled={disconnect.isPending}
          >
            {t("shell.github.makeLocalOnly")}
          </Button>
        </div>
      </div>
    </div>
  );
}
