import type { UsageDimension, UsageReport } from "@codeden/contracts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { i18n, useTranslation } from "@/lib/i18n";
import { useResolvedTheme } from "@/stores/theme";
import { money, percent, tokens } from "./format";
import { colorSlots, OTHER_COLOR, SERIES_COLORS } from "./palette";

const DIMENSIONS: readonly UsageDimension[] = ["provider", "model", "project", "role", "source"];

/** Each dimension's name, in the UI language. */
export const DIMENSION_LABELS: Record<UsageDimension, string> = Object.defineProperties(
  {} as Record<UsageDimension, string>,
  Object.fromEntries(
    DIMENSIONS.map((d) => [
      d,
      { get: () => i18n.t(`shell.breakdown.dimension.${d}`), enumerable: true },
    ]),
  ),
);

/** A table of one dimension's values with their share of spend; rows can narrow the report. */
export function BreakdownTable({
  report,
  dimension,
  onPick,
}: {
  report: UsageReport;
  dimension: UsageDimension;
  onPick?: (key: string) => void;
}) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const series = report.series[dimension];
  const slots = colorSlots(series.map((s) => s.key));
  const total = report.totals.costUsd;
  if (series.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">{t("shell.breakdown.none")}</p>
    );
  }
  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-8 text-2xs">{DIMENSION_LABELS[dimension]}</TableHead>
          <TableHead className="h-8 w-[28%] text-2xs">{t("shell.breakdown.share")}</TableHead>
          <TableHead className="h-8 text-right text-2xs">{t("shell.breakdown.cost")}</TableHead>
          <TableHead className="h-8 text-right text-2xs">{t("shell.breakdown.tokens")}</TableHead>
          <TableHead className="h-8 text-right text-2xs">{t("shell.breakdown.turns")}</TableHead>
          <TableHead className="h-8 text-right text-2xs">{t("shell.palette.sessions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {series.map((s) => {
          const slot = slots.get(s.key);
          const color =
            s.key === "__other" || slot === undefined
              ? OTHER_COLOR[theme]
              : (SERIES_COLORS[slot]?.[theme] ?? OTHER_COLOR[theme]);
          const share = total > 0 ? s.costUsd / total : 0;
          const pickable = Boolean(onPick) && s.key !== "__other" && s.key !== "";
          return (
            <TableRow
              key={s.key}
              className={pickable ? "cursor-pointer" : undefined}
              onClick={pickable ? () => onPick?.(s.key) : undefined}
              title={pickable ? t("shell.breakdown.showOnly", { label: s.label }) : undefined}
            >
              <TableCell className="max-w-56 py-2">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />
                  <span className="truncate font-medium">{s.label}</span>
                </span>
              </TableCell>
              <TableCell className="py-2">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(share * 100, share > 0 ? 1.5 : 0)}%`,
                        background: color,
                      }}
                    />
                  </span>
                  <span className="w-9 text-right text-muted-foreground tabular-nums">
                    {percent(share)}
                  </span>
                </span>
              </TableCell>
              <TableCell className="py-2 text-right font-mono tabular-nums">
                {money(s.costUsd, s.estimatedCostUsd > 0)}
              </TableCell>
              <TableCell className="py-2 text-right text-muted-foreground tabular-nums">
                {tokens(s.tokens)}
              </TableCell>
              <TableCell className="py-2 text-right text-muted-foreground tabular-nums">
                {s.turns.toLocaleString("en-US")}
              </TableCell>
              <TableCell className="py-2 text-right text-muted-foreground tabular-nums">
                {s.sessions.toLocaleString("en-US")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
