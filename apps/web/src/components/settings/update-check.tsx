import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, RotateCcw } from "lucide-react";
import { canUpdate } from "@/components/shell/update-banner";
import { Button } from "@/components/ui/button";
import { useClient } from "@/lib/api";
import { Trans, useTranslation } from "@/lib/i18n";
import { updatesKey, useUpdateActions, useUpdates } from "@/lib/updates";

/**
 * About (§16): the running version against the latest on npm with "Check now" and "Update
 * now", the side-by-side installed versions, and "Roll back to the previous version".
 */
export function UpdateCheck() {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const { data } = useUpdates();
  const actions = useUpdateActions();
  const refresh = useMutation({
    mutationFn: () => client.getUpdates({ refresh: true }),
    onSuccess: (status) => queryClient.setQueryData(updatesKey, status),
  });
  if (!data) return null;
  const busy = data.state === "installing" || data.state === "restarting";
  let text: string;
  if (!data.enabled) text = t("prefs.updates.off");
  else if (data.state === "installing")
    text = t("prefs.updates.installing", { v: data.target ?? "" });
  else if (data.state === "restarting")
    text = t("prefs.updates.restarting", { v: data.target ?? "" });
  else if (data.state === "installed")
    text = t("prefs.updates.installed", { v: data.target ?? "" });
  else if (data.updateAvailable) text = t("prefs.updates.available", { v: data.latest ?? "" });
  else if (data.error) text = t("prefs.updates.checkFailed", { error: data.error });
  else if (data.latest) text = t("prefs.updates.latest");
  else text = t("prefs.updates.notChecked");
  const rollbackLabel = data.rollbackTo
    ? t("prefs.updates.rollbackTo", { v: data.rollbackTo })
    : t("prefs.updates.rollbackPrevious");
  const showInstall = data.updateAvailable && canUpdate(data) && data.state === "idle";

  return (
    <div className="mt-2 space-y-1.5 text-2xs" data-testid="update-check">
      <div className="flex flex-wrap items-center gap-2">
        <span className={data.updateAvailable ? "text-status-waiting" : "text-muted-foreground"}>
          {text}
        </span>
        {/* One group, so on a narrow card the buttons wrap together under the text. */}
        {(showInstall || data.enabled) && (
          <div className="flex flex-wrap items-center gap-2">
            {showInstall && (
              <Button size="xs" onClick={() => actions.install.mutate()} disabled={busy}>
                {t("prefs.updates.updateNow")}
              </Button>
            )}
            {data.enabled && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => refresh.mutate()}
                disabled={refresh.isPending}
              >
                <RefreshCw className={refresh.isPending ? "animate-spin" : undefined} />{" "}
                {t("prefs.updates.checkNow")}
              </Button>
            )}
          </div>
        )}
      </div>
      {data.source === "source" ? (
        <p className="text-muted-foreground">
          <Trans
            i18nKey="prefs.updates.fromSource"
            components={{
              code: <code className="font-mono">git pull && pnpm install && pnpm build</code>,
            }}
          />
        </p>
      ) : (
        data.installed.length > 0 && (
          <p className="text-muted-foreground" data-testid="installed-versions">
            {t("prefs.updates.installedList")}{" "}
            {data.installed
              .map(
                (v) =>
                  `${v.version}${v.current ? t("prefs.updates.current") : ""}${v.valid ? "" : t("prefs.updates.broken")}`,
              )
              .join(", ")}
          </p>
        )
      )}
      {data.state === "failed" && data.installError && (
        <p className="text-status-failed">
          {t("prefs.updates.lastFailed", { error: data.installError })}
        </p>
      )}
      {data.warning && <p className="text-status-failed">{data.warning}</p>}
      {data.canRollback && (
        <Button
          size="xs"
          variant="outline"
          disabled={busy || actions.rollback.isPending}
          onClick={() => actions.rollback.mutate()}
        >
          <RotateCcw /> {rollbackLabel}
        </Button>
      )}
      {actions.rollback.error && (
        <p className="text-status-failed">{actions.rollback.error.message}</p>
      )}
    </div>
  );
}
