import type { AgentConfigDiff, AgentConfigFile, AgentConfigLocator } from "@codeden/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/on-demand";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError, useClient } from "@/lib/api";
import { ageShort } from "@/lib/format";
import { Trans, useTranslation } from "@/lib/i18n";
import { PatchDialog } from "./patch-dialog";

export const locatorOf = (f: AgentConfigLocator): AgentConfigLocator => ({
  root: f.root,
  projectId: f.projectId,
  path: f.path,
});

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Edit one native agent-config file in place (§12.4): CodeMirror, a server-side diff preview
 * before every write, optimistic concurrency on the file's hash, and delete with a backup.
 * Below `md` the toolbar wraps: Back and the path, then the actions.
 */
export function ConfigFileEditor({
  file,
  placeholder,
  onChanged,
  hidden,
  onBack,
}: {
  file: AgentConfigFile;
  placeholder?: string;
  /** Called after a save or delete so lists can refresh. */
  onChanged: () => void;
  /** Kept mounted but not shown (a phone showing the file list), so the draft survives. */
  hidden?: boolean;
  /** Adds a Back button that returns to the file list (phones). */
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const locator = locatorOf(file);
  const key = ["agent-config-file", locator.root, locator.projectId ?? "", locator.path];
  const content = useQuery({ queryKey: key, queryFn: () => client.agentConfig.read(locator) });
  const [draft, setDraft] = useState("");
  const [review, setReview] = useState(false);
  const [diff, setDiff] = useState<AgentConfigDiff | undefined>();
  const [diffError, setDiffError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => setDraft(content.data?.content ?? ""), [content.data]);
  const dirty = content.data !== undefined && draft !== content.data.content;

  const openReview = async () => {
    setDiff(undefined);
    setDiffError(null);
    setReview(true);
    try {
      setDiff(await client.agentConfig.diff({ ...locator, content: draft }));
    } catch (e) {
      setDiffError(errorText(e));
    }
  };

  const save = useMutation({
    mutationFn: () =>
      client.agentConfig.write({
        ...locator,
        content: draft,
        expectedSha256: content.data?.sha256 ?? null,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(key, res.file);
      setReview(false);
      onChanged();
      toast.success(t("shell.configEditor.saved", { name: file.name }), {
        description: res.backupPath
          ? t("shell.configEditor.backup", { path: res.backupPath })
          : t("shell.configEditor.created"),
      });
    },
    onError: (e) => {
      if (e instanceof ApiRequestError && e.code === "file_changed") {
        setReview(false);
        toast.error(t("shell.configEditor.changedOnDisk"), {
          description: t("shell.configEditor.changedOnDiskHint"),
          action: { label: t("shell.configEditor.reload"), onClick: () => void content.refetch() },
        });
      } else toast.error(t("shell.configEditor.notSaved"), { description: errorText(e) });
    },
  });

  const remove = useMutation({
    mutationFn: () => client.agentConfig.remove(locator, { folder: file.kind === "skill" }),
    onSuccess: (res) => {
      void content.refetch();
      onChanged();
      toast.success(t("shell.configEditor.deleted", { name: file.name }), {
        description: res.backupPath
          ? t("shell.configEditor.backup", { path: res.backupPath })
          : undefined,
      });
    },
    onError: (e) => toast.error(t("shell.configEditor.notDeleted"), { description: errorText(e) }),
  });

  const exists = content.data?.exists ?? file.exists;
  return (
    <div hidden={hidden} className="flex min-w-0 flex-1 flex-col" data-testid="config-file-editor">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 max-md:h-auto max-md:flex-wrap max-md:gap-y-1 max-md:px-2 max-md:py-1">
        {onBack && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onBack}
            aria-label={t("shell.configEditor.back")}
            title={t("shell.configEditor.back")}
          >
            <ArrowLeft />
          </Button>
        )}
        {/* Phones show the whole path, wrapped, instead of cutting off the file name. */}
        <code
          className="truncate font-mono text-xs max-md:min-w-0 max-md:flex-1 max-md:break-all max-md:whitespace-normal"
          title={file.absolutePath}
        >
          {file.absolutePath}
        </code>
        {!exists && (
          <span className="shrink-0 rounded bg-muted px-1.5 text-3xs text-muted-foreground">
            {t("shell.configEditor.newFile")}
          </span>
        )}
        {dirty && (
          <span
            className="size-1.5 shrink-0 rounded-full bg-status-waiting"
            title={t("shell.configEditor.unsaved")}
          />
        )}
        {/* Phones: the actions start a second row. */}
        <span aria-hidden className="hidden max-md:block max-md:basis-full" />
        <span className="ml-auto shrink-0 text-3xs text-muted-foreground">
          {file.modifiedAt
            ? t("shell.configEditor.edited", { age: ageShort(file.modifiedAt) })
            : ""}
        </span>
        <Button
          size="xs"
          variant="ghost"
          disabled={!dirty}
          onClick={() => setDraft(content.data?.content ?? "")}
        >
          <RotateCcw /> {t("shell.configEditor.revert")}
        </Button>
        {exists && (
          <Button
            size="xs"
            variant="ghost"
            className="pointer-coarse:min-w-10"
            onClick={() => setConfirmDelete(true)}
            aria-label={t("shell.configEditor.deleteLabel", { name: file.name })}
          >
            <Trash2 />
          </Button>
        )}
        <Button size="xs" disabled={!dirty} onClick={() => void openReview()}>
          <Save /> {t("shell.configEditor.reviewSave")}
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {content.data ? (
          <CodeEditor
            docKey={`${file.absolutePath}-${content.dataUpdatedAt}`}
            path={file.path}
            value={draft}
            onChange={setDraft}
            onSave={() => dirty && void openReview()}
            placeholder={placeholder ?? t("shell.configEditor.placeholder")}
          />
        ) : content.error ? (
          <p className="p-5 text-xs text-status-failed">{errorText(content.error)}</p>
        ) : (
          <div className="space-y-2 p-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${70 - i * 15}%` }} />
            ))}
          </div>
        )}
      </div>
      <PatchDialog
        open={review}
        onOpenChange={setReview}
        title={t("shell.configEditor.reviewTitle", { name: file.name })}
        diff={diff}
        error={diffError}
        onConfirm={() => save.mutate()}
        saving={save.isPending}
      />
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("shell.configEditor.deleteTitle", { name: file.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey={
                  file.kind === "skill"
                    ? "shell.configEditor.deleteSkillBody"
                    : "shell.configEditor.deleteFileBody"
                }
                values={{ path: file.absolutePath }}
                components={{ code: <code className="font-mono text-2xs" /> }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => remove.mutate()}>
              {t("shell.configEditor.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
