import { Cron } from "croner";

import { i18n } from "@/lib/i18n";

const DAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_ALIASES: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const isNum = (s: string) => /^\d+$/.test(s);
const pad = (s: string | number) => String(s).padStart(2, "0");
const dayId = (d: number) => DAY_IDS[d] ?? "sun";

/** "Monday" (in the UI language) for 0 = Sunday … 6 = Saturday. */
export function dayName(d: number): string {
  return i18n.t(`automations.cron.day.${dayId(d)}`);
}

/** "1st", "2nd", "11th" (plain numbers in languages without ordinal suffixes). */
export function ordinal(n: number): string {
  const rule = new Intl.PluralRules(i18n.language, { type: "ordinal" }).select(n);
  return i18n.t(`automations.cron.ordinal.${rule}`, { n });
}

/** "a and b", "a, b and c" in the UI language. */
function joinList(items: string[]): string {
  if (items.length < 2) return items[0] ?? "";
  return i18n.t("automations.cron.list", {
    list: items.slice(0, -1).join(", "),
    last: items.at(-1) ?? "",
  });
}

function dayNumber(token: string): number | null {
  const t = token.toLowerCase();
  if (isNum(t)) return Number(t) % 7;
  return DAY_ALIASES[t] ?? null;
}

/** "every Monday", "Mondays and Thursdays", "every weekday", "Monday to Wednesday", or null. */
function describeDays(field: string): string | null {
  const t = i18n.t;
  if (field === "1-5" || field.toLowerCase() === "mon-fri")
    return t("automations.cron.everyWeekday");
  if (field === "0,6" || field === "6,0") return t("automations.cron.everyWeekendDay");
  const range = field.split("-");
  if (range.length === 2) {
    const [a, b] = range.map((d) => dayNumber(d));
    if (a == null || b == null) return null;
    return t("automations.cron.dayRange", { from: dayName(a), to: dayName(b) });
  }
  const days = field.split(",").map(dayNumber);
  if (days.some((d) => d == null)) return null;
  if (days.length === 1) return t(`automations.cron.everyDay.${dayId(days[0] ?? 0)}`);
  return joinList(days.map((d) => t(`automations.cron.dayPlural.${dayId(d ?? 0)}`)));
}

/**
 * A plain-language description of a 5-field cron expression ("Every Monday at 03:00",
 * "Every 15 minutes", "Weekdays at 09:30") in the UI language. Unusual expressions fall back
 * to "Custom schedule".
 */
export function describeCron(expression: string): string {
  const t = i18n.t;
  const custom = t("automations.cron.custom");
  const parts = expression.trim().split(/\s+/);
  if (parts.length === 6) parts.shift(); // Seconds field.
  if (parts.length !== 5) return custom;
  const [min = "", hour = "", dom = "", month = "", dow = ""] = parts;
  const everyMin = /^\*\/(\d+)$/.exec(min);
  if (everyMin && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    return everyMin[1] === "1"
      ? t("automations.cron.everyMinute")
      : t("automations.cron.everyMinutes", { n: everyMin[1] ?? "" });
  }
  if (min === "*" && hour === "*" && dom === "*" && month === "*" && dow === "*")
    return t("automations.cron.everyMinute");
  if (!isNum(min) || month !== "*") return custom;
  const everyHour = /^\*\/(\d+)$/.exec(hour);
  if (hour === "*" && dom === "*" && dow === "*")
    return t("automations.cron.everyHourAt", { min: pad(min) });
  if (everyHour && dom === "*" && dow === "*") {
    return t("automations.cron.everyHoursAt", { n: everyHour[1] ?? "", min: pad(min) });
  }
  if (!isNum(hour)) return custom;
  const time = `${pad(hour)}:${pad(min)}`;
  if (dom === "*" && dow === "*") return t("automations.cron.everyDayAt", { time });
  if (dom === "*") {
    const days = describeDays(dow);
    if (!days) return custom;
    return t("automations.cron.daysAt", {
      days: `${days.charAt(0).toUpperCase()}${days.slice(1)}`,
      time,
    });
  }
  const doms = dom.split(",");
  if (dow === "*" && doms.every(isNum)) {
    const list = joinList(doms.map((d) => ordinal(Number(d))));
    return t("automations.cron.monthly", { count: doms.length, list, time });
  }
  return custom;
}

/** The parse error of a cron expression, or null when croner accepts it. */
export function cronError(expression: string, timezone?: string): string | null {
  try {
    new Cron(expression, timezone ? { timezone } : {});
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** The next `count` occurrences after `after` (now), or [] for an invalid expression. */
export function nextRuns(
  expression: string,
  timezone: string | undefined,
  count: number,
  after?: Date,
): Date[] {
  try {
    return new Cron(expression, timezone ? { timezone } : {}).nextRuns(count, after);
  } catch {
    return [];
  }
}

/** Common schedules offered as presets in the trigger editor. */
const preset = (
  id: "hourly" | "daily" | "weekdays" | "mondays" | "monthly",
  expression: string,
) => ({
  get label() {
    return i18n.t(`automations.cron.presets.${id}`);
  },
  expression,
});

export const CRON_PRESETS: { label: string; expression: string }[] = [
  preset("hourly", "0 * * * *"),
  preset("daily", "0 3 * * *"),
  preset("weekdays", "0 9 * * 1-5"),
  preset("mondays", "0 3 * * 1"),
  preset("monthly", "0 4 1 * *"),
];

/** The machine's IANA timezone. */
export function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** IANA timezones the browser knows (falls back to a short list). */
export function timezones(): string[] {
  const intl = Intl as { supportedValuesOf?: (key: string) => string[] };
  const list = intl.supportedValuesOf?.("timeZone") ?? ["UTC", "Europe/London", "America/New_York"];
  return list.includes("UTC") ? list : ["UTC", ...list];
}

/** "Mon 10 Nov, 03:00" in the given timezone, formatted for the UI language. */
export function formatAt(date: Date | string, timezone?: string): string {
  return new Date(date).toLocaleString(i18n.language, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...(timezone ? { timeZone: timezone } : {}),
  });
}
