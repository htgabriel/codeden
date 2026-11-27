import type { AutomationListItem } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bot, Copy, FileCode2, Import, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useClient } from "@/lib/api";
import { automationKeys } from "@/lib/automations";
import { useTranslation } from "@/lib/i18n";

/** "From file", "Created by the PM" and "Imported" badges of an automation. */
export function OriginBadges({ item }: { item: AutomationListItem }) {
  const { t } = useTranslation();
  const by = item.automation.createdBy;
  return (
    <>
      {item.readOnly && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="flex items-center gap-1 rounded bg-muted px-1.5 py-px text-3xs text-muted-foreground"
              data-testid="from-file-badge"
            >
              <FileCode2 className="size-3" /> {t("automations.detail.fromFile")}
            </span>
          </TooltipTrigger>
          <TooltipContent className="font-mono">
            {t("automations.detail.fileTooltip", {
              path: item.path ?? t("automations.detail.builtIn"),
            })}
          </TooltipContent>
        </Tooltip>
      )}
      {by === "pm" && (
        <span className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-px text-3xs text-primary">
          <Bot className="size-3" /> {t("automations.detail.createdByPm")}
        </span>
      )}
      {by === "import" && (
        <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-px text-3xs text-muted-foreground">
          <Import className="size-3" /> {t("automations.detail.imported")}
        </span>
      )}
    </>
  );
}

/** Duplicate (or, for file automations, "Duplicate to edit") and delete. */
export function DetailActions({
  item,
  projectId,
}: {
  item: AutomationListItem;
  projectId: string;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const a = item.automation;
  const open = (automationId: string) =>
    void navigate({
      to: "/projects/$projectId/automations/$automationId",
      params: { projectId, automationId },
    });
  const duplicate = useMutation({
    mutationFn: () =>
      client.automations.duplicate(a.id, a.target.type === "project" ? { projectId } : {}),
    onSuccess: (copy) => {
      void queryClient.invalidateQueries({ queryKey: automationKeys.all });
      toast.success(t("automations.detail.duplicated", { name: copy.automation.name }));
      open(copy.automation.id);
    },
    onError: (e) =>
      toast.error(t("automations.detail.duplicateFailed"), { description: e.message }),
  });
  const remove = useMutation({
    mutationFn: () => client.automations.remove(a.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: automationKeys.all });
      toast.success(t("automations.detail.deleted", { name: a.name }));
      void navigate({ to: "/projects/$projectId/automations", params: { projectId } });
    },
    onError: (e) => toast.error(t("automations.detail.deleteFailed"), { description: e.message }),
  });
  return (
    <>
      <Button
        size="sm"
        variant={item.readOnly ? "default" : "ghost"}
        onClick={() => duplicate.mutate()}
        disabled={duplicate.isPending}
      >
        <Copy />{" "}
        {item.readOnly
          ? t("automations.detail.duplicateToEdit")
          : t("automations.detail.duplicate")}
      </Button>
      {!item.readOnly && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t("automations.detail.deleteAria", { name: a.name })}
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("automations.detail.deleteTitle", { name: a.name })}
              </AlertDialogTitle>
              <AlertDialogDescription>{t("automations.detail.deleteBody")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => remove.mutate()}>
                {t("automations.detail.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
