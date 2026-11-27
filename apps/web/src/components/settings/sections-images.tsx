import type { ImageGenerationOverride, ImageTestResponse, SettingsPatch } from "@codeden/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { NumberField } from "@/components/common/number-field";
import { StatusDot } from "@/components/common/status-dot";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { useSnapshotData } from "@/lib/queries";
import { EngineSelect, TestResult } from "./image-controls";
import { SecretField } from "./secret-field";
import { Segmented, SettingRow, SettingsSection, useSettings } from "./settings-ui";

/** Image generation settings (§12.5): engines, the active one, caps, overrides, keys, test. */
export function ImageSettings() {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const { settings, update } = useSettings();
  const ig = settings.imageGeneration;
  const projects = useSnapshotData((s) => s.projects, []);
  const [projectId, setProjectId] = useState<string>("");
  const engines = useQuery({
    queryKey: ["image-engines", projectId, ig],
    queryFn: () => client.images.engines(projectId || null),
  });
  const recheck = () => void queryClient.invalidateQueries({ queryKey: ["image-engines"] });
  const [result, setResult] = useState<ImageTestResponse | null>(null);
  const test = useMutation({
    mutationFn: () => client.images.test({ projectId: projectId || undefined }),
    onMutate: () => setResult(null),
    onSuccess: (r) => {
      setResult(r);
      recheck();
    },
    onError: (e) =>
      setResult({
        ok: false,
        engine: null,
        durationMs: 0,
        error: { code: "error", message: e.message },
      }),
  });
  const override: ImageGenerationOverride | undefined = projectId
    ? ig.projects[projectId]
    : undefined;
  // Settings PATCHes deep-merge, so clearing one field replaces the whole override.
  const setOverride = async (patch: ImageGenerationOverride | null) => {
    const patchOf = (value: ImageGenerationOverride | null) =>
      ({ imageGeneration: { projects: { [projectId]: value } } }) as SettingsPatch;
    const next = patch === null ? {} : { ...override, ...patch };
    for (const k of Object.keys(next) as (keyof ImageGenerationOverride)[]) {
      if (next[k] === undefined) delete next[k];
    }
    const clearing = patch !== null && Object.values(patch).some((v) => v === undefined);
    if (patch === null || clearing || Object.keys(next).length === 0) {
      await client.updateSettings(patchOf(null));
    }
    if (Object.keys(next).length > 0) await client.updateSettings(patchOf(next));
  };
  const active = engines.data?.active;

  return (
    <>
      <SettingsSection
        title={t("settings.sections.images")}
        description={t("prefs.images.description")}
      >
        <div className="grid gap-2 p-4 sm:grid-cols-3" data-testid="image-engines">
          {(engines.data?.engines ?? []).map((e) => (
            <div key={e.id} className="rounded-lg border border-border bg-background/40 p-3">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <StatusDot tone={e.available ? "done" : "idle"} /> {e.label}
                {active?.engine === e.id && (
                  <span className="ml-auto rounded-full bg-primary/12 px-1.5 text-3xs text-primary">
                    {t("prefs.images.active")}
                  </span>
                )}
              </div>
              <div className="mt-1 text-2xs text-muted-foreground">
                {e.reason ??
                  (e.available ? t("prefs.providers.ready") : t("prefs.images.unavailable"))}
              </div>
              <div className="mt-1 font-mono text-3xs text-muted-foreground/80">
                {e.defaultModel}
              </div>
            </div>
          ))}
          {engines.isLoading && (
            <div className="text-xs text-muted-foreground">{t("prefs.images.checking")}</div>
          )}
        </div>
        <SettingRow
          label={t("prefs.images.engineLabel")}
          help={
            active
              ? active.engine
                ? t("prefs.images.agentsUse", {
                    engine:
                      engines.data?.engines.find((e) => e.id === active.engine)?.label ??
                      active.engine,
                  })
                : (active.reason ?? t("prefs.images.noEngine"))
              : t("prefs.images.engineHelp")
          }
        >
          <EngineSelect
            label={t("prefs.images.globalEngine")}
            value={ig.engine}
            onChange={(engine) => engine !== "inherit" && update({ imageGeneration: { engine } })}
          />
        </SettingRow>
        <SettingRow label={t("prefs.images.defaultSize")}>
          <Segmented
            value={ig.defaultSize}
            onChange={(defaultSize) => update({ imageGeneration: { defaultSize } })}
            options={[
              { value: "1024x1024", label: t("prefs.images.square") },
              { value: "1536x1024", label: t("prefs.images.landscape") },
              { value: "1024x1536", label: t("prefs.images.portrait") },
            ]}
          />
        </SettingRow>
        <SettingRow label={t("prefs.images.quality")}>
          <Segmented
            value={ig.quality}
            onChange={(quality) => update({ imageGeneration: { quality } })}
            options={[
              { value: "auto", label: t("settings.appearance.auto") },
              { value: "low", label: t("prefs.images.low") },
              { value: "medium", label: t("prefs.images.medium") },
              { value: "high", label: t("prefs.images.high") },
            ]}
          />
        </SettingRow>
        <SettingRow
          label={t("prefs.images.dailyCap")}
          help={
            engines.data
              ? t("prefs.images.generatedToday", { count: engines.data.usage.total })
              : t("prefs.images.dailyCapHelp")
          }
        >
          <NumberField
            min={0}
            aria-label={t("prefs.images.dailyCapLabel")}
            value={ig.dailyCap}
            onChange={(dailyCap) => update({ imageGeneration: { dailyCap } })}
            wrapperClassName="w-24"
            className="h-8 text-xs"
          />
        </SettingRow>
        <SettingRow label={t("prefs.images.geminiKey")} help={t("prefs.images.geminiKeyHelp")}>
          <SecretField
            secret="gemini.apiKey"
            label={t("prefs.images.geminiKeyShort")}
            onChange={recheck}
          />
        </SettingRow>
        <SettingRow label={t("prefs.images.openaiKey")} help={t("prefs.images.openaiKeyHelp")}>
          <SecretField
            secret="openai.apiKey"
            label={t("prefs.images.openaiKeyShort")}
            onChange={recheck}
          />
        </SettingRow>
        <SettingRow
          label={t("prefs.images.testActive")}
          help={t("prefs.images.testActiveHelp")}
          stacked
        >
          <TestResult result={result} pending={test.isPending} onTest={() => test.mutate()} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title={t("prefs.images.overrideTitle")}
        description={t("prefs.images.overrideDescription")}
      >
        <SettingRow label={t("prefs.images.project")}>
          <Select
            value={projectId || "none"}
            onValueChange={(v) => setProjectId(v === "none" ? "" : v)}
          >
            <SelectTrigger
              size="sm"
              className="w-48"
              aria-label={t("prefs.images.overrideProject")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("prefs.images.chooseProject")}</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        {projectId && (
          <>
            <SettingRow label={t("prefs.images.projectEngine")}>
              <EngineSelect
                label={t("prefs.images.projectEngineLabel")}
                inherit
                value={override?.engine ?? "inherit"}
                onChange={(v) => void setOverride({ engine: v === "inherit" ? undefined : v })}
              />
            </SettingRow>
            <SettingRow
              label={t("prefs.images.projectCap")}
              help={
                engines.data
                  ? t("prefs.images.effectiveCap", {
                      cap: engines.data.dailyCap,
                      today: engines.data.usage.byProject[projectId] ?? 0,
                    })
                  : undefined
              }
            >
              <NumberField
                optional
                min={0}
                aria-label={t("prefs.images.projectCap")}
                placeholder={t("prefs.images.globalPlaceholder")}
                value={override?.dailyCap}
                onChange={(dailyCap) => void setOverride({ dailyCap: dailyCap ?? undefined })}
                wrapperClassName="w-24"
                className="h-8 text-xs"
              />
            </SettingRow>
            <SettingRow label={t("prefs.images.removeOverride")}>
              <Button
                size="sm"
                variant="outline"
                disabled={!override}
                onClick={() => void setOverride(null)}
              >
                {t("prefs.images.useGlobal")}
              </Button>
            </SettingRow>
          </>
        )}
      </SettingsSection>
    </>
  );
}
