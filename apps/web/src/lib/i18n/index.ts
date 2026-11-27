import type { UiLanguage } from "@codeden/contracts";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { type Catalog, en } from "./locales/en";

/**
 * UI translation (§13). English is bundled and initialised synchronously on import, so every
 * component (and every test) renders English without waiting. Other catalogs are fetched with
 * `import()` the first time their language is chosen, which keeps them out of the entry chunk.
 * Components import `useTranslation` from here, which guarantees the instance is set up.
 */
export const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: "en",
  fallbackLng: "en",
  initAsync: false,
  // React escapes text itself.
  interpolation: { escapeValue: false },
  returnNull: false,
});

const LOADERS: Record<Exclude<UiLanguage, "en">, () => Promise<{ default: Catalog }>> = {
  "pt-BR": () => import("./locales/pt-BR"),
};

/** Switch the UI to `language`, loading its catalog first; keeps `<html lang>` in step. */
export async function applyLanguage(language: UiLanguage): Promise<void> {
  if (language !== "en" && !i18n.hasResourceBundle(language, "translation")) {
    const { default: catalog } = await LOADERS[language]();
    i18n.addResourceBundle(language, "translation", catalog);
  }
  await i18n.changeLanguage(language);
  if (typeof document !== "undefined") document.documentElement.lang = language;
}

export { Trans, useTranslation } from "react-i18next";
export { browserLanguages, resolveLanguage } from "./language";
