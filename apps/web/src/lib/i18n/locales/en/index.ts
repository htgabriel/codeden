import { core } from "./core";
import { factory } from "./factory";
import { inbox } from "./inbox";
import { orchestrator } from "./orchestrator";
import { project } from "./project";
import { session } from "./session";

/**
 * The English catalog: the source of every UI string and the fallback for missing ones (§13).
 * It ships in the entry chunk; other languages load on demand (`../../index.ts`). One file per
 * area keeps the files small and lets areas be translated independently. Plurals use i18next's
 * `_one` / `_other` suffixes; values are interpolated with `{{name}}`.
 */
export const en = { ...core, inbox, orchestrator, project, factory, session } as const;

/** The shape every other catalog must match: same keys, any strings. */
export type Catalog<T = typeof en> = {
  [K in keyof T]: T[K] extends string ? string : Catalog<T[K]>;
};
