import { type ToolOutputResponse, utf8ByteLength } from "@codeden/contracts";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useClient } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { i18n, useTranslation } from "@/lib/i18n";
import type { WorkEntry } from "@/lib/transcript/timeline";
import { cn } from "@/lib/utils";

/**
 * What the "output was cut" bar says. `shownBytes` is the transcript's copy and `liveBytes` all
 * the output the tool has produced so far (when known). Once `full` (the stored copy) is loaded,
 * it is described with the server's own figures from that moment: output lost only when the
 * server says its copy is cut, and "more has arrived since" when the tool kept writing after.
 */
export function cutNotice(
  shownBytes: number,
  liveBytes: number | undefined,
  full: ToolOutputResponse | undefined,
  running: boolean,
): string {
  const t = i18n.t;
  if (!full) {
    return liveBytes === undefined
      ? t("workbench.output.cutShowing", { shown: formatBytes(shownBytes) })
      : t("workbench.output.showingOf", {
          shown: formatBytes(shownBytes),
          total: formatBytes(liveBytes),
        });
  }
  const newer = liveBytes !== undefined && liveBytes > full.outputBytes;
  const loaded = formatBytes(full.totalBytes);
  const base = full.truncated
    ? t("workbench.output.kept", { loaded, total: formatBytes(full.outputBytes) })
    : newer
      ? t("workbench.output.whenLoaded", { loaded })
      : running
        ? t("workbench.output.soFar", { loaded })
        : t("workbench.output.full", { loaded });
  return newer ? t("workbench.output.moreArrived", { base }) : base;
}

export interface ShownOutput {
  /** The text to render: the transcript's copy, or the stored output once it was loaded. */
  text: string;
  /** The bar saying the output was cut, with Show full output; null when nothing was cut. */
  notice: ReactNode;
}

interface Target {
  sessionId: string;
  itemId: string;
}

/**
 * A tool call's output as the transcript shows it. When its copy was cut (`truncated`), the
 * notice says how much is shown and loads what the server stored on demand (§6). A load belongs
 * to the item it was made for: a result or a request still in flight for another item is never
 * shown. A load while the command still runs is a snapshot until "Back to live output".
 */
export function useShownOutput(sessionId: string, entry: WorkEntry): ShownOutput {
  const { t } = useTranslation();
  const client = useClient();
  const load = useMutation({
    mutationFn: (target: Target) => client.getToolOutput(target.sessionId, target.itemId),
  });
  const output = entry.kind === "tool_call" ? entry.output : undefined;
  const text = output?.text ?? "";
  if (!output?.truncated) return { text, notice: null };

  const mine = load.variables?.sessionId === sessionId && load.variables.itemId === entry.id;
  const full = mine && load.data?.itemId === entry.id ? load.data : undefined;
  const pending = mine && load.isPending;
  const failed = mine && load.isError;
  const running = entry.status === "in_progress";
  const message = failed
    ? t("workbench.output.loadFailed", {
        error: load.error?.message ?? t("workbench.output.unknownError"),
      })
    : cutNotice(utf8ByteLength(text), output.totalBytes, full, running);
  const action = full
    ? {
        label: running ? t("workbench.output.backToLive") : t("workbench.sender.showLess"),
        run: () => load.reset(),
      }
    : {
        label: failed ? t("workbench.image.tryAgain") : t("workbench.output.showFull"),
        run: () => load.mutate({ sessionId, itemId: entry.id }),
      };

  return {
    text: full ? full.text : text,
    notice: (
      <div className="flex min-w-0 items-center gap-2 font-sans text-2xs text-muted-foreground">
        <span
          role={failed ? "alert" : undefined}
          className={cn("min-w-0 flex-1 truncate", failed && "text-status-failed")}
          title={message}
        >
          {message}
        </span>
        <Button
          variant="link"
          size="xs"
          className="h-5 shrink-0 px-0 text-2xs"
          disabled={pending}
          onClick={action.run}
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin" /> {t("workbench.image.loading")}
            </>
          ) : (
            action.label
          )}
        </Button>
      </div>
    ),
  };
}
