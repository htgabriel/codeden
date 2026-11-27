import { AREA_LABEL } from "@/components/factory/meta";
import { i18n } from "@/lib/i18n";
import { textMap } from "../stages";
import type { AgentRole, AgentStatus, AgentStep, BlockedOn, SceneAgent } from "./agents";

/**
 * What an agent's card says about it on hover or keyboard focus (#264): its role, the item
 * with its issue and PR number, the step, provider and model, the latest progress line, the time
 * in this step and a plain status. Pure, so each role's and step's card is unit-tested; the
 * component only lays it out. The same facts name the agent's button for screen readers.
 */

export const ROLE_LABEL: Record<AgentRole, string> = textMap(
  ["builder", "reviewer", "rebaser", "integrator", "scout", "area", "pm"],
  (k) => i18n.t(`factoryView.agentCard.role.${k}`),
);

export const STEP_LABEL: Record<AgentStep, string> = textMap(
  [
    "reproducing",
    "analyzing",
    "implementing",
    "revising",
    "reviewing",
    "rebasing",
    "merging",
    "watching_ci",
  ],
  (k) => i18n.t(`factoryView.agentCard.step.${k}`),
);

export const STATUS_LABEL: Record<AgentStatus, string> = textMap(
  ["working", "thinking", "approval", "blocked", "done", "idle"],
  (k) => i18n.t(`factoryView.agentCard.status.${k}`),
);

const BLOCKED_LABEL: Record<BlockedOn, string> = textMap(
  ["ci", "conflicts", "agent", "turn", "person", "failed", "cut_off"],
  (k) => i18n.t(`factoryView.agentCard.blocked.${k}`),
);

export interface AgentCardModel {
  role: string;
  /** "#142 · PR #57", or null for agents without an item. */
  refs: string | null;
  /** The item's title, or null. */
  title: string | null;
  step: string;
  /** "Claude Code · opus", or "No session yet". */
  model: string;
  progress: string | null;
  /** Time in this step ("12 min"), or null when unknown. */
  inStep: string | null;
  status: string;
  statusKind: AgentStatus;
}

/** A step's length in a few characters: "under a minute", "12 min", "2 h 5 min", "3 days". */
export function stepTime(ms: number): string {
  const min = Math.floor(ms / 60_000);
  const t = i18n.t;
  if (min < 1) return t("factoryView.agentCard.underAMinute");
  if (min < 60) return t("factoryView.agentCard.min", { min });
  const h = Math.floor(min / 60);
  if (h < 24)
    return min % 60
      ? t("factoryView.agentCard.hMin", { h, min: min % 60 })
      : t("factoryView.agentCard.h", { h });
  const d = Math.floor(h / 24);
  return t("factoryView.agentCard.days", { count: d });
}

function stepOf(a: SceneAgent): string {
  if (!a.step) return a.activity ?? "—";
  const queued = a.step === "merging" ? a.card?.pr?.queuePosition : null;
  return queued
    ? i18n.t("factoryView.agentCard.inLine", { step: STEP_LABEL[a.step], n: queued })
    : STEP_LABEL[a.step];
}

export function agentCard(a: SceneAgent, now: number): AgentCardModel {
  const w = a.card?.item;
  const pr = a.card?.pr?.pr ?? w?.pr ?? w?.ownedPr ?? null;
  const refs = w
    ? [w.issue ? `#${w.issue.number}` : null, pr ? `PR #${pr.number}` : null]
        .filter(Boolean)
        .join(" · ") || null
    : null;
  const since = a.since ? Date.parse(a.since) : Number.NaN;
  return {
    role:
      a.role === "area" && a.area
        ? `${ROLE_LABEL.area} · ${AREA_LABEL[a.area]}`
        : ROLE_LABEL[a.role],
    refs,
    title: w?.title ?? null,
    step: stepOf(a),
    model:
      [a.provider, a.model].filter(Boolean).join(" · ") ||
      i18n.t("factoryView.agentCard.noSession"),
    progress: a.progress,
    inStep: Number.isNaN(since) ? null : stepTime(Math.max(0, now - since)),
    status:
      a.status === "blocked" && a.blockedOn
        ? `${STATUS_LABEL.blocked}: ${BLOCKED_LABEL[a.blockedOn]}`
        : STATUS_LABEL[a.status],
    statusKind: a.status,
  };
}

/** The card in one line, for the agent's button: "Builder, #142 · PR #57 Fix the flake, …". */
export function agentLabel(card: AgentCardModel): string {
  const what = [card.refs, card.title].filter(Boolean).join(" ");
  return [card.role, what || null, card.step, card.status].filter(Boolean).join(", ");
}
