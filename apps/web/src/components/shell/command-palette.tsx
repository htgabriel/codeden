import { isFactoryMode, type Session } from "@codeden/contracts";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowRightLeft,
  Bot,
  FolderPlus,
  GitFork,
  Inbox,
  Keyboard,
  MessageSquarePlus,
  MonitorPlay,
  Moon,
  PanelLeft,
  PanelRight,
  Rocket,
  ScanSearch,
  Settings,
  SlidersHorizontal,
  SquareTerminal,
  TextSearch,
  Workflow,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Hotkey } from "@/components/common/bits";
import { StatusDot } from "@/components/common/status-dot";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useTranslation } from "@/lib/i18n";
import { useSnapshot } from "@/lib/queries";
import { canMakeAutomation, useSessionActions } from "@/lib/session-actions";
import { formatCombo, type ShortcutId, shortcut } from "@/lib/shortcuts";
import { useLayoutStore } from "@/stores/layout";
import { useThemeStore } from "@/stores/theme";
import { useUiStore } from "@/stores/ui";
import { PaletteTranscripts, paletteFilter } from "./palette-transcripts";
import { ProjectTile } from "./sidebar/project-group";

const SETTINGS = [
  "general",
  "providers",
  "autonomy",
  "voice",
  "images",
  "utility",
  "notifications",
  "shortcuts",
  "about",
] as const;

function Row({
  icon,
  label,
  hint,
  badge,
  keys,
  onSelect,
  value,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  /** A short label after the hint, e.g. "Archived". */
  badge?: string;
  keys?: ShortcutId;
  onSelect: () => void;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <CommandItem onSelect={onSelect} value={value ?? label} disabled={disabled} className="gap-2.5">
      <span className="flex size-4 items-center justify-center text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <span className="min-w-0 truncate">{label}</span>
      {hint && <span className="min-w-0 truncate text-xs text-muted-foreground">{hint}</span>}
      {badge && (
        <span className="shrink-0 rounded-sm border border-border px-1 text-3xs text-muted-foreground">
          {badge}
        </span>
      )}
      <span className="flex-1" />
      {keys && <Hotkey keys={formatCombo(shortcut(keys).combo)} />}
    </CommandItem>
  );
}

/**
 * Fork the session on screen (§9), when its provider can fork. Disabled, with the reason,
 * while a turn runs or before it has a conversation.
 */
function ForkCurrentSession({ session, close }: { session: Session; close: () => void }) {
  const { t } = useTranslation();
  const actions = useSessionActions(session);
  if (!actions.canFork) return null;
  return (
    <Row
      icon={<GitFork />}
      label={t("shell.palette.fork")}
      hint={actions.forkBlocked ?? session.title ?? session.purpose}
      value="fork this session new worktree branch"
      disabled={actions.forkBlocked !== null}
      onSelect={() => {
        actions.fork();
        close();
      }}
    />
  );
}

/**
 * Hand off the session on screen (§9): open the handoff dialog to continue it in a new session,
 * on any provider. Disabled, with the reason, while a turn runs or before it has done anything.
 */
function HandoffCurrentSession({ session, close }: { session: Session; close: () => void }) {
  const { t } = useTranslation();
  const actions = useSessionActions(session);
  if (!actions.canHandoff) return null;
  return (
    <Row
      icon={<ArrowRightLeft />}
      label={t("shell.palette.handoff")}
      hint={actions.handoffBlocked ?? t("shell.palette.handoffHint")}
      value="hand off this session handoff continue another provider switch"
      disabled={actions.handoffBlocked !== null}
      onSelect={() => {
        close();
        actions.handoff();
      }}
    />
  );
}

/**
 * Review the session on screen with another agent (§9): open the review dialog for a read-only
 * second opinion on its changes. Disabled, with the reason, while a turn runs or before it has
 * done anything; not offered for a review itself.
 */
function ReviewCurrentSession({ session, close }: { session: Session; close: () => void }) {
  const { t } = useTranslation();
  const actions = useSessionActions(session);
  if (!actions.canReview) return null;
  return (
    <Row
      icon={<ScanSearch />}
      label={t("shell.palette.review")}
      hint={actions.reviewBlocked ?? t("shell.palette.reviewHint")}
      value="review this session another agent second opinion code review read-only"
      disabled={actions.reviewBlocked !== null}
      onSelect={() => {
        close();
        actions.review();
      }}
    />
  );
}

/** Ctrl K: jump to any session or project, find what was said in a transcript, or run an action. */
export function CommandPalette() {
  const { t } = useTranslation();
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const [search, setSearch] = useState("");
  // Each opening starts from an empty search.
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);
  const { data } = useSnapshot();
  const navigate = useNavigate();
  const layout = useLayoutStore();
  const toggleTheme = useThemeStore((s) => s.toggle);
  // The session page that's open, if any: "Make an automation from this session…" and "Fork this
  // session" act on it.
  const { sessionId } = useParams({ strict: false }) as { sessionId?: string };
  const current = sessionId ? data?.sessions.find((s) => s.id === sessionId) : undefined;
  const automationSource = current && canMakeAutomation(current) ? current : undefined;

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  const projectName = (id: string | null) => data?.projects.find((p) => p.id === id)?.name;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t("shell.palette.title")}
      className="sm:max-w-xl"
    >
      <Command filter={paletteFilter}>
        <CommandInput
          placeholder={t("shell.palette.placeholder")}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="max-h-[min(440px,60dvh)]">
          <CommandEmpty>{t("shell.palette.noResults")}</CommandEmpty>
          <CommandGroup heading={t("shell.palette.goTo")}>
            <Row
              icon={<Bot className="text-primary" />}
              label={t("sidebar.orchestrator")}
              keys="orchestrator"
              onSelect={run(() => navigate({ to: "/" }))}
            />
            <Row
              icon={<Inbox />}
              label={t("sidebar.inbox")}
              keys="inbox"
              onSelect={run(() => navigate({ to: "/inbox" }))}
            />
            <Row
              icon={<TextSearch />}
              label={t("shell.palette.searchTranscripts")}
              hint={t("shell.palette.searchTranscriptsHint")}
              value="search transcripts find messages commands"
              onSelect={run(() => navigate({ to: "/search" }))}
            />
            {data?.projects.map((p) => (
              <Row
                key={p.id}
                icon={<ProjectTile project={p} />}
                label={p.name}
                hint={t("shell.palette.projectHome")}
                onSelect={run(() =>
                  navigate({ to: "/projects/$projectId", params: { projectId: p.id } }),
                )}
              />
            ))}
            {data?.projects
              .filter((p) => isFactoryMode(p.autonomyMode))
              .map((p) => (
                <Row
                  key={`factory-view:${p.id}`}
                  icon={<MonitorPlay />}
                  label={t("shell.palette.factoryView", { name: p.name })}
                  hint={t("shell.palette.factoryViewHint")}
                  value={`factory view ${p.name} pipeline full screen`}
                  onSelect={run(() =>
                    navigate({
                      to: "/projects/$projectId/factory/view",
                      params: { projectId: p.id },
                    }),
                  )}
                />
              ))}
          </CommandGroup>
          <CommandGroup heading={t("shell.palette.sessions")}>
            {data?.sessions
              .filter((s) => s.role === "agent")
              .map((s) => (
                <Row
                  key={s.id}
                  value={`${s.title ?? s.purpose} ${s.workKey} ${projectName(s.projectId) ?? ""}${s.archivedAt ? " archived" : ""}`}
                  icon={<StatusDot status={s.status} />}
                  label={s.title ?? s.purpose}
                  hint={projectName(s.projectId)}
                  badge={s.archivedAt ? t("shell.palette.archived") : undefined}
                  onSelect={run(() =>
                    navigate({ to: "/sessions/$sessionId", params: { sessionId: s.id } }),
                  )}
                />
              ))}
          </CommandGroup>
          <PaletteTranscripts search={search} close={() => setOpen(false)} />
          <CommandSeparator />
          <CommandGroup heading={t("shell.palette.actions")}>
            {current && <ForkCurrentSession session={current} close={() => setOpen(false)} />}
            {current && <HandoffCurrentSession session={current} close={() => setOpen(false)} />}
            {current && <ReviewCurrentSession session={current} close={() => setOpen(false)} />}
            {automationSource?.projectId && (
              <Row
                icon={<Workflow />}
                label={t("shell.palette.makeAutomation")}
                hint={automationSource.title ?? automationSource.purpose}
                onSelect={run(
                  () =>
                    automationSource.projectId &&
                    navigate({
                      to: "/projects/$projectId/automations/new",
                      params: { projectId: automationSource.projectId },
                      search: { session: automationSource.id },
                    }),
                )}
              />
            )}
            <Row
              icon={<MessageSquarePlus />}
              label={t("shell.palette.newSession")}
              onSelect={run(
                () =>
                  data?.projects[0] &&
                  navigate({
                    to: "/projects/$projectId/new",
                    params: { projectId: data.projects[0].id },
                  }),
              )}
            />
            <Row
              icon={<FolderPlus />}
              label={t("shell.palette.addProject")}
              onSelect={run(() => useUiStore.getState().setAddProjectOpen(true))}
            />
            <Row
              icon={<PanelLeft />}
              label={t("shell.palette.toggleSidebar")}
              keys="sidebar"
              onSelect={run(layout.toggleSidebar)}
            />
            <Row
              icon={<PanelRight />}
              label={t("shell.palette.toggleRight")}
              keys="rightPanel"
              onSelect={run(() => layout.toggleRight())}
            />
            <Row
              icon={<SquareTerminal />}
              label={t("shell.palette.toggleTerminal")}
              keys="terminal"
              onSelect={run(() => layout.toggleDrawer())}
            />
            <Row
              icon={<Moon />}
              label={t("shell.palette.toggleTheme")}
              keys="theme"
              onSelect={run(toggleTheme)}
            />
            <Row
              icon={<Keyboard />}
              label={t("sidebar.keyboardShortcuts")}
              keys="help"
              onSelect={run(() => useUiStore.getState().setShortcutsOpen(true))}
            />
            <Row
              icon={<SlidersHorizontal />}
              label={t("sidebar.agentConfiguration")}
              hint={t("shell.palette.agentConfigHint")}
              onSelect={run(() => navigate({ to: "/agents" }))}
            />
            <Row
              icon={<Rocket />}
              label={t("settings.firstRunSetup")}
              onSelect={run(() => navigate({ to: "/setup" }))}
            />
          </CommandGroup>
          <CommandGroup heading={t("common.settings")}>
            {SETTINGS.map((section) => (
              <Row
                key={section}
                icon={<Settings />}
                label={t("shell.palette.settingsSection", {
                  section: t(`shell.palette.settingsSections.${section}`),
                })}
                onSelect={run(() => navigate({ to: "/settings/$section", params: { section } }))}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
