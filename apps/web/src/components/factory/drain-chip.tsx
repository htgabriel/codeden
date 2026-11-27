import { drainText, type FactoryStatus } from "@codeden/contracts";
import { Hourglass } from "lucide-react";
import { InfoHint } from "@/components/common/info-hint";
import { useTranslation } from "@/lib/i18n";

/**
 * The kill switch's drain on the factory panel and the Factory view (`FactoryStatus.drain`):
 * "Draining: 2 items in flight". Nothing new starts, and the loop stops once they finish.
 */
export function DrainChip({ f }: { f: FactoryStatus }) {
  const { t } = useTranslation();
  if (!f.drain) return null;
  const paused = f.loopState === "paused";
  const deadline = f.drain.deadline
    ? t("factory.drain.deadline", {
        time: new Date(f.drain.deadline).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })
    : "";
  return (
    <span
      className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-full bg-status-waiting/12 px-2 py-0.5 text-2xs font-medium text-status-waiting"
      data-testid="factory-drain"
    >
      <Hourglass className="size-3 shrink-0" aria-hidden />
      <span className="shrink-0">{drainText(f.drain.inFlight)}</span>
      {paused && (
        <span className="truncate font-normal">
          {t("factory.drain.paused", { reason: f.pausedReason ?? "" })}
        </span>
      )}
      <InfoHint label={t("factory.drain.label")}>
        {`${t("factory.drain.hint")}${deadline}`}
      </InfoHint>
    </span>
  );
}
