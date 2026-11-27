import { Check, FolderOpen, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";
import { NOT_A_REPO_REASON } from "@/lib/new-session";
import { TRIGGER_CLASS } from "./model-picker/trigger";

/**
 * Where a new session runs (§9), on the New session draft of a project whose folder isn't a git
 * repository: in the project folder itself. A new worktree is listed but disabled, with the
 * reason. Git projects don't show it: their sessions get their own worktree.
 */
export function WorkspacePicker({ path }: { path: string }) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={TRIGGER_CLASS}
          aria-label={t("orchestrator.workspace.label")}
        >
          <FolderOpen className="size-3.5" />
          {t("orchestrator.workspace.projectFolder")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80" data-testid="workspace-menu">
        <DropdownMenuLabel className="text-2xs">
          {t("orchestrator.workspace.heading")}
        </DropdownMenuLabel>
        <DropdownMenuItem disabled className="items-start py-1.5">
          <GitBranch className="mt-0.5 size-4" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px]">{t("orchestrator.workspace.newWorktree")}</span>
            <span className="block text-2xs text-muted-foreground">{NOT_A_REPO_REASON}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="items-start py-1.5">
          <FolderOpen className="mt-0.5 size-4" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px]">{t("orchestrator.workspace.projectFolder")}</span>
            <span className="block break-all text-2xs text-muted-foreground">{path}</span>
          </span>
          <Check className="mt-0.5 size-3.5" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
