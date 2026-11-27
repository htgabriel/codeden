import { type ParsedVision, parseVision } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, FileWarning, ShieldAlert, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionLabel } from "@/components/common/bits";
import { SaveDiffDialog } from "@/components/editor/save-diff-dialog";
import { CodeEditor } from "@/components/on-demand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClient } from "@/lib/api";
import { factoryKeys, useVision } from "@/lib/factory";
import { useTranslation } from "@/lib/i18n";
import { useProject } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { PageHeader } from "./page-header";

/** The sections the server reads; each is labelled from `factoryView.vision.section`. */
const SECTIONS: (keyof Omit<ParsedVision, "protectedAreas">)[] = [
  "goals",
  "users",
  "principles",
  "outOfScope",
  "qualityBar",
];

/** What the server will read from the draft: sections and the protected areas. */
function VisionPreview({ parsed, extraPaths }: { parsed: ParsedVision; extraPaths: string[] }) {
  const { t } = useTranslation();
  const { globs, topics } = parsed.protectedAreas;
  return (
    <div className="space-y-5" data-testid="vision-preview">
      <div>
        <SectionLabel className="mb-2">{t("factoryView.vision.sections")}</SectionLabel>
        <div className="space-y-1 text-[13px]">
          {SECTIONS.map((key) => {
            const n = parsed[key].length;
            return (
              <div key={key} className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    n ? "bg-status-done" : "bg-status-waiting",
                  )}
                />
                <span className={n ? "" : "text-muted-foreground"}>
                  {t(`factoryView.vision.section.${key}`)}
                </span>
                <span className="ml-auto text-3xs text-muted-foreground tabular-nums">
                  {n || t("factoryView.vision.empty")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <SectionLabel className="mb-2 flex items-center gap-1.5">
          <ShieldAlert className="size-3.5" /> {t("factoryView.vision.protectedAreas")}
        </SectionLabel>
        <p className="mb-2 text-2xs text-muted-foreground">
          {t("factoryView.vision.protectedHelp")}
        </p>
        <div className="flex flex-wrap gap-1" data-testid="protected-globs">
          {globs.map((g) => (
            <code key={g} className="rounded bg-muted px-1.5 py-0.5 font-mono text-3xs">
              {g}
            </code>
          ))}
          {globs.length === 0 && (
            <span className="text-2xs text-status-waiting">{t("factoryView.vision.noPaths")}</span>
          )}
        </div>
        {topics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1" data-testid="protected-topics">
            {topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-status-waiting/30 bg-status-waiting/8 px-2 py-0.5 text-3xs text-status-waiting"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
        {topics.length > 0 && (
          <p className="mt-1.5 text-3xs text-muted-foreground">
            {t("factoryView.vision.topicsHelp")}
          </p>
        )}
        {extraPaths.length > 0 && (
          <p className="mt-2 text-3xs text-muted-foreground">
            {t("factoryView.vision.plusLimits")}{" "}
            <span className="font-mono">{extraPaths.join(", ")}</span>
          </p>
        )}
      </div>
    </div>
  );
}

/** Vision editor (§10.1): required for the software and dark factory; agents work to it. */
export function VisionPage({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const project = useProject(projectId);
  const { data } = useVision(projectId);
  const [draft, setDraft] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  // CodeMirror keeps LF line endings; compare and edit the file in that form.
  const saved = data?.contents.replace(/\r\n/g, "\n");
  useEffect(() => setDraft(saved ?? null), [saved]);
  const parsed = useMemo(() => parseVision(draft ?? ""), [draft]);
  const save = useMutation({
    mutationFn: () => client.factory.saveVision(projectId, draft ?? ""),
    onSuccess: (res) => {
      setReview(false);
      queryClient.setQueryData(factoryKeys.vision(projectId), res);
      void queryClient.invalidateQueries({ queryKey: ["factory", "status", projectId] });
      toast.success(t("factoryView.vision.saved"), { description: res.path });
    },
    onError: (e) => toast.error(t("factoryView.vision.saveFailed"), { description: e.message }),
  });
  const exists = data?.exists ?? false;
  const dirty = draft !== null && (draft !== saved || !exists);

  return (
    <>
      <PageHeader
        icon={<Target />}
        title={t("factoryView.vision.title", {
          name: project?.name ?? t("factoryView.vision.project"),
        })}
        meta={<code className="font-mono">{data?.path ?? project?.visionPath}</code>}
        actions={
          <>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/projects/$projectId" params={{ projectId }}>
                <ChevronLeft /> {t("factoryView.vision.project")}
              </Link>
            </Button>
            <Button size="sm" disabled={!dirty} onClick={() => setReview(true)}>
              {exists ? t("factoryView.vision.reviewSave") : t("factoryView.vision.create")}
            </Button>
          </>
        }
      />
      {data && !exists && (
        <div className="flex items-center gap-2 border-b border-status-waiting/25 bg-status-waiting/[0.06] px-5 py-2 text-2xs">
          <FileWarning className="size-3.5 text-status-waiting" />
          {t("factoryView.vision.noFile", { path: data.path })}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 border-r border-border" data-testid="vision-editor">
          {draft === null ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-40" />
            </div>
          ) : (
            <CodeEditor
              docKey={`vision-${projectId}-${exists}`}
              value={draft}
              onChange={setDraft}
              onSave={() => dirty && setReview(true)}
            />
          )}
        </div>
        <aside className="hidden w-80 shrink-0 overflow-y-auto p-5 scroll-thin lg:block">
          <p className="mb-5 text-[13px] text-muted-foreground">{t("factoryView.vision.intro")}</p>
          <VisionPreview parsed={parsed} extraPaths={project?.factoryLimits.protectedPaths ?? []} />
        </aside>
      </div>
      <SaveDiffDialog
        open={review}
        onOpenChange={setReview}
        path={data?.path ?? "VISION.md"}
        before={exists ? (data?.contents ?? "") : ""}
        after={draft ?? ""}
        onConfirm={() => save.mutate()}
        saving={save.isPending}
      />
    </>
  );
}
