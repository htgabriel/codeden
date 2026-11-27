import {
  Archive,
  ArchiveRestore,
  ClipboardCopy,
  ExternalLink,
  FileDown,
  Link2,
  Pencil,
  Square,
} from "lucide-react";
import { i18n } from "@/lib/i18n";
import { markdownHint, type SessionActions } from "@/lib/session-actions";
import type { RowMenuEntry } from "./row-menu";

/**
 * A session row's menu: open, rename, copy link, copy or download as Markdown, stop (while
 * working), archive or unarchive.
 */
export function sessionMenuEntries(
  actions: SessionActions,
  startRename: () => void,
): RowMenuEntry[] {
  const t = i18n.t;
  const entries: RowMenuEntry[] = [
    { label: t("shell.sessionMenu.open"), icon: <ExternalLink />, onSelect: actions.open },
    {
      label: t("shell.sessionMenu.rename"),
      icon: <Pencil />,
      onSelect: startRename,
      keepFocus: true,
    },
    {
      label: t("shell.sessionMenu.copyLink"),
      icon: <Link2 />,
      onSelect: () => void actions.copyLink(),
    },
    {
      label: t("shell.sessionMenu.copyMarkdown"),
      hint: markdownHint(),
      icon: <ClipboardCopy />,
      onSelect: actions.copyMarkdown,
    },
    {
      label: t("shell.sessionMenu.downloadMarkdown"),
      hint: markdownHint(),
      icon: <FileDown />,
      onSelect: actions.downloadMarkdown,
    },
  ];
  if (actions.canStop)
    entries.push({ label: t("shell.sessionMenu.stop"), icon: <Square />, onSelect: actions.stop });
  entries.push(
    "separator",
    actions.archived
      ? {
          label: t("shell.sessionMenu.unarchive"),
          icon: <ArchiveRestore />,
          onSelect: actions.unarchive,
        }
      : { label: t("shell.sessionMenu.archive"), icon: <Archive />, onSelect: actions.archive },
  );
  return entries;
}
