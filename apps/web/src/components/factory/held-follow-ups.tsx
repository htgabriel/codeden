import type { HeldFollowUp } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FilePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useClient } from "@/lib/api";
import { factoryKeys } from "@/lib/factory";
import { useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { SEVERITY_TONE, SeverityText } from "./follow-ups";

/**
 * The review follow-ups a dark factory holds for its scout (§10.1, #435): the count on the scout's
 * card opens the list, each with its source PR and severity, File now (an issue at once, outside
 * the round's cap) and Dismiss.
 */

type Action = "file" | "dismiss";

export function HeldFollowUps({
  projectId,
  held,
  className,
}: {
  projectId: string;
  held: HeldFollowUp[];
  className?: string;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const act = useMutation({
    mutationFn: ({ h, action }: { h: HeldFollowUp; action: Action }) =>
      action === "file"
        ? client.factory.fileFollowUp(projectId, h.itemId, h.index)
        : client.factory.dismissFollowUp(projectId, h.itemId, h.index),
    onSuccess: (next, { h, action }) => {
      const issue = next.followUps[h.index]?.issue;
      toast.success(
        action === "dismiss"
          ? t("factory.held.dismissed")
          : issue
            ? t("factory.followUps.filedAs", { number: issue.number })
            : t("factory.followUps.filed"),
      );
      void queryClient.invalidateQueries({ queryKey: factoryKeys.all });
    },
    onError: (e: Error, { action }) =>
      toast.error(
        action === "file" ? t("factory.followUps.fileFailed") : t("factory.held.dismissFailed"),
        {
          description: e.message,
        },
      ),
  });
  if (held.length === 0) return null;
  const label = t("factory.held.count", { count: held.length });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-primary",
            className,
          )}
          data-testid="held-follow-ups"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 gap-0 p-0">
        <div className="border-b border-border px-3 py-2">
          <div className="text-[13px] font-medium">{t("factory.held.title")}</div>
          <p className="mt-0.5 text-2xs text-muted-foreground">{t("factory.held.help")}</p>
        </div>
        <ul className="max-h-80 overflow-y-auto" aria-label={t("factory.held.title")}>
          {held.map((h) => {
            const busy = act.isPending && act.variables?.h.id === h.id;
            return (
              <li
                key={h.id}
                className="flex flex-col gap-1 border-b border-border px-3 py-2 last:border-0"
              >
                <span className="text-[12px] leading-snug">{h.title}</span>
                <span className="flex items-center gap-1.5 text-3xs text-muted-foreground">
                  <span
                    className={cn(
                      "rounded-full border px-1.5",
                      SEVERITY_TONE[h.severity ?? "medium"],
                    )}
                  >
                    <SeverityText severity={h.severity ?? "medium"} />
                  </span>
                  {h.area && (
                    <span className="rounded-full border border-border px-1.5 font-mono">
                      {h.area}
                    </span>
                  )}
                  {h.pr ? (
                    <button
                      type="button"
                      className="truncate text-primary hover:underline"
                      title={h.itemTitle}
                      onClick={() => h.pr && platform.openExternal(h.pr.url)}
                    >
                      {t("factory.held.fromPr", { number: h.pr.number })}
                    </button>
                  ) : (
                    <span className="truncate" title={h.itemTitle}>
                      {t("factory.held.from", { title: h.itemTitle })}
                    </span>
                  )}
                  <span className="flex-1" />
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={busy}
                    onClick={() => act.mutate({ h, action: "file" })}
                  >
                    <FilePlus /> {t("factory.held.fileNow")}
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => act.mutate({ h, action: "dismiss" })}
                    aria-label={t("factory.held.dismissAria", { title: h.title })}
                  >
                    <X /> {t("factory.held.dismiss")}
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
