import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { useSnapshotData } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { SettingRow, SettingsSection } from "./settings-ui";

/** GitHub connection (§9): the `gh` login CodeDen reads at runtime, and which projects use it. */
export function GithubSettings() {
  const { t } = useTranslation();
  const client = useClient();
  const projects = useSnapshotData((s) => s.projects, []);
  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["github", "connection"],
    queryFn: () => client.github.connection(),
  });
  const connected = data?.connected ?? false;
  return (
    <SettingsSection title="GitHub" description={t("prefs.github.description")}>
      <SettingRow
        label={t("prefs.github.connection")}
        help={
          error
            ? error.message
            : connected
              ? t(data?.login ? "prefs.github.signedInAs" : "prefs.github.signedIn", {
                  login: data?.login ?? "",
                  via:
                    data?.source === "keychain"
                      ? t("prefs.github.viaKeychain")
                      : t("prefs.github.viaCli"),
                })
              : (data?.message ?? t("prefs.github.checking"))
        }
      >
        <div className="flex items-center gap-2" data-testid="github-connection">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              connected ? "text-status-done" : "text-status-waiting",
            )}
          >
            {connected ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <CircleAlert className="size-3.5" />
            )}
            {data
              ? connected
                ? t("prefs.github.connected")
                : t("prefs.github.notConnected")
              : "…"}
          </span>
          <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={cn(isFetching && "animate-spin")} /> {t("prefs.github.recheck")}
          </Button>
        </div>
      </SettingRow>
      {projects.map((p) => (
        <SettingRow
          key={p.id}
          label={p.name}
          help={
            p.kind === "github" ? `${p.github.owner}/${p.github.repo}` : t("prefs.github.noRemote")
          }
        >
          <span className="text-2xs text-muted-foreground">
            {p.kind === "github" ? t("prefs.github.prFlow") : t("prefs.github.localOnly")}
          </span>
        </SettingRow>
      ))}
    </SettingsSection>
  );
}
