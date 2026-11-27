import type { Project } from "@codeden/contracts";
import { Archive, ArrowDown, ArrowUp, Pin, PinOff } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useProjectActions } from "@/lib/project-actions";
import type { RowMenuEntry } from "./row-menu";

/** Where a project sits in its group (pinned or not), for Move up / Move down. */
export interface GroupPosition {
  index: number;
  count: number;
}

/**
 * A project row's menu: pin or unpin, keyboard-friendly moves within its group, and archive,
 * which `onArchive` confirms first (`ArchiveProjectDialog`).
 */
export function useProjectMenu(
  project: Project,
  position: GroupPosition,
  onArchive: () => void,
): RowMenuEntry[] {
  const { t } = useTranslation();
  const actions = useProjectActions();
  return [
    {
      label: project.pinned ? t("shell.projectMenu.unpin") : t("shell.projectMenu.pin"),
      icon: project.pinned ? <PinOff /> : <Pin />,
      onSelect: () => void actions.setPinned(project, !project.pinned),
    },
    "separator",
    {
      label: t("shell.projectMenu.moveUp"),
      icon: <ArrowUp />,
      disabled: position.index === 0,
      onSelect: () => void actions.moveTo(project.id, position.index - 1),
    },
    {
      label: t("shell.projectMenu.moveDown"),
      icon: <ArrowDown />,
      disabled: position.index >= position.count - 1,
      onSelect: () => void actions.moveTo(project.id, position.index + 1),
    },
    "separator",
    {
      label: t("shell.archiveProject.confirm"),
      icon: <Archive />,
      variant: "destructive",
      onSelect: onArchive,
    },
  ];
}
