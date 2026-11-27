import type { FactoryStatus } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MonitorPlay, Radar, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useClient } from "@/lib/api";
import { factoryKeys } from "@/lib/factory";
import { useTranslation } from "@/lib/i18n";
import { checkNowHelp, LOOP_LABEL } from "./meta";

/**
 * A header button with a tooltip. The tooltip sits on a wrapper, so it still explains the
 * button while it is disabled (a disabled button gets no pointer or focus events itself).
 */
function HintButton({
  hint,
  disabled,
  onClick,
  testId,
  children,
}: {
  hint: ReactNode;
  disabled: boolean;
  onClick: () => void;
  testId: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Focusable only while disabled, so the reason is reachable by keyboard too. */}
        <span className="inline-flex" tabIndex={disabled ? 0 : undefined} data-testid={testId}>
          <Button size="sm" variant="ghost" onClick={onClick} disabled={disabled}>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-left leading-snug">{hint}</TooltipContent>
    </Tooltip>
  );
}

/**
 * "Check now" and, in a dark factory, "Run scout now" on the factory panel (§10.1). Both return
 * the fresh status, which replaces the cached one.
 */
export function FactoryRunButtons({ f, stopped }: { f: FactoryStatus; stopped: boolean }) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const show = (s: FactoryStatus) => queryClient.setQueryData(factoryKeys.status(f.projectId), s);
  const check = useMutation({
    mutationFn: () => client.factory.tick(f.projectId),
    onSuccess: (s) => {
      show(s);
      toast.success(
        t("project.factoryActions.checked", {
          state: LOOP_LABEL[s.loopState].label.toLowerCase(),
        }),
      );
    },
    onError: (e) =>
      toast.error(t("project.factoryActions.checkFailed"), { description: e.message }),
  });
  const scout = useMutation({
    mutationFn: () => client.factory.runScout(f.projectId),
    onSuccess: (s) => {
      show(s);
      toast.success(t("project.factoryActions.scoutStarted"), {
        description: t("project.factoryActions.scoutStartedHint"),
      });
    },
    onError: (e) => {
      toast.error(t("project.factoryActions.scoutFailed"), { description: e.message });
      void queryClient.invalidateQueries({ queryKey: factoryKeys.status(f.projectId) });
    },
  });
  const blocked = f.scout?.runNowBlockedBy ?? null;
  return (
    <>
      <HintButton
        hint={
          stopped
            ? t("project.factoryActions.killSwitchOn")
            : checkNowHelp(f.mode === "dark_factory")
        }
        disabled={check.isPending || stopped}
        onClick={() => check.mutate()}
        testId="factory-check-now"
      >
        <RefreshCw /> {t("project.factoryActions.checkNow")}
      </HintButton>
      {f.mode === "dark_factory" && f.scout && (
        <HintButton
          hint={blocked ?? t("project.factoryActions.runScoutHint")}
          disabled={scout.isPending || blocked !== null}
          onClick={() => scout.mutate()}
          testId="factory-run-scout"
        >
          <Radar /> {t("project.factoryActions.runScout")}
        </HintButton>
      )}
    </>
  );
}

/**
 * Opens the Factory view (`/projects/$projectId/factory/view`): the full-screen live view of the
 * factory. Only offered for projects in a factory mode.
 */
export function OpenFactoryViewButton({
  projectId,
  variant = "ghost",
}: {
  projectId: string;
  variant?: "ghost" | "outline";
}) {
  const { t } = useTranslation();
  return (
    <Button size="sm" variant={variant} asChild>
      <Link
        to="/projects/$projectId/factory/view"
        params={{ projectId }}
        data-testid="open-factory-view"
      >
        <MonitorPlay /> {t("project.factoryActions.factoryView")}
      </Link>
    </Button>
  );
}
