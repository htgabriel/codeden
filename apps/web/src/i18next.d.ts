import type { en } from "@/lib/i18n/locales/en";

/** Typed keys: `t("sidebar.inbox")` is checked against the English catalog. */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
    returnNull: false;
  }
}
