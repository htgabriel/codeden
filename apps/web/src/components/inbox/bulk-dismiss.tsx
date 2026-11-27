import { INBOX_BULK_MAX, type InboxItem } from "@codeden/contracts";
import { useMutation } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { CheckCheck } from "lucide-react";
import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { type CodeDenClient, useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { splitForDismiss } from "@/lib/inbox";

/** How long a bulk dismiss can be undone from its toast. */
export const UNDO_MS = 10_000;

/** How many of the items that stay the confirmation names. */
const NAMED = 5;

/** "6 notices". */
const notices = (t: TFunction, count: number) => t("inbox.bulkDismiss.notices", { count });

/** "3 items that wait on you stay" (or "1 item that waits on you stays"). */
function stayLine(t: TFunction, count: number): string {
  return t("inbox.bulkDismiss.stay", { count });
}

/** A toast's line for the items the server kept: "3 items that wait on you stay.", or none. */
function keptLine(t: TFunction, kept: number): string | undefined {
  return kept > 0 ? `${stayLine(t, kept)}.` : undefined;
}

/** `message` ending as a sentence, so another can follow it. */
function sentence(message: string): string {
  return /[.!?]$/.test(message) ? message : `${message}.`;
}

/** `ids` split into requests the server accepts (at most {@link INBOX_BULK_MAX} each). */
function batches(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += INBOX_BULK_MAX) out.push(ids.slice(i, i + INBOX_BULK_MAX));
  return out;
}

/**
 * Undo from the toast: reopens exactly what the dismiss closed (`POST /api/inbox/restore`). When
 * a later request fails, the toast still says what the earlier ones reopened.
 */
async function undo(
  t: TFunction,
  client: CodeDenClient,
  ids: string[],
  what: (n: number) => string,
) {
  let restored = 0;
  try {
    for (const batch of batches(ids)) restored += (await client.restoreInbox(batch)).restored;
    toast.success(t("inbox.bulkDismiss.restored", { what: what(restored) }));
  } catch (e) {
    const message =
      restored > 0
        ? t("inbox.bulkDismiss.restoredPartly", { what: what(restored) })
        : t("inbox.bulkDismiss.undoFailed");
    toast.error(message, { description: (e as Error).message });
  }
}

/** What a bulk dismiss did, over all its requests; `error` when a later request failed. */
interface BulkResult {
  dismissed: number;
  ids: string[];
  kept: number;
  error?: Error;
}

/**
 * Dismiss several items (§11.1), then a toast with **Undo** for {@link UNDO_MS}. More than
 * {@link INBOX_BULK_MAX} go in several requests, so every item counted is dismissed. Undo needs
 * nothing from the component, so it still works once the dismissed items (and this button with
 * them) are gone. `what` names the items: "6 notices".
 */
export function useBulkDismiss(what: (n: number) => string) {
  const { t } = useTranslation();
  const client = useClient();
  return useMutation({
    mutationFn: async (items: InboxItem[]): Promise<BulkResult> => {
      const total: BulkResult = { dismissed: 0, ids: [], kept: 0 };
      for (const batch of batches(items.map((i) => i.id))) {
        try {
          const res = await client.dismissInbox(batch);
          total.dismissed += res.dismissed;
          total.ids.push(...res.ids);
          total.kept += res.kept;
        } catch (e) {
          // Some already went: keep their Undo rather than only reporting the failure.
          if (total.ids.length === 0) throw e;
          return { ...total, error: e as Error };
        }
      }
      return total;
    },
    onError: (e: Error) =>
      toast.error(t("inbox.bulkDismiss.dismissFailed"), { description: e.message }),
    onSuccess: (res) => {
      const kept = keptLine(t, res.kept);
      if (res.dismissed === 0) {
        toast.warning(t("inbox.bulkDismiss.nothingDismissed"), { description: kept });
        return;
      }
      const action = {
        label: t("inbox.bulkDismiss.undo"),
        onClick: () => void undo(t, client, res.ids, what),
      };
      if (res.error) {
        // The reason first, then what the requests that went through kept, as on success.
        const reason = res.error.message;
        toast.error(t("inbox.bulkDismiss.dismissedPartly", { what: what(res.dismissed) }), {
          description: kept ? `${sentence(reason)} ${kept}` : reason,
          action,
          duration: UNDO_MS,
        });
        return;
      }
      toast.success(t("inbox.bulkDismiss.dismissed", { what: what(res.dismissed) }), {
        description: kept,
        action,
        duration: UNDO_MS,
      });
    },
  });
}

/** An item that stays, as the confirmation names it. */
export interface StayingItem {
  id: string;
  title: string;
}

/**
 * The inbox header's **Dismiss N** (§11.1): dismisses the notices in the current view (`items`,
 * what the active tab lists) after a short confirmation that names what stays. Items that wait
 * on the user stay, with the view's conflicts (`alsoStaying`). Hidden when nothing would go.
 */
export function DismissView({
  items,
  alsoStaying = [],
}: {
  items: InboxItem[];
  alsoStaying?: StayingItem[];
}) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const bulk = useBulkDismiss((n) => notices(t, n));
  const { dismiss, stay } = splitForDismiss(items);
  const staying: StayingItem[] = [...alsoStaying, ...stay];
  const n = dismiss.length;
  if (n === 0) return null;
  const named = staying.slice(0, NAMED);
  const more = staying.length - named.length;

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground"
        title={t("inbox.bulkDismiss.buttonTitle", { notices: notices(t, n) })}
        onClick={() => setConfirming(true)}
        disabled={bulk.isPending}
      >
        <CheckCheck /> {t("inbox.bulkDismiss.dismissCount", { count: n })}
      </Button>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("inbox.bulkDismiss.confirmTitle", { notices: notices(t, n) })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {staying.length > 0
                ? t("inbox.bulkDismiss.willBeDismissedStaying", {
                    notices: notices(t, n),
                    stay: stayLine(t, staying.length),
                  })
                : t("inbox.bulkDismiss.willBeDismissed", { notices: notices(t, n) })}{" "}
              {t("inbox.bulkDismiss.undoHint")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {named.length > 0 && (
            <div className="min-w-0 text-[13px]" data-testid="dismiss-staying">
              <div className="mb-1.5 text-2xs text-muted-foreground">
                {t("inbox.bulkDismiss.staying")}
              </div>
              <ul className="space-y-1">
                {named.map((s) => (
                  <li key={s.id} className="truncate">
                    {s.title}
                  </li>
                ))}
              </ul>
              {more > 0 && (
                <div className="mt-1 text-muted-foreground">
                  {t("inbox.bulkDismiss.andMore", { count: more })}
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulk.mutate(dismiss)}>
              {t("inbox.bulkDismiss.dismissCount", { count: n })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
