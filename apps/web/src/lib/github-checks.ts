import type { GithubCheck, GithubChecksSummary } from "@codeden/contracts";
import { i18n } from "@/lib/i18n";

/**
 * What one GitHub check (a check run or a commit status) looks like to the user. Every raw
 * `status`/`conclusion` pair from GitHub maps to exactly one of these, so the UI never shows
 * strings like `in_progress` or `timed_out`.
 */
export type CheckState =
  | "running"
  | "queued"
  | "passed"
  | "failed"
  | "skipped"
  | "neutral"
  | "cancelled"
  | "timed_out"
  | "action_required"
  | "stale";

/** Colour family of a state, matching the `text-status-*` tokens. */
export type CheckTone = "running" | "waiting" | "done" | "failed" | "muted";

export interface CheckStateInfo {
  label: string;
  tone: CheckTone;
  /** Still going: not finished yet. */
  active: boolean;
}

export const CHECK_STATES: Record<CheckState, CheckStateInfo> = {
  running: {
    get label() {
      return i18n.t("messages.checks.states.running");
    },
    tone: "running",
    active: true,
  },
  queued: {
    get label() {
      return i18n.t("messages.checks.states.queued");
    },
    tone: "waiting",
    active: true,
  },
  passed: {
    get label() {
      return i18n.t("messages.checks.states.passed");
    },
    tone: "done",
    active: false,
  },
  failed: {
    get label() {
      return i18n.t("messages.checks.states.failed");
    },
    tone: "failed",
    active: false,
  },
  skipped: {
    get label() {
      return i18n.t("messages.checks.states.skipped");
    },
    tone: "muted",
    active: false,
  },
  neutral: {
    get label() {
      return i18n.t("messages.checks.states.neutral");
    },
    tone: "muted",
    active: false,
  },
  cancelled: {
    get label() {
      return i18n.t("messages.checks.states.cancelled");
    },
    tone: "muted",
    active: false,
  },
  timed_out: {
    get label() {
      return i18n.t("messages.checks.states.timed_out");
    },
    tone: "failed",
    active: false,
  },
  action_required: {
    get label() {
      return i18n.t("messages.checks.states.action_required");
    },
    tone: "waiting",
    active: false,
  },
  stale: {
    get label() {
      return i18n.t("messages.checks.states.stale");
    },
    tone: "muted",
    active: false,
  },
};

/** Check-run statuses that mean "waiting to start". */
const QUEUED_STATUSES = new Set(["queued", "waiting", "requested", "expected"]);

/** Completed conclusions (check runs and commit statuses) and the state each one shows. */
const CONCLUSIONS: Record<string, CheckState> = {
  success: "passed",
  failure: "failed",
  error: "failed",
  startup_failure: "failed",
  skipped: "skipped",
  neutral: "neutral",
  cancelled: "cancelled",
  timed_out: "timed_out",
  action_required: "action_required",
  stale: "stale",
};

/**
 * The state of one check. Check-run statuses are `queued`, `waiting`, `requested`, `pending`,
 * `in_progress` and `completed`; commit statuses arrive as `pending` or `completed`. A commit
 * status can't tell "waiting" from "working", and GitHub shows `pending` as in progress, so it
 * reads as running. An unknown conclusion counts as failed, the same way the server counts it
 * against the PR.
 */
export function checkState(status: string, conclusion: string | null): CheckState {
  const s = status.toLowerCase();
  if (s !== "completed") return QUEUED_STATUSES.has(s) ? "queued" : "running";
  return CONCLUSIONS[(conclusion ?? "").toLowerCase()] ?? "failed";
}

export function checkLabel(status: string, conclusion: string | null): string {
  return CHECK_STATES[checkState(status, conclusion)].label;
}

/** Counts of a PR's checks by what they show, for the progress bar. */
export interface ChecksBreakdown {
  passed: number;
  failed: number;
  running: number;
  queued: number;
  /** Skipped, neutral, cancelled and stale. */
  other: number;
}

export function checksBreakdown(checks: GithubCheck[]): ChecksBreakdown {
  const out: ChecksBreakdown = { passed: 0, failed: 0, running: 0, queued: 0, other: 0 };
  for (const c of checks) {
    const state = checkState(c.status, c.conclusion);
    const tone = CHECK_STATES[state].tone;
    if (state === "running") out.running++;
    else if (state === "queued") out.queued++;
    else if (state === "passed") out.passed++;
    else if (tone === "failed" || state === "action_required") out.failed++;
    else out.other++;
  }
  return out;
}

/**
 * The one state that sums up a PR's checks, for the header badge: running while any check is
 * running, queued while the rest are only waiting, else the rolled-up result. `null` with no
 * checks.
 */
export function summaryState(summary: GithubChecksSummary): CheckState | null {
  if (summary.state === "none" || summary.total === 0) return null;
  if (summary.state === "success") return "passed";
  if (summary.state === "failure") return "failed";
  const b = checksBreakdown(summary.checks);
  // Without the per-check list a pending summary is shown as running.
  return b.running > 0 || b.queued === 0 ? "running" : "queued";
}

/** One-line description of a PR's checks for tooltips and screen readers. */
export function summaryLabel(summary: GithubChecksSummary): string {
  const t = i18n.t;
  if (summary.state === "none" || summary.total === 0) return t("messages.checks.none");
  const b = checksBreakdown(summary.checks);
  const parts: string[] = [
    t("messages.checks.passed", { passed: summary.passed, total: summary.total }),
  ];
  if (summary.failed) parts.push(t("messages.checks.failed", { count: summary.failed }));
  if (b.running) parts.push(t("messages.checks.running", { count: b.running }));
  if (b.queued) parts.push(t("messages.checks.queued", { count: b.queued }));
  return parts.join(", ");
}
