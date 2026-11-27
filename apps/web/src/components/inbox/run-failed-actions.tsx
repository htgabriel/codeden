import { type InboxItem, inboxAttempts } from "@codeden/contracts";
import { useMutation } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { ArrowRightLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  type Availability,
  lowerFirst,
  providerAvailability,
} from "@/components/composer/model-picker/logic";
import { Button } from "@/components/ui/button";
import { useClient } from "@/lib/api";
import { ApiRequestError } from "@/lib/api/http";
import { useTranslation } from "@/lib/i18n";
import { useSession, useSetupStatus, useSnapshotData } from "@/lib/queries";
import { useUiStore } from "@/stores/ui";

/** Why Retry would only fail again, from the session's provider's setup check; null when it can run. */
function retryBlocked(
  t: TFunction,
  name: string,
  availability: Availability | null,
): { text: string; detail: string | null; command: string | null } | null {
  if (!availability || availability.ready) return null;
  return {
    text: t("inbox.runFailed.blocked", {
      name,
      reason: lowerFirst(availability.reason ?? t("inbox.runFailed.notReady")),
    }),
    detail: availability.detail,
    command: availability.command,
  };
}

/**
 * A failed run's answer (§11.1): Retry runs its session again on its provider, unless that
 * provider can't run now (not installed, too old, signed out): then Retry is off, the line says
 * why and what fixes it, and the work can continue on another provider (hand-off). A retry that
 * fails says why ("Retry failed"), and the server counts it on the same item.
 */
export function RunFailedActions({
  item,
  busy,
  dismissButton,
}: {
  item: InboxItem;
  busy: boolean;
  dismissButton: React.ReactNode;
}) {
  const { t } = useTranslation();
  const client = useClient();
  // By id: a run's session may be archived and out of the snapshot (§6).
  const session = useSession(item.sessionId ?? undefined) ?? null;
  const providers = useSnapshotData((s) => s.runner.providers, []);
  const checks = useSetupStatus({ staleTime: 60_000 }).data?.checks;
  const name = providers.find((p) => p.id === session?.provider)?.displayName ?? session?.provider;
  const blocked = retryBlocked(
    t,
    name ?? t("inbox.runFailed.itsProvider"),
    session ? providerAvailability(session.provider, checks) : null,
  );
  const handOff = () =>
    session && useUiStore.getState().setHandoff({ sessionId: session.id, provider: null });
  const retry = useMutation({
    mutationFn: () => client.retryInbox(item.id),
    // Refused because the provider can't run (e.g. its usage limit, which the setup checks don't
    // know): the work can still continue elsewhere.
    onError: (e: Error) =>
      toast.error(t("inbox.runFailed.retryFailed"), {
        description: e.message,
        ...(e instanceof ApiRequestError && e.code === "provider_unavailable" && session
          ? { action: { label: t("inbox.runFailed.continueElsewhere"), onClick: handOff } }
          : {}),
      }),
    onSuccess: () => toast.success(t("inbox.runFailed.retryingToast")),
  });
  const attempts = inboxAttempts(item);
  return (
    <>
      <Button
        size="sm"
        onClick={() => retry.mutate()}
        disabled={busy || retry.isPending || blocked !== null}
        title={blocked?.text}
      >
        <RotateCcw /> {retry.isPending ? t("inbox.runFailed.retrying") : t("inbox.runFailed.retry")}
      </Button>
      {blocked && session && (
        <Button size="sm" variant="outline" onClick={handOff}>
          <ArrowRightLeft /> {t("inbox.runFailed.continueElsewhere")}
        </Button>
      )}
      {dismissButton}
      {attempts > 1 && (
        <span className="text-2xs text-muted-foreground">
          {t("inbox.runFailed.failedTimes", { count: attempts })}
        </span>
      )}
      {blocked && (
        <p
          className="w-full text-2xs text-status-failed"
          data-testid="retry-blocked"
          title={blocked.detail ?? undefined}
        >
          {t("inbox.runFailed.retryOff", { reason: blocked.text })}
          {blocked.command && (
            <>
              {" "}
              {t("inbox.runFailed.fixWith")} <code className="font-mono">{blocked.command}</code>.
            </>
          )}
        </p>
      )}
    </>
  );
}
