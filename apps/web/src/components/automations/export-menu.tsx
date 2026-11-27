import { useMutation } from "@tanstack/react-query";
import { ChevronDown, ClipboardCopy, Download, FileArchive, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClient } from "@/lib/api";
import { notifyCopyFailed } from "@/lib/copy";
import { saveBlob, saveMarkdown } from "@/lib/download";
import { useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";

/** Bytes of a base64 string. */
export function base64Bytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Share one automation (§10): download it as `<slug>.md` or copy the Markdown. The file also
 * works dropped into `.codeden/automations/`.
 */
export function ExportMenu({ automationId }: { automationId: string }) {
  const { t } = useTranslation();
  const client = useClient();
  const exp = useMutation({
    mutationFn: async (how: "download" | "copy") => {
      const file = await client.automations.exportOne(automationId);
      if (how === "download") {
        saveMarkdown(file.fileName, file.markdown);
      } else {
        // Fetched first, so the gesture may have expired; a failed copy says so itself.
        const copied = await platform.writeClipboard(file.markdown);
        if (!copied) notifyCopyFailed();
        return { how, file, copied };
      }
      return { how, file, copied: false };
    },
    onSuccess: ({ how, file, copied }) => {
      if (how === "download")
        toast.success(t("automations.export.downloaded", { file: file.fileName }));
      else if (copied) toast.success(t("automations.export.copied"));
    },
    onError: (e) => toast.error(t("automations.export.failed"), { description: e.message }),
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <Share2 /> {t("automations.export.export")} <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" data-testid="export-menu">
        <DropdownMenuItem onSelect={() => exp.mutate("download")}>
          <Download /> {t("automations.export.downloadMd")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exp.mutate("copy")}>
          <ClipboardCopy /> {t("automations.export.copyMd")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Export every automation of a project as a zip of `.md` files. */
export function ExportAllButton({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const client = useClient();
  const exp = useMutation({
    mutationFn: () => client.automations.exportAll(projectId),
    onSuccess: (res) => {
      if (res.count === 0) {
        toast.info(t("automations.export.nothing"));
        return;
      }
      saveBlob(res.fileName, new Blob([base64Bytes(res.zipBase64)], { type: "application/zip" }));
      toast.success(t("automations.export.exported", { count: res.count }));
    },
    onError: (e) => toast.error(t("automations.export.failed"), { description: e.message }),
  });
  return (
    <Button size="sm" variant="ghost" onClick={() => exp.mutate()} disabled={exp.isPending}>
      <FileArchive /> {t("automations.export.exportAll")}
    </Button>
  );
}
