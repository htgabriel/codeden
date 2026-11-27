import type { UpdateStatus } from "@codeden/contracts";
import { AlertTriangle, ArrowUpCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trans, useTranslation } from "@/lib/i18n";
import {
  dismissUpdate,
  updateDismissed,
  updatedTo,
  useHandover,
  useHandoverStore,
  useUpdateActions,
  useUpdates,
} from "@/lib/updates";
import { cn } from "@/lib/utils";
import { WhatsNewDialog } from "./whats-new-dialog";

type Tone = "info" | "busy" | "done" | "warn";

// Stacked, the icon sits beside the message's first line; in one row it is centred in the row.
const icon = "mt-0.5 size-4 shrink-0 @[40rem]:mt-0";
const icons: Record<Tone, ReactNode> = {
  info: <ArrowUpCircle className={cn(icon, "text-status-running")} />,
  busy: <Loader2 className={cn(icon, "animate-spin text-status-running")} />,
  done: <CheckCircle2 className={cn(icon, "text-status-done")} />,
  warn: <AlertTriangle className={cn(icon, "text-status-failed")} />,
};

/**
 * One banner row when it gets 40rem (640 px) or more: icon, message, actions, ×. Narrower (a
 * phone, or a desktop column squeezed by the sidebar and panel) it stacks so the message keeps
 * the full width: the icon and message on top, the actions on a row below (wrapping if needed,
 * their text in line with the message) and × in the top-right corner. A container query, so it
 * follows the space the banner gets rather than the window's width.
 */
function Bar({
  tone,
  state,
  children,
  actions,
  onClose,
}: {
  tone: Tone;
  state: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="@container shrink-0 px-3 pt-2">
      <div
        role="status"
        data-testid="update-banner"
        data-state={state}
        className={cn(
          "relative flex flex-col gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm shadow-xs @[40rem]:flex-row @[40rem]:flex-wrap @[40rem]:items-center @[40rem]:gap-x-3",
          tone === "warn" && "border-status-failed/40",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-start gap-2 @[40rem]:flex-1 @[40rem]:items-center @[40rem]:gap-3",
            onClose && "pr-6 @[40rem]:pr-0",
          )}
        >
          {icons[tone]}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-1.5 pl-4 @[40rem]:pl-0">{actions}</div>
        )}
        {onClose && (
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={t("shell.attention.dismiss")}
            className="absolute top-1.5 right-1.5 @[40rem]:static"
            onClick={onClose}
          >
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * The self-update banner (§16): a newer version on open ("What's new · Update now · Later"),
 * then install progress, the restart hand-over and failures with Retry. Non-blocking: it sits
 * above the page and never takes focus.
 */
export function UpdateBanner() {
  const { t } = useTranslation();
  const { data } = useUpdates();
  const actions = useUpdateActions();
  const phase = useHandoverStore((s) => s.phase);
  const handoverTarget = useHandoverStore((s) => s.target);
  const [notesOpen, setNotesOpen] = useState(false);
  const [hidden, setHidden] = useState<string | null>(null);
  useHandover(data);
  if (!data) return null;
  const install = () => actions.install.mutate();
  const requestError = actions.install.error ?? actions.restart.error;

  const view = bannerView(data, phase, handoverTarget);
  if (!view || hidden === view.key) return null;
  const restartToFinish = (
    <Trans
      i18nKey="shell.update.restartToFinish"
      values={{ command: data.restartCommand ?? "" }}
      components={{ code: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs" /> }}
    />
  );
  const later = () => {
    if (data.latest) dismissUpdate(data.latest);
    setHidden(view.key);
  };

  switch (view.kind) {
    case "updated":
      return (
        <Bar tone="done" state="updated" onClose={() => setHidden(view.key)}>
          <span className="font-medium">
            {t("shell.update.updated", { version: view.version })}
          </span>{" "}
          <span className="text-muted-foreground">{t("shell.update.carryOn")}</span>
        </Bar>
      );
    case "handover":
      return (
        <Bar tone="busy" state="restarting">
          {t("shell.update.handover", { version: view.version })}
        </Bar>
      );
    case "timeout":
      return (
        <Bar tone="warn" state="timeout" onClose={() => setHidden(view.key)}>
          {restartToFinish}
        </Bar>
      );
    case "installing":
      return (
        <Bar tone="busy" state="installing">
          <span className="font-medium">
            {t("shell.update.installing", { version: view.version })}
          </span>{" "}
          <span className="truncate text-muted-foreground" data-testid="update-progress">
            {data.progress}
          </span>
        </Bar>
      );
    case "failed":
      return (
        <Bar
          tone="warn"
          state="failed"
          onClose={() => setHidden(view.key)}
          actions={
            canUpdate(data) && (
              <Button size="xs" onClick={install} disabled={actions.install.isPending}>
                {t("shell.update.retry")}
              </Button>
            )
          }
        >
          {t("shell.update.failed", { version: view.version, error: data.installError ?? "" })}
        </Bar>
      );
    case "installed":
      return data.canRestart ? (
        <Bar
          tone="done"
          state="installed"
          onClose={() => setHidden(view.key)}
          actions={
            <Button size="xs" onClick={() => actions.restart.mutate()}>
              {t("shell.update.restartNow")}
            </Button>
          }
        >
          {t("shell.update.installed", { version: view.version })}
        </Bar>
      ) : (
        <Bar tone="done" state="installed" onClose={() => setHidden(view.key)}>
          {restartToFinish}
        </Bar>
      );
    case "available":
      return (
        <>
          <Bar
            tone="info"
            state="available"
            onClose={later}
            actions={
              <>
                <Button size="xs" variant="ghost" onClick={() => setNotesOpen(true)}>
                  {t("shell.update.whatsNew")}
                </Button>
                {canUpdate(data) && (
                  <Button size="xs" onClick={install} disabled={actions.install.isPending}>
                    {t("shell.update.updateNow")}
                  </Button>
                )}
                <Button size="xs" variant="ghost" onClick={later}>
                  {t("shell.update.later")}
                </Button>
              </>
            }
          >
            <span className="font-medium">
              {t("shell.update.available", { version: view.version })}
            </span>{" "}
            <span className="text-muted-foreground">
              {data.source === "source"
                ? t("shell.update.fromSource")
                : t("shell.update.youreOn", { current: data.current })}
            </span>
            {requestError && (
              <span className="ml-1 text-status-failed">{requestError.message}</span>
            )}
          </Bar>
          <WhatsNewDialog
            version={view.version}
            open={notesOpen}
            onOpenChange={setNotesOpen}
            onUpdate={canUpdate(data) ? install : undefined}
          />
        </>
      );
  }
}

/** The server can install updates itself: an npm install or the desktop app (not a checkout). */
export function canUpdate(data: UpdateStatus): boolean {
  return data.source !== "source";
}

interface BannerView {
  kind: "updated" | "handover" | "timeout" | "installing" | "failed" | "installed" | "available";
  version: string;
  key: string;
}

/** Which banner (if any) the status calls for; `key` identifies it for "dismiss". */
export function bannerView(
  data: UpdateStatus,
  phase: "idle" | "waiting" | "timeout",
  handoverTarget: string | null,
): BannerView | null {
  const version = data.target ?? data.latest ?? data.current;
  const make = (kind: BannerView["kind"], v = version) => ({
    kind,
    version: v,
    key: `${kind}:${v}`,
  });
  if (phase === "timeout" && handoverTarget) return make("timeout", handoverTarget);
  if (phase === "waiting" && handoverTarget) return make("handover", handoverTarget);
  if (data.state === "restarting") return make("handover");
  if (data.state === "installing") return make("installing");
  if (data.state === "failed") return make("failed");
  if (data.state === "installed") return make("installed");
  if (updatedTo && updatedTo === data.current) return make("updated", updatedTo);
  if (data.updateAvailable && data.latest && !updateDismissed(data.latest)) {
    return make("available", data.latest);
  }
  return null;
}
