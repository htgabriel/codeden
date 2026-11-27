import type { Catalog } from "../en";
import { automationsBR } from "./automations";
import { coreBR } from "./core";
import { factoryBR } from "./factory";
import { factoryViewBR } from "./factoryView";
import { inboxBR } from "./inbox";
import { messagesBR } from "./messages";
import { orchestratorBR } from "./orchestrator";
import { pagesBR } from "./pages";
import { prefsBR } from "./prefs";
import { projectBR } from "./project";
import { sessionBR } from "./session";
import { shellBR } from "./shell";
import { workbenchBR } from "./workbench";

/** Brazilian Portuguese, loaded on demand; typed against the English catalog. */
const ptBR: Catalog = {
  ...coreBR,
  inbox: inboxBR,
  orchestrator: orchestratorBR,
  project: projectBR,
  factory: factoryBR,
  session: sessionBR,
  factoryView: factoryViewBR,
  automations: automationsBR,
  prefs: prefsBR,
  workbench: workbenchBR,
  shell: shellBR,
  pages: pagesBR,
  messages: messagesBR,
};

export default ptBR;
