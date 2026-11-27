import type { ProviderInfo } from "@codeden/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClient } from "@/lib/api";
import { ago } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { useSnapshotData } from "@/lib/queries";
import { SettingRow, SettingsSection } from "./settings-ui";

/**
 * Settings > Providers: for providers whose own apps list every conversation on the machine as
 * the user's (`capabilities.vendorHistory`), hide the ones CodeDen started before it kept them
 * out. The list comes from CodeDen's own record of its sessions, and nothing is hidden until the
 * user confirms it.
 */
export function ProviderHistorySettings() {
  const { t } = useTranslation();
  const providers = useSnapshotData((s) => s.runner.providers, []);
  const withHistory = providers.filter((p) => p.capabilities.vendorHistory);
  if (withHistory.length === 0) return null;
  return (
    <SettingsSection
      title={t("prefs.providerHistory.title")}
      description={t("prefs.providerHistory.description")}
    >
      {withHistory.map((p) => (
        <HideHistoryRow key={p.id} provider={p} />
      ))}
    </SettingsSection>
  );
}

function HideHistoryRow({ provider }: { provider: ProviderInfo }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <SettingRow
      label={t("prefs.providerHistory.rowLabel", { provider: provider.displayName })}
      help={t("prefs.providerHistory.rowHelp")}
    >
      <Button size="xs" variant="outline" onClick={() => setOpen(true)}>
        <EyeOff /> {t("prefs.providerHistory.review")}
      </Button>
      {open && <HideHistoryDialog provider={provider} onClose={() => setOpen(false)} />}
    </SettingRow>
  );
}

function HideHistoryDialog({ provider, onClose }: { provider: ProviderInfo; onClose: () => void }) {
  const { t } = useTranslation();
  const client = useClient();
  const app = provider.displayName;
  const preview = useQuery({
    queryKey: ["provider-history", provider.id],
    queryFn: () => client.getProviderHistory(provider.id),
    gcTime: 0,
    retry: false,
  });
  const hide = useMutation({ mutationFn: () => client.hideProviderHistory(provider.id) });
  const entries = preview.data?.entries ?? [];
  const done = hide.data;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl" data-testid="hide-provider-history">
        <DialogHeader>
          <DialogTitle>{t("prefs.providerHistory.dialogTitle", { app })}</DialogTitle>
          <DialogDescription>
            {t("prefs.providerHistory.dialogDescription", { app })}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-1 text-[13px]" data-testid="hide-provider-history-result">
            <p>{t("prefs.providerHistory.hid", { count: done.hidden.length, app })}</p>
            {done.missing.length > 0 && (
              <p className="text-2xs text-muted-foreground">
                {t("prefs.providerHistory.missing", { count: done.missing.length })}
              </p>
            )}
            {done.failed.length > 0 && (
              <p className="text-2xs text-status-failed">
                {t("prefs.providerHistory.failed", { count: done.failed.length })}{" "}
                {done.failed[0]?.message}
              </p>
            )}
          </div>
        ) : preview.isPending ? (
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />{" "}
            {t("prefs.providerHistory.looking", { app })}
          </p>
        ) : preview.isError ? (
          <p className="text-[13px] text-status-failed">{preview.error.message}</p>
        ) : entries.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            {t("prefs.providerHistory.none", { app })}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-[13px]">
              {t("prefs.providerHistory.listed", { count: entries.length, app })}
            </p>
            <ul
              className="max-h-72 overflow-y-auto rounded-lg border border-border"
              data-testid="hide-provider-history-list"
            >
              {entries.map((e) => (
                <li key={e.resumeToken} className="border-b border-border px-3 py-2 last:border-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] font-medium">
                      {e.sessionTitle ?? (e.preview || e.resumeToken)}
                    </span>
                    {e.updatedAt && (
                      <span className="shrink-0 text-3xs text-muted-foreground">
                        {ago(e.updatedAt)}
                      </span>
                    )}
                  </div>
                  {e.sessionTitle && e.preview && (
                    <p className="truncate text-2xs text-muted-foreground">{e.preview}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {hide.isError && <p className="text-2xs text-status-failed">{hide.error.message}</p>}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {done ? t("prefs.providerHistory.close") : t("common.cancel")}
          </Button>
          {!done && (
            <Button
              size="sm"
              disabled={entries.length === 0 || hide.isPending}
              onClick={() => hide.mutate()}
            >
              {hide.isPending && <Loader2 className="animate-spin" />}
              {t("prefs.providerHistory.hide", { count: entries.length })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
