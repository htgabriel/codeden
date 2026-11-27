import type { ForkOrigin, Session } from "@codeden/contracts";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  ArrowRightLeft,
  Bot,
  ClipboardCopy,
  Copy,
  FileDown,
  FolderTree,
  GitBranch,
  GitFork,
  MoreHorizontal,
  PanelRight,
  RotateCcw,
  ScanSearch,
  Square,
  SquareTerminal,
  Workflow,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { StatusDot } from "@/components/common/status-dot";
import { ReadOnlyBadge, RoleBadge } from "@/components/orchestration/role-badge";
import { useStartFresh } from "@/components/orchestration/start-fresh";
import { MobileNavButton } from "@/components/shell/mobile-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SessionCostChip } from "@/components/usage/session-cost";
import { useClient } from "@/lib/api";
import { copyWithFeedback } from "@/lib/copy";
import { forkOriginLabel, isHandoff, isReview } from "@/lib/fork-origin";
import { statusLabel } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { useProject, useSession } from "@/lib/queries";
import { MARKDOWN_HINT, useSessionActions } from "@/lib/session-actions";
import { hasRightPanel } from "@/lib/session-workspace";
import { cn } from "@/lib/utils";
import { useViewport } from "@/lib/viewport";
import { useLayoutStore } from "@/stores/layout";
import { SessionGithubBadges } from "./session-github-badges";

function Chip({
  icon,
  children,
  title,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-6 max-w-44 items-center gap-1.5 rounded-md border border-border/80 px-2 text-2xs text-muted-foreground [&_svg]:size-3",
        className,
      )}
    >
      {icon}
      <span className="truncate font-mono">{children}</span>
    </span>
  );
}

/** Where a forked, handed-off or reviewing session came from, linking to the source session. */
function ForkedFromChip({ origin, className }: { origin: ForkOrigin; className?: string }) {
  const { t } = useTranslation();
  const source = useSession(origin.sessionId);
  const title = source
    ? (source.title ?? source.purpose)
    : t("orchestrator.threadHeader.anotherSession");
  const label = forkOriginLabel(origin);
  return (
    <Link
      to="/sessions/$sessionId"
      params={{ sessionId: origin.sessionId }}
      title={`${label.from} ${title}`}
      className={cn(
        "inline-flex h-6 max-w-44 items-center gap-1.5 rounded-md border border-border/80 px-2 text-2xs text-muted-foreground hover:border-primary/40 hover:text-foreground [&_svg]:size-3",
        className,
      )}
    >
      {isReview(origin) ? <ScanSearch /> : isHandoff(origin) ? <ArrowRightLeft /> : <GitFork />}
      <span className="truncate">
        {label.chip} {title}
      </span>
    </Link>
  );
}

/**
 * Top bar of a thread: title, status, branch, worktree, cost and actions. The model and the
 * permission level live under the message box (the composer), not here, so they aren't shown
 * twice.
 */
export function ThreadHeader({ session, running }: { session: Session; running: boolean }) {
  const client = useClient();
  const { t } = useTranslation();
  const project = useProject(session.projectId);
  const layout = useLayoutStore();
  const { sheetPanels, phone } = useViewport();
  const panelOpen = sheetPanels ? layout.rightSheetOpen : layout.rightOpen;
  const stop = useMutation({
    mutationFn: () => client.interrupt(session.id),
    onSuccess: () => toast(t("orchestrator.threadHeader.turnStopped")),
  });
  // Stop, archive and unarchive are shared with the sidebar's session row menu.
  const actions = useSessionActions(session);
  // The orchestrator and the PMs start over instead of being archived (§8.1).
  const fresh = useStartFresh(session, running);

  const title =
    session.role === "orchestrator"
      ? t("orchestrator.roleBadge.orchestrator")
      : session.role === "pm"
        ? t("orchestrator.roleBadge.pm")
        : (session.title ?? session.purpose);

  return (
    <header className="@container flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-4">
      <MobileNavButton />
      {session.role === "agent" ? (
        <StatusDot status={session.status} />
      ) : (
        <RoleBadge role={session.role} short />
      )}
      <div className="flex min-w-0 shrink items-baseline gap-2 overflow-hidden sm:min-w-[10rem]">
        {project && session.role !== "orchestrator" && (
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="hidden shrink-0 text-[13px] text-muted-foreground hover:text-foreground @[48rem]:inline"
          >
            {project.name} <span className="text-muted-foreground/50">/</span>
          </Link>
        )}
        <h1 className="min-w-0 truncate text-[14px] font-medium">{title}</h1>
        <span
          className={cn(
            "shrink-0 text-2xs",
            session.status === "waiting" ? "text-status-waiting" : "text-muted-foreground",
          )}
        >
          {statusLabel[session.status]}
          {session.archivedAt && t("orchestrator.threadHeader.archived")}
        </span>
      </div>

      <div className="ml-1 hidden min-w-0 shrink items-center gap-1.5 overflow-hidden @[36rem]:flex">
        {session.branch && (
          <Chip
            className="hidden @[54rem]:inline-flex"
            icon={<GitBranch />}
            title={t("orchestrator.threadHeader.base", { branch: session.baseBranch ?? "main" })}
          >
            {session.branch}
          </Chip>
        )}
        {session.worktreePath && (
          <Chip
            className={cn(
              "hidden @[70rem]:inline-flex",
              session.worktreeRemovedAt && "border-dashed opacity-60",
            )}
            icon={<FolderTree />}
            title={
              session.worktreeRemovedAt
                ? t("orchestrator.threadHeader.worktreeRemoved", {
                    branch: session.branch ?? t("orchestrator.threadHeader.itsBranch"),
                  })
                : session.worktreePath
            }
          >
            {session.worktreePath.split(/[\\/]/).at(-1)}
          </Chip>
        )}
        {session.forkedFrom && (
          <ForkedFromChip origin={session.forkedFrom} className="hidden @[48rem]:inline-flex" />
        )}
        <SessionCostChip sessionId={session.id} className="hidden @[40rem]:inline-flex" />
        {/* Agents show their model and permissions under the message box; the PM and the
            orchestrator have no permission picker there, so their read-only badge stays. */}
        {session.role !== "agent" && <ReadOnlyBadge />}
        <SessionGithubBadges session={session} className="hidden @[44rem]:inline-flex" />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        {running && (
          <Button
            size="xs"
            variant="outline"
            className="mr-1 gap-1.5"
            onClick={() => stop.mutate()}
            disabled={stop.isPending}
          >
            <Square className="size-2.5 fill-current" /> {t("orchestrator.threadHeader.stop")}
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "text-muted-foreground",
                layout.drawerOpen && "bg-accent text-foreground",
                // Phones use the panel's Terminal tab instead of the bottom drawer.
                phone && "hidden",
              )}
              onClick={() => layout.toggleDrawer()}
              aria-label={t("orchestrator.threadHeader.toggleTerminal")}
            >
              <SquareTerminal />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("orchestrator.threadHeader.terminalTooltip")}</TooltipContent>
        </Tooltip>
        {hasRightPanel(session) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn("text-muted-foreground", panelOpen && "bg-accent text-foreground")}
                onClick={() => layout.toggleRight(!panelOpen)}
                aria-label={t("orchestrator.threadHeader.toggleRightPanel")}
              >
                <PanelRight />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("orchestrator.threadHeader.rightPanelTooltip")}</TooltipContent>
          </Tooltip>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label={t("orchestrator.threadHeader.more")}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {session.branch && (
              <DropdownMenuItem
                onSelect={() =>
                  void copyWithFeedback(
                    session.branch ?? "",
                    t("orchestrator.threadHeader.branchCopied"),
                  )
                }
              >
                <Copy /> {t("orchestrator.threadHeader.copyBranch")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={actions.copyMarkdown}>
              <ClipboardCopy />
              <span className="flex min-w-0 flex-col">
                {t("orchestrator.threadHeader.copyMarkdown")}
                <span className="text-2xs text-muted-foreground">{MARKDOWN_HINT}</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={actions.downloadMarkdown}>
              <FileDown />
              <span className="flex min-w-0 flex-col">
                {t("orchestrator.threadHeader.downloadMarkdown")}
                <span className="text-2xs text-muted-foreground">{MARKDOWN_HINT}</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => layout.openRightTab("details")}>
              <Bot /> {t("orchestrator.threadHeader.sessionDetails")}
            </DropdownMenuItem>
            {actions.canFork && (
              <DropdownMenuItem
                disabled={actions.forkBlocked !== null}
                title={actions.forkBlocked ?? undefined}
                onSelect={actions.fork}
              >
                <GitFork />
                <span className="flex min-w-0 flex-col">
                  {t("orchestrator.threadHeader.fork")}
                  <span className="text-2xs text-muted-foreground">
                    {actions.forkBlocked ?? t("orchestrator.threadHeader.forkHint")}
                  </span>
                </span>
              </DropdownMenuItem>
            )}
            {actions.canHandoff && (
              <DropdownMenuItem
                disabled={actions.handoffBlocked !== null}
                title={actions.handoffBlocked ?? undefined}
                onSelect={() => actions.handoff()}
              >
                <ArrowRightLeft />
                <span className="flex min-w-0 flex-col">
                  {t("orchestrator.threadHeader.handoff")}
                  <span className="text-2xs text-muted-foreground">
                    {actions.handoffBlocked ?? t("orchestrator.threadHeader.handoffHint")}
                  </span>
                </span>
              </DropdownMenuItem>
            )}
            {actions.canReview && (
              <DropdownMenuItem
                disabled={actions.reviewBlocked !== null}
                title={actions.reviewBlocked ?? undefined}
                onSelect={() => actions.review()}
              >
                <ScanSearch />
                <span className="flex min-w-0 flex-col">
                  {t("orchestrator.threadHeader.review")}
                  <span className="text-2xs text-muted-foreground">
                    {actions.reviewBlocked ?? t("orchestrator.threadHeader.reviewHint")}
                  </span>
                </span>
              </DropdownMenuItem>
            )}
            {actions.canMakeAutomation && (
              <DropdownMenuItem onSelect={actions.makeAutomation}>
                <Workflow /> {t("orchestrator.threadHeader.makeAutomation")}
              </DropdownMenuItem>
            )}
            {fresh.available && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={fresh.blocked !== null}
                  title={fresh.blocked ?? undefined}
                  onSelect={fresh.open}
                >
                  <RotateCcw />
                  <span className="flex min-w-0 flex-col">
                    {t("orchestrator.threadHeader.startFresh")}
                    <span className="text-2xs text-muted-foreground">
                      {fresh.blocked ?? t("orchestrator.threadHeader.startFreshHint")}
                    </span>
                  </span>
                </DropdownMenuItem>
              </>
            )}
            {session.role === "agent" && (
              <>
                <DropdownMenuSeparator />
                {actions.archived ? (
                  <DropdownMenuItem onSelect={actions.unarchive}>
                    <ArchiveRestore /> {t("orchestrator.threadHeader.unarchive")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={actions.archive}>
                    <Archive /> {t("orchestrator.threadHeader.archive")}
                  </DropdownMenuItem>
                )}
                {/* Only while a turn runs or a question is open, like the sidebar's row menu:
                    stopping a finished session would overwrite its outcome. */}
                {actions.canStop && (
                  <DropdownMenuItem variant="destructive" onSelect={actions.stop}>
                    <X /> {t("orchestrator.threadHeader.stopSession")}
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {fresh.dialog}
      </div>
    </header>
  );
}
