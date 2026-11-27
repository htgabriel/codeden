import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Code2,
  Monitor,
  MoreHorizontal,
  Plus,
  RotateCw,
  Server,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClient } from "@/lib/api";
import { VIEWPORTS } from "@/lib/browser-input";
import { useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";
import { cn } from "@/lib/utils";
import type { ViewportMode } from "./use-panel-viewport";
import type { SessionBrowser } from "./use-session-browser";

/** Ports probed for dev servers besides the runner's own child processes. */
export const PROBE_PORTS = [3000, 3001, 4173, 4321, 5173, 5174, 8000, 8080];

const iconBtn = "text-muted-foreground";

/**
 * Back / forward / reload, the address bar, the "Agent is acting" chip, and the viewport and
 * dev-server menus. With a native view (`native`) the page has the panel's size and the menu
 * offers DevTools instead of device sizes.
 */
export function BrowserToolbar({
  sessionId,
  browser,
  native = false,
  viewportMode,
  onViewportMode,
}: {
  sessionId: string;
  browser: SessionBrowser;
  native?: boolean;
  viewportMode: ViewportMode;
  onViewportMode: (mode: ViewportMode) => void;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const tab = browser.activeTab;
  const [url, setUrl] = useState(tab?.url ?? "");
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setUrl(tab?.url ?? "");
  }, [tab?.url]);

  const history = (action: "back" | "forward" | "reload") =>
    void browser.run(t("workbench.browser.navigationFailed"), () =>
      client.browser.history(sessionId, action, tab?.tabId),
    );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    editing.current = false;
    const target = url.trim();
    if (!target) return;
    void browser.run(t("workbench.browser.navigationFailed"), () =>
      client.browser.navigate(sessionId, target, tab?.tabId),
    );
  };
  const setSize = (id: string) => {
    if (id === "fit" || VIEWPORTS.some((v) => v.id === id)) onViewportMode(id as ViewportMode);
  };
  const applied = browser.viewport;

  return (
    <form
      onSubmit={submit}
      className="flex h-10 shrink-0 items-center gap-0.5 border-b border-border px-2"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={iconBtn}
        onClick={() => history("back")}
        aria-label={t("workbench.browser.back")}
      >
        <ArrowLeft />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={iconBtn}
        onClick={() => history("forward")}
        aria-label={t("workbench.browser.forward")}
      >
        <ArrowRight />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={iconBtn}
        onClick={() => history("reload")}
        aria-label={t("workbench.browser.reload")}
      >
        <RotateCw />
      </Button>
      <input
        value={url}
        onFocus={(e) => {
          editing.current = true;
          e.currentTarget.select();
        }}
        onBlur={() => (editing.current = false)}
        onChange={(e) => setUrl(e.target.value)}
        aria-label={t("workbench.browser.address")}
        placeholder={t("workbench.browser.addressPlaceholder")}
        className="mx-1 h-7 min-w-0 flex-1 rounded-md border border-border bg-background/60 px-2 font-mono text-2xs outline-none focus:border-ring"
      />
      {browser.agentActing && <AgentActingChip />}
      <DevServerMenu sessionId={sessionId} browser={browser} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={iconBtn}
            aria-label={t("workbench.browser.options")}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {native ? (
            <DropdownMenuItem
              className="text-xs"
              onSelect={() => platform.nativeBrowser?.inspect(sessionId)}
            >
              <Code2 /> {t("workbench.browser.inspect")}
            </DropdownMenuItem>
          ) : (
            <ViewportItems
              mode={viewportMode}
              onMode={setSize}
              applied={applied?.mine ? applied : null}
            />
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-xs"
            onSelect={() =>
              void browser.run(t("workbench.browser.newTabFailed"), () =>
                client.browser.newTab(sessionId),
              )
            }
          >
            <Plus /> {t("workbench.browser.newTab")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            variant="destructive"
            onSelect={() => void browser.closeBrowser()}
          >
            <X /> {t("workbench.browser.close")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </form>
  );
}

/** Fit to panel, or a fixed device size (screencast only: a native view has the panel's size). */
function ViewportItems({
  mode,
  onMode,
  applied,
}: {
  mode: ViewportMode;
  onMode: (id: string) => void;
  /** The applied size when the page follows this panel. */
  applied: { width: number; height: number } | null;
}) {
  const { t } = useTranslation();
  return (
    <>
      <DropdownMenuLabel className="flex items-center gap-2 text-2xs">
        <Monitor className="size-3.5" /> {t("workbench.browser.viewport")}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup value={mode} onValueChange={onMode}>
        <DropdownMenuRadioItem value="fit" className="text-xs">
          {t("workbench.browser.fit")}
          {mode === "fit" && applied && (
            <span className="ml-auto font-mono text-3xs text-muted-foreground">
              {applied.width}×{applied.height}
            </span>
          )}
        </DropdownMenuRadioItem>
        {VIEWPORTS.map((v) => (
          <DropdownMenuRadioItem key={v.id} value={v.id} className="text-xs">
            {v.label}
            <span className="ml-auto font-mono text-3xs text-muted-foreground">
              {v.width}×{v.height}
            </span>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}

/** Shown while an agent drives the browser; your own input still goes straight to the page. */
function AgentActingChip() {
  const { t } = useTranslation();
  return (
    <span
      data-testid="browser-agent-acting"
      role="status"
      title={t("workbench.browser.agentActingHint")}
      className="mr-1 flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-status-running/40 bg-status-running/10 px-2 text-3xs font-medium text-status-running"
    >
      <span className="size-1.5 animate-pulse rounded-full bg-status-running" />
      <Bot className="size-3" />
      <span className="max-[380px]:sr-only">{t("workbench.browser.agentActing")}</span>
    </span>
  );
}

/** Running dev servers, opened in a new tab (or the first tab when the browser is closed). */
export function DevServerMenu({
  sessionId,
  browser,
  variant = "icon",
}: {
  sessionId: string;
  browser: SessionBrowser;
  variant?: "icon" | "button";
}) {
  const { t } = useTranslation();
  const client = useClient();
  const [open, setOpen] = useState(false);
  const servers = useQuery({
    queryKey: ["dev-servers"],
    queryFn: () => client.browser.devServers(PROBE_PORTS),
    enabled: open,
    staleTime: 5_000,
  });
  const launch = (port: number, url: string) => {
    if (browser.open)
      void browser.run(t("workbench.browser.devServerFailed"), () =>
        client.browser.openDevServer(sessionId, port),
      );
    else void browser.openBrowser(url);
  };
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={iconBtn}
            aria-label={t("workbench.browser.devServers")}
          >
            <Server />
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline">
            <Server /> {t("workbench.browser.devServers")}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-2xs">
          {t("workbench.browser.runningDevServers")}
        </DropdownMenuLabel>
        {servers.isLoading && (
          <div className="px-2 py-1.5 text-2xs text-muted-foreground">
            {t("workbench.browser.looking")}
          </div>
        )}
        {servers.data?.servers.length === 0 && (
          <div className="px-2 py-1.5 text-2xs text-muted-foreground">
            {t("workbench.browser.noneFound")}
          </div>
        )}
        {servers.data?.servers.map((s) => (
          <DropdownMenuItem key={s.port} className="text-xs" onSelect={() => launch(s.port, s.url)}>
            <span className={cn("size-1.5 rounded-full bg-status-done")} />
            <span className="font-mono">{s.url.replace(/^https?:\/\//, "")}</span>
            {s.pid !== null && (
              <span className="ml-auto text-3xs text-muted-foreground">
                {t("workbench.browser.pid", { pid: s.pid })}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
