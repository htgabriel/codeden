import type { ReactNode } from "react";
import { InfoHint } from "@/components/common/info-hint";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** The small label on a pipeline diagram node: who does the step (§10.1). */
export type Kind =
  | "human"
  | "humanOrScout"
  | "llm"
  | "agent"
  | "workspace"
  | "auto"
  | "scout"
  | "checks";

/** `hint` turns the label into a tooltip that explains it. */
export function Badge({ kind, hint }: { kind: Kind; hint?: ReactNode }) {
  const { t } = useTranslation();
  const label = t(`factory.badge.${kind}`);
  return (
    <span
      className={cn(
        "absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border bg-card px-1.5 font-mono text-[9.5px] leading-4 whitespace-nowrap",
        kind === "human" || kind === "scout" || kind === "humanOrScout"
          ? "border-foreground/40 text-foreground"
          : kind === "auto"
            ? "border-primary/50 text-primary"
            : "border-border text-muted-foreground",
      )}
    >
      {hint ? (
        <InfoHint label={label} term={label}>
          {hint}
        </InfoHint>
      ) : (
        label
      )}
    </span>
  );
}
