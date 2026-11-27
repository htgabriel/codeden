import type {
  Automation,
  AutomationEventName,
  AutomationRun,
  AutomationRunStatus,
  AutomationTrigger,
  OverlapPolicy,
} from "@codeden/contracts";
import { describeCron } from "@/lib/cron";
import type { Tone } from "@/lib/format";
import { i18n } from "@/lib/i18n";
import type { automations } from "@/lib/i18n/locales/en/automations";

/*
 * Every text here is a getter (or a function) calling `i18n.t`, so it follows the UI language
 * (§13) while keeping the shapes consumers read. The catalog is `locales/<lang>/automations.ts`.
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

const EVENT_KEY = {
  "session.finished": "automations.event.sessionFinished",
  "session.failed": "automations.event.sessionFailed",
  "session.needs_input": "automations.event.sessionNeedsInput",
  "pr.opened": "automations.event.prOpened",
  "pr.merged": "automations.event.prMerged",
  "pr.checks_failed": "automations.event.prChecksFailed",
  "pr.review_requested": "automations.event.prReviewRequested",
  "issue.opened": "automations.event.issueOpened",
  "issue.labeled": "automations.event.issueLabeled",
  "issue.commented": "automations.event.issueCommented",
} as const satisfies Record<AutomationEventName, string>;

/** Plain names of the events an automation can react to (§10), read after "When". */
export const EVENT_LABEL: Record<AutomationEventName, string> = textMap(
  Object.keys(EVENT_KEY) as AutomationEventName[],
  (k) => i18n.t(EVENT_KEY[k]),
);

/** A `{{placeholder}}` the prompt can use, with what it becomes. */
export interface Placeholder {
  token: string;
  label: string;
}

type PlaceholderKey = Exclude<keyof (typeof automations)["placeholder"], "group">;

const ph = (token: string, key: PlaceholderKey): Placeholder => ({
  token,
  get label() {
    return i18n.t(`automations.placeholder.${key}`);
  },
});

const ALWAYS: Placeholder[] = [
  ph("{{project.name}}", "projectName"),
  ph("{{date}}", "date"),
  ph("{{time}}", "time"),
];
const ISSUE: Placeholder[] = [
  ph("{{issue.number}}", "issueNumber"),
  ph("{{issue.title}}", "issueTitle"),
  ph("{{issue.url}}", "issueUrl"),
  ph("{{issue.author}}", "issueAuthor"),
  ph("{{issue.labels}}", "issueLabels"),
  ph("{{issue.body}}", "issueBody"),
];
const COMMENT: Placeholder[] = [
  ph("{{comment.author}}", "commentAuthor"),
  ph("{{comment.body}}", "commentBody"),
  ph("{{comment.url}}", "commentUrl"),
];
const PR: Placeholder[] = [
  ph("{{pr.number}}", "prNumber"),
  ph("{{pr.title}}", "prTitle"),
  ph("{{pr.url}}", "prUrl"),
  ph("{{pr.branch}}", "prBranch"),
  ph("{{pr.base}}", "prBase"),
  ph("{{pr.failedChecks}}", "prFailedChecks"),
  ph("{{pr.reviewers}}", "prReviewers"),
];
const SESSION: Placeholder[] = [
  ph("{{session.id}}", "sessionId"),
  ph("{{session.purpose}}", "sessionPurpose"),
  ph("{{session.workKey}}", "sessionWorkKey"),
  ph("{{session.summary}}", "sessionSummary"),
  ph("{{session.outcome}}", "sessionOutcome"),
];

/** Placeholders a trigger fills: always the project and date, plus the event's fields. */
export function placeholdersFor(t: AutomationTrigger): { group: string; items: Placeholder[] }[] {
  const group = (g: keyof (typeof automations)["placeholder"]["group"]) =>
    i18n.t(`automations.placeholder.group.${g}`);
  const groups = [{ group: group("always"), items: ALWAYS }];
  if (t.type !== "event") return groups;
  if (t.event.startsWith("issue.")) groups.push({ group: group("issue"), items: ISSUE });
  if (t.event === "issue.commented") groups.push({ group: group("comment"), items: COMMENT });
  if (t.event.startsWith("pr.")) groups.push({ group: group("pr"), items: PR });
  if (t.event.startsWith("session.")) groups.push({ group: group("session"), items: SESSION });
  return groups;
}

/** "When a pull request is opened" (in the UI language) for one event. */
export function describeEvent(event: AutomationEventName): string {
  return i18n.t("automations.trigger.when", { event: EVENT_LABEL[event].toLowerCase() });
}

/** "Every Monday at 03:00", "When a pull request is opened", "Only when you run it". */
export function describeTrigger(t: AutomationTrigger): string {
  if (t.type === "manual") return i18n.t("automations.trigger.manual");
  if (t.type === "event") return describeEvent(t.event);
  return describeCron(t.expression);
}

export const ACTION_LABEL: Record<Automation["action"]["type"], string> = textMap(
  ["start_session", "message_pm", "triage"],
  (k) => i18n.t(`automations.action.${k}`),
);

const POLICIES: OverlapPolicy[] = ["skip-if-running", "queue", "run-anyway"];

export const OVERLAP_LABEL: Record<OverlapPolicy, string> = textMap(POLICIES, (k) =>
  i18n.t(`automations.overlap.${k}`),
);

export const OVERLAP_HELP: Record<OverlapPolicy, string> = textMap(POLICIES, (k) =>
  i18n.t(`automations.overlapHelp.${k}`),
);

export const SOURCE_LABEL: Record<Automation["source"], string> = textMap(
  ["builtin", "global_file", "project_file", "database"],
  (k) => i18n.t(`automations.source.${k}`),
);

const RUN_TONES: Record<AutomationRunStatus, Tone> = {
  queued: "idle",
  running: "running",
  completed: "done",
  failed: "failed",
  skipped: "waiting",
  cancelled: "idle",
};

export const RUN_STATUS: Record<AutomationRunStatus, { label: string; tone: Tone }> = (() => {
  const out = {} as Record<AutomationRunStatus, { label: string; tone: Tone }>;
  for (const key of Object.keys(RUN_TONES) as AutomationRunStatus[]) {
    out[key] = {
      get label() {
        return i18n.t(`automations.runStatus.${key}`);
      },
      tone: RUN_TONES[key],
    };
  }
  return out;
})();

export const SKIP_REASON: Record<NonNullable<AutomationRun["skipReason"]>, string> = textMap(
  [
    "overlap",
    "concurrency",
    "quiet_hours",
    "daily_cap",
    "disabled",
    "skipped_by_pm",
    "conflict_skip",
    "factory_intake",
  ],
  (k) => i18n.t(`automations.skipReason.${k}`),
);

export const TRIGGERED_BY: Record<AutomationRun["triggeredBy"], string> = textMap(
  ["cron", "event", "manual", "catch_up"],
  (k) => i18n.t(`automations.triggeredBy.${k}`),
);

/** Session-run actions with provider settings (the others run in the PM's chat). */
export function isSessionAction(
  a: Automation["action"],
): a is Extract<Automation["action"], { type: "start_session" }> {
  return a.type === "start_session";
}
