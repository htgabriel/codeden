import {
  type AutonomyMode,
  type FactoryLimits,
  isFactoryMode,
  type Project,
} from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckRemoteButton } from "@/components/github/remote-check";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClient } from "@/lib/api";
import { factoryKeys, modeErrorText, useFactoryStatus, useVision } from "@/lib/factory";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { hasBudget, LimitsEditor, type TuningDraft, tuningDraft } from "./limits-editor";
import { MODE_LABEL, MODES } from "./meta";

export function ExperimentalBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "rounded-full border border-primary/30 px-1.5 py-px text-3xs font-normal text-primary",
        className,
      )}
    >
      {t("project.autonomy.experimental")}
    </span>
  );
}

function Requirement({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-xs" data-ok={ok}>
      <span
        className={cn(
          "mt-px flex size-4 shrink-0 items-center justify-center rounded-full",
          ok ? "bg-status-done/15 text-status-done" : "bg-status-failed/12 text-status-failed",
        )}
      >
        {ok ? <Check className="size-3" /> : <X className="size-3" />}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/**
 * Pick a project's autonomy mode (§10.1). The software and dark factory are experimental and need
 * a GitHub project, a vision file and limits with a daily budget; the dialog shows what is
 * missing and edits the limits in place.
 */
export function AutonomyDialog({
  project,
  open,
  onOpenChange,
  initialMode,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AutonomyMode;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const vision = useVision(project.id);
  const [mode, setMode] = useState<AutonomyMode>(initialMode ?? project.autonomyMode);
  const [limits, setLimits] = useState<FactoryLimits>(project.factoryLimits);
  // The loop's merge-check tuning (saved with the limits).
  const status = useFactoryStatus(project.id, open);
  const savedTuning = status.data?.tuning;
  const [tuning, setTuning] = useState<TuningDraft | null>(null);
  useEffect(() => {
    if (!open) return;
    setMode(initialMode ?? project.autonomyMode);
    setLimits(project.factoryLimits);
  }, [open, initialMode, project.autonomyMode, project.factoryLimits]);
  useEffect(() => {
    if (open && savedTuning) setTuning(tuningDraft(savedTuning));
    if (!open) setTuning(null);
  }, [open, savedTuning]);

  const factory = isFactoryMode(mode);
  const github = project.kind === "github";
  const visionOk = vision.data?.exists ?? false;
  const budgetOk = hasBudget(limits);
  const ready = !factory || (github && visionOk && budgetOk);
  const same = mode === project.autonomyMode;

  const save = useMutation({
    mutationFn: () =>
      client.factory.setMode(project.id, {
        mode,
        ...(factory ? { limits, ...(tuning ? { tuning } : {}) } : {}),
      }),
    onSuccess: (res) => {
      toast.success(
        same
          ? t("project.autonomy.saved")
          : t("project.autonomy.switched", {
              name: project.name,
              mode: MODE_LABEL[res.mode].toLowerCase(),
            }),
      );
      void queryClient.invalidateQueries({ queryKey: factoryKeys.all });
      onOpenChange(false);
    },
    onError: (e) =>
      toast.error(t("project.autonomy.saveFailed"), { description: modeErrorText(e) }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("project.autonomy.title")}</DialogTitle>
          <DialogDescription>
            {t("project.autonomy.description", { name: project.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-2" data-testid="autonomy-modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex flex-col gap-1 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40",
                mode === m.id && "border-primary/60 bg-primary/[0.05] ring-1 ring-primary/30",
              )}
            >
              <span className="flex items-center gap-2 text-[13px] font-medium">
                {m.label}
                {m.experimental && <ExperimentalBadge />}
                {project.autonomyMode === m.id && (
                  <span className="ml-auto text-3xs font-normal text-muted-foreground">
                    {t("project.autonomy.current")}
                  </span>
                )}
              </span>
              <span className="text-2xs leading-relaxed text-muted-foreground">{m.summary}</span>
              <span className="mt-1 text-3xs text-muted-foreground/80">
                {t("project.autonomy.findsMerges", { finds: m.finds, merges: m.merges })}
              </span>
            </button>
          ))}
        </div>
        {factory && (
          <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="text-[13px] font-medium">
                {t("project.autonomy.before", { mode: MODE_LABEL[mode].toLowerCase() })}
              </p>
              <ul className="mt-2 space-y-1.5" data-testid="mode-requirements">
                <Requirement ok={github}>
                  {t("project.autonomy.reqGithub")}{" "}
                  <span className="text-muted-foreground">
                    {project.kind === "github"
                      ? `(${project.github.owner}/${project.github.repo})`
                      : t("project.autonomy.reqGithubMissing")}
                  </span>
                  {project.kind !== "github" && (
                    <CheckRemoteButton projectId={project.id} layout="inline" className="mt-1.5" />
                  )}
                </Requirement>
                <Requirement ok={visionOk}>
                  {t("project.autonomy.reqVision")}{" "}
                  <code className="font-mono text-3xs text-muted-foreground">
                    {project.visionPath}
                  </code>{" "}
                  {!visionOk && (
                    <Link
                      to="/projects/$projectId/vision"
                      params={{ projectId: project.id }}
                      className="text-primary hover:underline"
                    >
                      {t("project.autonomy.writeVision")}
                    </Link>
                  )}
                </Requirement>
                <Requirement ok={budgetOk}>
                  {t("project.autonomy.reqBudget")}{" "}
                  <span className="text-muted-foreground">{t("project.autonomy.setBelow")}</span>
                </Requirement>
              </ul>
              <p className="mt-3 text-3xs leading-relaxed text-muted-foreground">
                {t("project.autonomy.pipelinesHelp")}
              </p>
            </div>
            <LimitsEditor
              limits={limits}
              onChange={setLimits}
              tuning={tuning ?? undefined}
              onTuningChange={setTuning}
              githubLogin={status.data?.githubLogin ?? null}
              dark={mode === "dark_factory"}
            />
          </div>
        )}
        {!factory && isFactoryMode(project.autonomyMode) && (
          <p className="text-2xs text-muted-foreground">
            {t("project.autonomy.leaving", {
              mode: MODE_LABEL[project.autonomyMode].toLowerCase(),
            })}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!ready || save.isPending || (same && !factory)}
            onClick={() => save.mutate()}
          >
            {same
              ? t("project.autonomy.saveSettings")
              : t("project.autonomy.switchTo", { mode: MODE_LABEL[mode] })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The project's mode as a button that opens the autonomy dialog. */
export function AutonomyModeButton({ project }: { project: Project }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full border border-border px-1.5 py-px hover:border-primary/40 hover:text-foreground pointer-coarse:min-h-10 pointer-coarse:px-3"
        aria-label={t("project.autonomy.buttonAria", { mode: MODE_LABEL[project.autonomyMode] })}
        data-testid="autonomy-mode-button"
      >
        {MODE_LABEL[project.autonomyMode]}
        {isFactoryMode(project.autonomyMode) && (
          <span className="text-primary">{t("project.autonomy.expShort")}</span>
        )}
        <ChevronDown className="size-3 opacity-60" />
      </button>
      <AutonomyDialog project={project} open={open} onOpenChange={setOpen} />
    </>
  );
}
