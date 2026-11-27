import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Workflow } from "lucide-react";
import { AutomationsPanel } from "@/components/automations/automations-panel";
import { ExportAllButton } from "@/components/automations/export-menu";
import { ImportDialog } from "@/components/automations/import-dialog";
import { RunsTable } from "@/components/automations/runs-table";
import { TemplatesGallery } from "@/components/automations/templates-gallery";
import { SectionLabel } from "@/components/common/bits";
import { NextRuns } from "@/components/project/now-next";
import { ProjectTile } from "@/components/shell/sidebar/project-group";
import { Button } from "@/components/ui/button";
import { useAutomations } from "@/lib/automations";
import { useTranslation } from "@/lib/i18n";
import { useProject } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { PageHeader } from "./page-header";

export type AutomationsTab = "automations" | "runs" | "templates";

const TABS: AutomationsTab[] = ["automations", "runs", "templates"];

/** A project's automations (§10): the list with switches, runs history and templates. */
export function AutomationsPage({ projectId, tab }: { projectId: string; tab: AutomationsTab }) {
  const { t } = useTranslation();
  const project = useProject(projectId);
  const navigate = useNavigate();
  const { data } = useAutomations(projectId);
  if (!project) return null;
  const on = data?.automations.filter((i) => i.states[0]?.enabled).length ?? 0;
  const go = (next: AutomationsTab) =>
    void navigate({
      to: "/projects/$projectId/automations",
      params: { projectId },
      search: next === "automations" ? {} : { tab: next },
      replace: true,
    });

  return (
    <>
      <PageHeader
        icon={<ProjectTile project={project} className="size-5 text-2xs" />}
        title={
          <span className="flex items-center gap-1.5">
            {project.name} <span className="text-muted-foreground">/</span>
            <Workflow className="size-3.5 text-muted-foreground" />{" "}
            {t("automations.listPage.automations")}
          </span>
        }
        meta={t("automations.listPage.meta", { on, total: data?.automations.length ?? 0 })}
        actions={
          <>
            <ExportAllButton projectId={projectId} />
            <ImportDialog projectId={projectId} />
            <Button size="sm" asChild>
              <Link to="/projects/$projectId/automations/new" params={{ projectId }}>
                <Plus /> {t("automations.newPage.newAutomation")}
              </Link>
            </Button>
          </>
        }
      />
      <div
        className="flex h-10 shrink-0 items-end gap-4 overflow-x-auto border-b border-border px-4 sm:px-6"
        role="tablist"
      >
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => go(id)}
            className={cn(
              "-mb-px border-b-2 border-transparent pb-2 text-[13px] text-muted-foreground hover:text-foreground",
              tab === id && "border-primary text-foreground",
            )}
          >
            {t(`automations.listPage.${id}`)}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          {tab === "templates" ? (
            <TemplatesGallery projectId={projectId} />
          ) : tab === "runs" ? (
            <RunsTable projectId={projectId} />
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <AutomationsPanel projectId={projectId} />
              <aside>
                <SectionLabel className="mb-2">{t("automations.listPage.next")}</SectionLabel>
                <NextRuns projectId={projectId} />
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
