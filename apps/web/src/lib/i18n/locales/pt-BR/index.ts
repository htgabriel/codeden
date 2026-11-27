import type { Catalog } from "../en";
import { coreBR } from "./core";
import { inboxBR } from "./inbox";
import { orchestratorBR } from "./orchestrator";
import { projectBR } from "./project";

/** Brazilian Portuguese, loaded on demand; typed against the English catalog. */
const ptBR: Catalog = {
  ...coreBR,
  inbox: inboxBR,
  orchestrator: orchestratorBR,
  project: projectBR,
};

export default ptBR;
