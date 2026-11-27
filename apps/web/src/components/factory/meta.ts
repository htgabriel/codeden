import type {
  AutonomyMode,
  DiscoveryArea,
  FactoryItemSource,
  FactoryItemStage,
  FactoryLoopState,
  FactoryPrState,
  InvestigationOutcome,
  MergeCheckName,
  PipelineStep,
  WorkType,
} from "@codeden/contracts";
import type { Tone } from "@/lib/format";
import { i18n } from "@/lib/i18n";

/*
 * Every text here is a getter (or a function) calling `i18n.t`, so it follows the UI language
 * (§13) while keeping the shapes consumers read. The catalog is `locales/<lang>/factory.ts`.
 */

/** A record of `keys` whose values are read through `text` each time. */
function textMap<K extends string>(
  keys: readonly K[],
  text: (key: K) => string,
): Record<K, string> {
  const props: PropertyDescriptorMap = {};
  for (const key of keys) props[key] = { get: () => text(key), enumerable: true };
  return Object.defineProperties({} as Record<K, string>, props);
}

/** A record of `{ label, tone }` with the tones fixed and the labels read through `text`. */
function tonedMap<K extends string>(
  tones: Record<K, Tone>,
  text: (key: K) => string,
): Record<K, { label: string; tone: Tone }> {
  const out = {} as Record<K, { label: string; tone: Tone }>;
  for (const key of Object.keys(tones) as K[]) {
    out[key] = {
      get label() {
        return text(key);
      },
      tone: tones[key],
    };
  }
  return out;
}

const mode = (id: AutonomyMode, experimental: boolean) => ({
  id,
  get label() {
    return i18n.t(`factory.mode.${id}.label`);
  },
  get summary() {
    return i18n.t(`factory.mode.${id}.summary`);
  },
  get finds() {
    return i18n.t(`factory.mode.${id}.finds`);
  },
  get merges() {
    return i18n.t(`factory.mode.${id}.merges`);
  },
  experimental,
});

/** The autonomy ladder (§10.1), climbed one step at a time. */
export const MODES: {
  id: AutonomyMode;
  label: string;
  summary: string;
  finds: string;
  merges: string;
  experimental: boolean;
}[] = [
  mode("manual", false),
  mode("assisted", false),
  mode("software_factory", true),
  mode("dark_factory", true),
];

export const MODE_LABEL: Record<AutonomyMode, string> = textMap(
  ["manual", "assisted", "software_factory", "dark_factory"],
  (k) => i18n.t(`factory.mode.${k}.label`),
);

export const LOOP_LABEL: Record<FactoryLoopState, { label: string; tone: Tone }> = tonedMap(
  {
    idle: "idle",
    discovering: "running",
    building: "running",
    verifying: "waiting",
    paused: "waiting",
    stopped: "failed",
    draining: "waiting",
  },
  (k) => i18n.t(`factory.loop.${k}`),
);

export const STAGE_LABEL: Record<FactoryItemStage, { label: string; tone: Tone }> = tonedMap(
  {
    candidate: "idle",
    ignored: "idle",
    backlog: "idle",
    building: "running",
    verifying: "waiting",
    watching: "running",
    merged: "done",
    reverted: "failed",
    rejected: "idle",
    failed: "failed",
    escalated: "waiting",
  },
  (k) => i18n.t(`factory.stage.${k}`),
);

const PR_TONES: Record<FactoryPrState, Tone> = {
  checking: "running",
  waiting_ci: "running",
  queued: "waiting",
  updating: "running",
  rebasing: "running",
  rebuilding: "running",
  superseded: "idle",
  merged: "done",
  waiting_for_you: "waiting",
  stuck: "failed",
};

/** A factory PR's state on the panel's merge queue card, with what it means. */
export const PR_STATE_LABEL: Record<FactoryPrState, { label: string; tone: Tone; help: string }> =
  (() => {
    const out = {} as Record<FactoryPrState, { label: string; tone: Tone; help: string }>;
    for (const key of Object.keys(PR_TONES) as FactoryPrState[]) {
      out[key] = {
        get label() {
          return i18n.t(`factory.prState.${key}.label`);
        },
        tone: PR_TONES[key],
        get help() {
          return i18n.t(`factory.prState.${key}.help`);
        },
      };
    }
    return out;
  })();

export const SOURCE_LABEL: Record<FactoryItemSource, string> = textMap(
  ["discovery", "issue", "failed_check", "revert"],
  (k) => i18n.t(`factory.source.${k}`),
);

export const TYPE_LABEL: Record<WorkType, string> = textMap(["bug", "feature", "docs"], (k) =>
  i18n.t(`factory.type.${k}`),
);

/** What the first step decided (the item page's Reproduction or Analysis card), in words. */
export const OUTCOME_LABEL: Record<InvestigationOutcome, string> = textMap(
  ["reproduced", "not_reproduced", "implement", "already_done", "needs_info", "out_of_scope"],
  (k) => i18n.t(`factory.outcome.${k}`),
);

export const AREA_LABEL: Record<DiscoveryArea, string> = textMap(
  ["features", "ux", "performance", "tech_debt", "test_gaps", "security", "bugs", "docs"],
  (k) => i18n.t(`factory.area.${k}`),
);

/** What each step is called in each pipeline (the diagram's node labels). */
export function stepLabel(step: PipelineStep, type: WorkType | null): string {
  const t = i18n.t;
  switch (step) {
    case "implement":
      return type === "bug"
        ? t("factory.step.implementBug")
        : type === "docs"
          ? t("factory.step.implementDocs")
          : t("factory.step.implementFeature");
    case "review":
      return type === "bug"
        ? t("factory.step.reviewBug")
        : type === "docs"
          ? t("factory.step.reviewDocs")
          : t("factory.step.reviewFeature");
    default:
      return t(`factory.step.${step}`);
  }
}

// ---------------------------------------------------------------- plain-language hints

/** What a lane of the pipeline diagram is (the "?" by the lane's name). */
export const LANE_HELP: Record<WorkType, string> = textMap(["bug", "feature", "docs"], (k) =>
  i18n.t(`factory.lane.${k}`),
);

/** Where the work comes from (the diagram's first node). */
export function issueHelp(dark: boolean): string {
  return dark ? i18n.t("factory.issueHelp.dark") : i18n.t("factory.issueHelp.light");
}

/** What happens at a pipeline step and what moves the work on (the diagram's node hints). */
export function stepHelp(step: PipelineStep, type: WorkType | null, autoMerge: boolean): string {
  const t = i18n.t;
  switch (step) {
    case "implement":
      return type === "bug"
        ? t("factory.stepHelp.implementBug")
        : type === "docs"
          ? t("factory.stepHelp.implementDocs")
          : t("factory.stepHelp.implementFeature");
    case "review":
      return type === "docs" ? t("factory.stepHelp.reviewDocs") : t("factory.stepHelp.review");
    case "merge":
      return autoMerge ? t("factory.stepHelp.mergeAuto") : t("factory.stepHelp.mergeManual");
    default:
      return t(`factory.stepHelp.${step}`);
  }
}

/** The revise loop under each review node. */
export const reviseHelp = (): string => i18n.t("factory.reviseHelp");

/** The dark factory's scout. */
export const scoutHelp = (): string => i18n.t("factory.scoutHelp");

/** One review round of the scout. */
export const roundHelp = (): string => i18n.t("factory.roundHelp");

/** "Check now" on the factory panel: one run of the loop's regular check. */
export function checkNowHelp(dark: boolean): string {
  return dark ? i18n.t("factory.checkNowHelp.dark") : i18n.t("factory.checkNowHelp.light");
}

/** The work-in-progress limit (`maxOpenPrs`). */
export const wipHelp = (): string => i18n.t("factory.wipHelp");

/** Work waiting on a provider (`FactoryWip.note`). */
export const providerWaitHelp = (): string => i18n.t("factory.providerWaitHelp");

/** Who gets a free agent first. */
export const slotOrderHelp = (): string => i18n.t("factory.slotOrderHelp");

/** "Finishing open work (2 of 2 PRs open)". */
export function wipLabel(wip: { openPrs: number; limit: number }): string {
  return i18n.t("factory.wipLabel", { openPrs: wip.openPrs, limit: wip.limit });
}

/** The scout's review areas (one long-lived reviewer agent per area). */
export const reviewAreasHelp = (): string => i18n.t("factory.reviewAreasHelp");

export const CHECK_LABEL: Record<MergeCheckName, string> = textMap(
  ["ci", "tests", "test_results", "review", "security", "ui_evidence", "size", "protected_paths"],
  (k) => i18n.t(`factory.check.${k}`),
);

export const CHECK_HELP: Record<MergeCheckName, string> = textMap(
  ["ci", "tests", "test_results", "review", "security", "ui_evidence", "size", "protected_paths"],
  (k) => i18n.t(`factory.checkHelp.${k}`),
);
