import {
  AUTOMATION_IMPORT_LIMITS,
  type AutomationImportPreviewItem,
  type AutomationImportSource,
} from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileUp, FolderGit2, Globe, Import, Link2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { AUTONOMY } from "@/components/thread/autonomy";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useClient } from "@/lib/api";
import { automationKeys } from "@/lib/automations";
import { i18n, Trans, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Segmented } from "./form-bits";
import { describeTrigger } from "./meta";

/** Read picked files into an import source: `.zip` as base64, anything else as text. */
export async function readImportFiles(files: File[]): Promise<AutomationImportSource> {
  const t = i18n.t;
  const zip = files.find((f) => /\.zip$/i.test(f.name));
  const texts = files.filter((f) => !/\.zip$/i.test(f.name));
  if (files.filter((f) => /\.zip$/i.test(f.name)).length > 1) {
    throw new Error(t("automations.import.oneZip"));
  }
  if (texts.length > AUTOMATION_IMPORT_LIMITS.maxFiles) {
    throw new Error(t("automations.import.maxFiles", { n: AUTOMATION_IMPORT_LIMITS.maxFiles }));
  }
  for (const f of texts) {
    if (f.size > AUTOMATION_IMPORT_LIMITS.maxFileChars)
      throw new Error(t("automations.import.tooLarge", { name: f.name }));
  }
  if (zip && zip.size > AUTOMATION_IMPORT_LIMITS.maxZipBytes) {
    throw new Error(
      t("automations.import.zipTooLarge", {
        name: zip.name,
        kb: AUTOMATION_IMPORT_LIMITS.maxZipBytes / 1024,
      }),
    );
  }
  const source: AutomationImportSource = {};
  if (texts.length) {
    source.files = await Promise.all(
      texts.map(async (f) => ({ name: f.name, content: await f.text() })),
    );
  }
  if (zip) {
    const bytes = new Uint8Array(await zip.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    source.zipBase64 = btoa(bin);
  }
  return source;
}

/** The agent line of a preview: provider and model, or the default agent. */
function agentLine(item: AutomationImportPreviewItem): string {
  const t = i18n.t;
  const a = item.automation?.action;
  if (!a) return "";
  if (a.type === "message_pm") return t("automations.import.messagesPm");
  if (a.type === "triage") return t("automations.import.pmTriage");
  return [
    a.provider ?? t("automations.import.defaultAgent"),
    a.model,
    a.effort && t("automations.import.effort", { effort: a.effort }),
  ]
    .filter(Boolean)
    .join(" · ");
}

function PreviewRow({
  item,
  checked,
  onCheck,
}: {
  item: AutomationImportPreviewItem;
  checked: boolean;
  onCheck: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const a = item.automation;
  const action = a?.action;
  const level = action?.type === "start_session" ? (action.autonomy ?? "auto") : null;
  const text =
    action?.type === "start_session"
      ? action.prompt
      : action?.type === "message_pm"
        ? action.message
        : (action?.instructions ?? "");
  return (
    <label
      className={cn(
        "flex gap-3 border-b border-border px-3 py-2.5 last:border-0",
        a ? "cursor-pointer hover:bg-accent/30" : "bg-status-failed/[0.04]",
      )}
      data-testid="import-preview-row"
    >
      <input
        type="checkbox"
        className="mt-1 size-3.5 accent-[var(--primary)]"
        checked={checked}
        disabled={!a}
        onChange={(e) => onCheck(e.target.checked)}
        aria-label={t("automations.import.importAria", { name: a?.name ?? item.fileName })}
      />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium">{a?.name ?? item.fileName}</span>
          <code className="font-mono text-3xs text-muted-foreground">{item.fileName}</code>
        </span>
        {a ? (
          <>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
              <span>{describeTrigger(a.trigger)}</span>
              <span>{agentLine(item)}</span>
              {level && (
                <span className="flex items-center gap-1">
                  {(() => {
                    const L = AUTONOMY[level];
                    return <L.icon className={cn("size-3", L.tone)} />;
                  })()}
                  {AUTONOMY[level].label}
                </span>
              )}
            </span>
            {text && (
              <span className="line-clamp-3 block font-mono text-3xs leading-relaxed whitespace-pre-wrap text-muted-foreground/90">
                {text.split("\n").slice(0, 3).join("\n")}
              </span>
            )}
            {item.fullPermissions && (
              <span className="flex items-start gap-1.5 text-2xs text-status-waiting">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                {t("automations.import.fullWarning")}
              </span>
            )}
          </>
        ) : (
          <span className="block text-2xs text-status-failed">{item.error}</span>
        )}
      </span>
    </label>
  );
}

/** A typed link as an https URL: `gist.github.com/…` without a scheme gets `https://`. */
function linkUrl(input: string): string {
  const link = input.trim();
  return /^[a-z][a-z0-9+.-]*:/i.test(link) ? link : `https://${link}`;
}

/**
 * Import automations (§10): `.md` files, a `.zip` of them, pasted Markdown, or a link (a
 * `.md` or `.zip` URL, a GitHub file or a gist, downloaded once by the server). The server
 * parses them like automation files and previews each one; nothing runs, and imported
 * automations always start off.
 */
export function ImportDialog({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const id = useId();
  const linkForm = `${id}-link`;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"files" | "paste" | "link">("files");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [source, setSource] = useState<AutomationImportSource | null>(null);
  const [items, setItems] = useState<AutomationImportPreviewItem[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<"project" | "all_projects">("project");
  const reset = () => {
    setSource(null);
    setItems(null);
    setSelected(new Set());
    setText("");
    setLink("");
  };
  /** Show a preview; the import later sends exactly this source back. */
  const show = (src: AutomationImportSource, previewed: AutomationImportPreviewItem[]) => {
    setSource(src);
    setItems(previewed);
    setSelected(new Set(previewed.filter((i) => i.automation).map((i) => i.fileName)));
  };

  const preview = useMutation({
    mutationFn: async (src: AutomationImportSource) => ({
      src,
      res: await client.automations.previewImport(src),
    }),
    onSuccess: ({ src, res }) => show(src, res.items),
    onError: (e) => toast.error(t("automations.import.readFailed"), { description: e.message }),
  });
  const linkPreview = useMutation({
    mutationFn: (url: string) => client.automations.previewLink(url),
    onSuccess: (res) => show(res.source, res.items),
    onError: (e) => toast.error(t("automations.import.linkFailed"), { description: e.message }),
  });
  const commit = useMutation({
    mutationFn: () => {
      if (!source) throw new Error(t("automations.import.nothing"));
      return client.automations.importAutomations({
        source,
        select: [...selected],
        ...(target === "project" ? { projectId } : {}),
      });
    },
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: automationKeys.all });
      const n = res.created.length;
      toast.success(t("automations.import.imported", { count: n }), {
        description: res.failed.length
          ? t("automations.import.notImported", { n: res.failed.length })
          : undefined,
      });
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(t("automations.import.failed"), { description: e.message }),
  });

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      preview.mutate(await readImportFiles([...files]));
    } catch (e) {
      toast.error(t("automations.import.filesFailed"), { description: (e as Error).message });
    }
  };
  const valid = items?.filter((i) => i.automation) ?? [];
  const fullSelected = items?.some((i) => i.fullPermissions && selected.has(i.fileName));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Import /> {t("automations.import.import")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl" data-testid="import-dialog">
        <DialogHeader>
          <DialogTitle>{t("automations.import.title")}</DialogTitle>
          <DialogDescription>
            <Trans i18nKey="automations.import.description" components={{ code: <code /> }} />
          </DialogDescription>
        </DialogHeader>
        {!items ? (
          <div className="space-y-3">
            <Segmented
              label={t("automations.import.importFrom")}
              value={mode}
              onChange={setMode}
              options={[
                { id: "files", label: t("automations.import.files") },
                { id: "paste", label: t("automations.import.paste") },
                { id: "link", label: t("automations.import.link") },
              ]}
            />
            {mode === "link" ? (
              <form
                id={linkForm}
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (link.trim() && !linkPreview.isPending) linkPreview.mutate(linkUrl(link));
                }}
              >
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                  placeholder="https://gist.github.com/…"
                  className="font-mono text-[12px]"
                  aria-label={t("automations.import.linkAria")}
                  data-testid="import-link-input"
                />
                <p className="flex items-start gap-1.5 text-2xs text-muted-foreground">
                  <Link2 className="mt-px size-3.5 shrink-0" />
                  <span>
                    <Trans i18nKey="automations.import.linkHelp" components={{ code: <code /> }} />
                  </span>
                </p>
              </form>
            ) : mode === "files" ? (
              <label
                htmlFor={`${id}-files`}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center hover:border-primary/40"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void pick(e.dataTransfer.files);
                }}
              >
                <FileUp className="size-6 text-muted-foreground" />
                <span className="text-[13px] font-medium">{t("automations.import.drop")}</span>
                <span className="text-2xs text-muted-foreground">
                  {t("automations.import.limits", {
                    files: AUTOMATION_IMPORT_LIMITS.maxFiles,
                    kb: AUTOMATION_IMPORT_LIMITS.maxFileChars / 1024,
                  })}
                </span>
                <input
                  id={`${id}-files`}
                  type="file"
                  multiple
                  accept=".md,.markdown,.zip,text/markdown,application/zip"
                  className="sr-only"
                  data-testid="import-file-input"
                  onChange={(e) => void pick(e.target.files)}
                />
              </label>
            ) : (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder={
                  '---\nname: Release notes draft\ntrigger:\n  type: cron\n  expression: "0 16 * * 5"\n---\nDraft the release notes for {{project.name}}.'
                }
                className="font-mono text-[12px]"
                aria-label={t("automations.import.markdownAria")}
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="max-h-[50vh] overflow-y-auto rounded-xl border border-border scroll-thin"
              data-testid="import-preview"
            >
              {items.map((item) => (
                <PreviewRow
                  key={item.fileName}
                  item={item}
                  checked={selected.has(item.fileName)}
                  onCheck={(v) =>
                    setSelected((s) => {
                      const next = new Set(s);
                      if (v) next.add(item.fileName);
                      else next.delete(item.fileName);
                      return next;
                    })
                  }
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-muted-foreground">{t("automations.import.importInto")}</span>
              <Segmented
                label={t("automations.import.importInto")}
                value={target}
                onChange={setTarget}
                options={[
                  { id: "project", label: t("automations.form.thisProject"), icon: <FolderGit2 /> },
                  { id: "all_projects", label: t("automations.form.allProjects"), icon: <Globe /> },
                ]}
              />
            </div>
            {fullSelected && (
              <p className="flex items-start gap-1.5 rounded-lg border border-status-waiting/30 bg-status-waiting/[0.06] px-3 py-2 text-2xs text-status-waiting">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                {t("automations.import.fullSelected")}
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          {items ? (
            <>
              <Button variant="ghost" onClick={reset}>
                {t("automations.import.back")}
              </Button>
              <Button
                onClick={() => commit.mutate()}
                disabled={selected.size === 0 || commit.isPending}
              >
                {t("automations.import.importCount", {
                  selected: selected.size,
                  total: valid.length,
                })}
              </Button>
            </>
          ) : mode === "paste" ? (
            <Button
              onClick={() => preview.mutate({ text })}
              disabled={!text.trim() || preview.isPending}
            >
              {t("automations.import.preview")}
            </Button>
          ) : (
            mode === "link" && (
              <Button
                type="submit"
                form={linkForm}
                disabled={!link.trim() || linkPreview.isPending}
              >
                {linkPreview.isPending
                  ? t("automations.import.downloading")
                  : t("automations.import.preview")}
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
