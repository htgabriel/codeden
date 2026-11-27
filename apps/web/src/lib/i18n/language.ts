import type { UiLanguage, UiLanguagePreference } from "@codeden/contracts";

/**
 * The language the UI shows for a preference (§13). `auto` takes the first of the browser's
 * languages that CodeDen is translated into, matching on the base language, so `pt`, `pt-PT`
 * and `pt-BR` all get Brazilian Portuguese; anything else falls back to English.
 */
export function resolveLanguage(
  preference: UiLanguagePreference,
  browserLanguages: readonly string[],
): UiLanguage {
  if (preference !== "auto") return preference;
  for (const tag of browserLanguages) {
    const base = tag.toLowerCase().split("-")[0];
    if (base === "pt") return "pt-BR";
    if (base === "en") return "en";
  }
  return "en";
}

/** The browser's languages in order of preference (empty outside a browser). */
export function browserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  if (navigator.languages?.length) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}
