import type { Catalog } from "../en";
import { coreBR } from "./core";
import { factoryBR } from "./factory";
import { inboxBR } from "./inbox";
import { orchestratorBR } from "./orchestrator";
import { projectBR } from "./project";
import { sessionBR } from "./session";

/** Brazilian Portuguese, loaded on demand; typed against the English catalog. */
const ptBR: Catalog = {
  ...coreBR,
  inbox: inboxBR,
  orchestrator: orchestratorBR,
  project: projectBR,
  factory: factoryBR,
  session: sessionBR,
};

export default ptBR;
