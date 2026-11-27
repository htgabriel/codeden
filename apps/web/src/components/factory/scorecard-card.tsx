import type { FactoryScorecardRow, ScorecardAgent, ScorecardDays } from "@codeden/contracts";
import { BarChart3 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Segmented } from "@/components/automations/form-bits";
import { ProviderMark } from "@/components/common/bits";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROVIDER_NAMES } from "@/components/usage/format";
import { useFactoryScorecard } from "@/lib/factory";
import { useTranslation } from "@/lib/i18n";
import { useSnapshotData } from "@/lib/queries";
import { cn } from "@/lib/utils";
import {
  agentLabel,
  costPerMerge,
  costPerMergeTitle,
  firstPassRate,
  medianMerge,
  mergeRate,
  type ProviderNames,
  reviseAverage,
  type ScorecardView,
  spotChecks,
  spotChecksTitle,
} from "./scorecard";

const VIEWS: ScorecardView[] = ["builders", "reviewers", "pairs"];

const WINDOWS: Array<`${ScorecardDays}`> = ["7", "30", "90"];

/** Column headings, each with what it counts on hover (`factory.scorecard.columns.<key>`). */
const COLUMNS = [
  "finished",
  "merged",
  "firstPass",
  "reviseRounds",
  "reverted",
  "spotChecks",
  "costPerMerge",
  "toMerge",
] as const;

/**
 * The factory scorecard (§10.1): how each builder and reviewer, by provider and model, did on
 * the work that finished in the window, so who builds and who reviews (the Agents settings) can
 * be chosen on evidence. Fetched only while open.
 */
export function ScorecardCard({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ScorecardView>("builders");
  const [days, setDays] = useState<ScorecardDays>(30);
  const { data, error } = useFactoryScorecard(projectId, days, open);
  const providers = useSnapshotData((s) => s.runner.providers, []);
  const names: ProviderNames = (id) =>
    providers.find((p) => p.id === id)?.displayName ?? PROVIDER_NAMES[id] ?? id;
  const rows = data?.[view] ?? [];

  return (
    <details
      className="group rounded-lg border border-border bg-surface text-2xs"
      data-testid="factory-scorecard"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-1.5 font-medium text-muted-foreground">
        <BarChart3 className="size-3.5" aria-hidden />
        {t("factory.scorecard.title")}
        <span className="min-w-0 truncate font-normal text-muted-foreground/80">
          · {t("factory.scorecard.summary")}
        </span>
      </summary>
      {open && (
        <div className="space-y-2 border-t border-border p-2">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label={t("factory.scorecard.groupBy")}
              value={view}
              options={VIEWS.map((id) => ({ id, label: t(`factory.scorecard.views.${id}`) }))}
              onChange={setView}
            />
            <Segmented
              label={t("factory.scorecard.window")}
              value={`${days}` as const}
              options={WINDOWS.map((id) => ({ id, label: t("factory.scorecard.days", { n: id }) }))}
              onChange={(v) => setDays(Number(v) as ScorecardDays)}
            />
          </div>
          {error ? (
            <p className="py-4 text-center text-3xs text-status-failed">
              {t("factory.scorecard.loadFailed", { message: error.message })}
            </p>
          ) : !data || data.days !== days ? (
            <Skeleton className="h-24 w-full rounded-md" />
          ) : rows.length === 0 ? (
            <p className="py-4 text-center text-3xs text-muted-foreground/70">
              {t("factory.scorecard.empty", { days })}
            </p>
          ) : (
            <ScorecardTable rows={rows} view={view} names={names} />
          )}
          <p className="px-1 text-3xs text-muted-foreground/80">
            {t("factory.scorecard.footnote")}
          </p>
        </div>
      )}
    </details>
  );
}

function ScorecardTable(props: {
  rows: FactoryScorecardRow[];
  view: ScorecardView;
  names: ProviderNames;
}) {
  const { rows, view, names } = props;
  const { t } = useTranslation();
  return (
    <Table className="text-xs" data-testid="factory-scorecard-table">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-8 text-2xs">
            {view === "pairs"
              ? t("factory.scorecard.pairHeading")
              : t(`factory.scorecard.views.${view}`)}
          </TableHead>
          {COLUMNS.map((c) => (
            <TableHead
              key={c}
              className="h-8 text-right text-2xs"
              title={t(`factory.scorecard.columns.${c}.title`)}
            >
              {t(`factory.scorecard.columns.${c}.label`)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.key} data-testid="factory-scorecard-row">
            <TableCell className="max-w-80 py-1.5">
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                {view !== "reviewers" && <Agent agent={r.builder} names={names} />}
                {view === "pairs" && <span className="text-muted-foreground/60">→</span>}
                {view !== "builders" && <Agent agent={r.reviewer} names={names} />}
              </span>
            </TableCell>
            <Num>{r.finished}</Num>
            <Num>
              {r.merged} <Muted>{mergeRate(r)}</Muted>
            </Num>
            <Num
              title={t("factory.scorecard.firstPassTitle", { n: r.firstPass, merged: r.merged })}
            >
              {firstPassRate(r)}
            </Num>
            <Num
              title={t("factory.scorecard.reviseTitle", {
                rounds: r.reviseRounds,
                finished: r.finished,
              })}
            >
              {reviseAverage(r)}
            </Num>
            <Num className={cn(r.reverted > 0 && "text-status-failed")}>{r.reverted}</Num>
            <Num
              className={cn(r.spotProblems > 0 && "text-status-failed")}
              title={spotChecksTitle(r)}
            >
              {spotChecks(r)}
            </Num>
            <Num className="font-mono" title={costPerMergeTitle(r)}>
              {costPerMerge(r)}
            </Num>
            <Num>{medianMerge(r)}</Num>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Agent({ agent, names }: { agent: ScorecardAgent | null; names: ProviderNames }) {
  const { t } = useTranslation();
  if (!agent)
    return <span className="text-muted-foreground">{t("factory.scorecard.noReview")}</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5" title={agentLabel(agent, names)}>
      <ProviderMark provider={agent.provider} className="size-3.5 text-[8px]" />
      <span className="font-medium">{names(agent.provider)}</span>
      <span className="truncate font-mono text-2xs text-muted-foreground">
        {agent.model ?? t("factory.scorecard.defaultModel")}
      </span>
    </span>
  );
}

function Num(props: { children: ReactNode; className?: string; title?: string }) {
  return (
    <TableCell
      className={cn("py-1.5 text-right whitespace-nowrap tabular-nums", props.className)}
      title={props.title}
    >
      {props.children}
    </TableCell>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-2xs text-muted-foreground">{children}</span>;
}
