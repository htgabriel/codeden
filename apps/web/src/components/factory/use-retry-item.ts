import type { FactoryRetryMode } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useClient } from "@/lib/api";
import { factoryKeys } from "@/lib/factory";
import { useTranslation } from "@/lib/i18n";

/**
 * Retry a stopped factory item (§10.1): the one mutation behind every Retry button (the item
 * page, the panel's columns, the Factory view's Needs you cards and its repair bay). With its
 * pull request open the server sends that PR back to a fresh review; otherwise, or with
 * `mode: "rebuild"`, the work starts over from the first step.
 */
export function useRetryItem(projectId: string, itemId: string, mode?: FactoryRetryMode) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.factory.retry(projectId, itemId, mode ? { mode } : {}),
    onSuccess: (next) => {
      toast.success(
        next.stage === "verifying"
          ? t("factory.retry.backInReview")
          : t("factory.retry.queuedAgain"),
        {
          description:
            next.stage === "verifying" && next.pr
              ? t("factory.retry.freshReview", { number: next.pr.number })
              : t("factory.retry.startsOver"),
        },
      );
      void queryClient.invalidateQueries({ queryKey: factoryKeys.all });
    },
    onError: (e: Error) => toast.error(t("factory.retry.failed"), { description: e.message }),
  });
}
