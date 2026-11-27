import type { FactoryDrainStatus, KillSwitchMode, KillSwitchResponse } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Play, Power } from "lucide-react";
import { type ReactNode, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClient } from "@/lib/api";
import { factoryKeys } from "@/lib/factory";
import { i18n, useTranslation } from "@/lib/i18n";

type Scope = { projectId: string } | "global";
/** What the confirmation asks about. */
type Confirm = "drain" | "now" | "release";

/** The drain's optional time limit, in minutes ("none": no limit); labels under `factory.kill.limits`. */
const LIMITS = ["none", "30", "60", "120", "240"] as const;

/** The confirmation's title and body (`factory.kill.confirm.<which>`), worded for one or every project. */
function copy(which: Confirm, global: boolean): { title: string; body: string } {
  const t = i18n.t;
  switch (which) {
    case "drain":
      return {
        title: t("factory.kill.confirm.drainTitle"),
        body: t("factory.kill.confirm.drainBody"),
      };
    case "now":
      return {
        title: global
          ? t("factory.kill.confirm.nowTitleGlobal")
          : t("factory.kill.confirm.nowTitle"),
        body: global ? t("factory.kill.confirm.nowBodyGlobal") : t("factory.kill.confirm.nowBody"),
      };
    default:
      return {
        title: global
          ? t("factory.kill.confirm.releaseTitleGlobal")
          : t("factory.kill.confirm.releaseTitle"),
        body: t("factory.kill.confirm.releaseBody"),
      };
  }
}

function toastResult(res: KillSwitchResponse, global: boolean, mode: KillSwitchMode | "off") {
  const t = i18n.t;
  if (res.draining) {
    toast.success(t("factory.kill.toast.finishing"), {
      description: t("factory.kill.toast.inFlight", { count: res.inFlight }),
    });
  } else if (res.on && mode === "drain") {
    toast.warning(t("factory.kill.toast.stopped"), {
      description: t("factory.kill.toast.nothingInFlight"),
    });
  } else if (res.on) {
    toast.warning(global ? t("factory.kill.toast.everyStopped") : t("factory.kill.toast.stopped"), {
      description: t("factory.kill.toast.halted", { count: res.stoppedSessions.length }),
    });
  } else
    toast.success(global ? t("factory.kill.toast.mayRunAgain") : t("factory.kill.toast.resumed"));
}

/**
 * The kill switch (§10.1) with a confirmation: one project's, or every project's (`global`).
 * A project's offers **Finish current work, then stop** (a drain, first) and **Stop now**; while
 * it drains, **Resume** and **Stop now**; once stopped, **Release kill switch**. The global
 * switch only stops now.
 */
export function KillSwitchButton({
  scope,
  on,
  drain = null,
  paused = false,
  size = "sm",
}: {
  scope: Scope;
  /** The switch's current state. */
  on: boolean;
  /** The drain in progress (`FactoryStatus.drain`). */
  drain?: FactoryDrainStatus | null;
  /**
   * The loop is paused too: Resume during the drain then resumes the loop, which ends both the
   * pause and the drain (the panel's own Resume is hidden while draining).
   */
  paused?: boolean;
  size?: "sm" | "xs";
}) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const global = scope === "global";
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [limit, setLimit] = useState<string>("none");
  const kill = useMutation({
    mutationFn: (req: { on: boolean; mode?: KillSwitchMode; drainLimitMin?: number | null }) =>
      client.factory.killSwitch(scope, req.on, {
        mode: req.mode,
        drainLimitMin: req.drainLimitMin,
      }),
    onSuccess: (res, req) => {
      void queryClient.invalidateQueries({ queryKey: factoryKeys.all });
      toastResult(res, global, req.on ? (req.mode ?? "now") : "off");
    },
    onError: (e) => toast.error(t("factory.kill.toast.changeFailed"), { description: e.message }),
  });
  const resumeLoop = useMutation({
    mutationFn: () => client.factory.resume(typeof scope === "string" ? "" : scope.projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: factoryKeys.all });
      toast.success(t("factory.kill.toast.resumed"));
    },
    onError: (e) => toast.error(t("factory.kill.toast.resumeFailed"), { description: e.message }),
  });
  const busy = kill.isPending || resumeLoop.isPending;
  const act = (which: Confirm) => {
    if (which === "release") kill.mutate({ on: false });
    else if (which === "now") kill.mutate({ on: true, mode: "now" });
    else kill.mutate({ on: true, mode: "drain", drainLimitMin: limit === "none" ? null : +limit });
  };
  const ask = (which: Confirm) => {
    if (which === "drain") setLimit("none");
    setConfirm(which);
  };

  let controls: ReactNode;
  if (on) {
    controls = (
      <Button
        size={size}
        variant="outline"
        disabled={kill.isPending}
        onClick={() => ask("release")}
      >
        <Power /> {global ? t("factory.kill.releaseGlobal") : t("factory.kill.release")}
      </Button>
    );
  } else if (global) {
    controls = (
      <Button
        size={size}
        variant="destructive"
        disabled={kill.isPending}
        onClick={() => ask("now")}
      >
        <Power /> {t("factory.kill.stopEvery")}
      </Button>
    );
  } else if (drain) {
    controls = (
      <>
        <Button
          size={size}
          disabled={busy}
          onClick={() => (paused ? resumeLoop.mutate() : kill.mutate({ on: false }))}
          title={paused ? t("factory.kill.cancelDrainAndPause") : t("factory.kill.cancelDrain")}
          data-testid="factory-drain-resume"
        >
          <Play /> {t("factory.kill.resume")}
        </Button>
        <Button size={size} variant="destructive" disabled={busy} onClick={() => ask("now")}>
          <Power /> {t("factory.kill.stopNow")}
        </Button>
      </>
    );
  } else {
    controls = (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={size} variant="destructive" disabled={kill.isPending}>
            <Power /> {t("factory.kill.killSwitch")} <ChevronDown aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuItem onSelect={() => ask("drain")} data-testid="kill-switch-drain">
            <div>
              <div className="font-medium">{t("factory.kill.drainItem")}</div>
              <div className="text-2xs text-muted-foreground">
                {t("factory.kill.drainItemHint")}
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => ask("now")}
            variant="destructive"
            data-testid="kill-switch-now"
          >
            <div>
              <div className="font-medium">{t("factory.kill.stopNow")}</div>
              <div className="text-2xs text-muted-foreground">{t("factory.kill.stopNowHint")}</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      {controls}
      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        {confirm && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{copy(confirm, global).title}</AlertDialogTitle>
              <AlertDialogDescription>{copy(confirm, global).body}</AlertDialogDescription>
            </AlertDialogHeader>
            {confirm === "drain" && (
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-muted-foreground" id="drain-limit-hint">
                  {t("factory.kill.limitHint")}
                </span>
                <Select value={limit} onValueChange={setLimit}>
                  <SelectTrigger
                    className="h-8 w-40 text-[13px]"
                    aria-label={t("factory.kill.limitAria")}
                    aria-describedby="drain-limit-hint"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIMITS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {t(`factory.kill.limits.${l}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => act(confirm)}
                variant={confirm === "now" ? "destructive" : "default"}
              >
                {confirm === "release"
                  ? t("factory.kill.releaseAction")
                  : confirm === "drain"
                    ? t("factory.kill.drainAction")
                    : t("factory.kill.stopAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
}
