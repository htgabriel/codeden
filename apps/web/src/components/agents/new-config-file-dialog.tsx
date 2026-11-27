import type { AgentConfigFileContent, AgentConfigProvider } from "@codeden/contracts";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Segmented } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import {
  CONFIG_NAME,
  type NewConfigKind,
  newConfigLocation,
  newConfigTemplate,
} from "./config-templates";

/** Create a skill or subagent in the provider's own folder, from a small template. */
export function NewConfigFileDialog({
  kind,
  projectId,
  open,
  onOpenChange,
  onCreated,
}: {
  kind: NewConfigKind;
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (file: AgentConfigFileContent) => void;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const [provider, setProvider] = useState<AgentConfigProvider>("claude");
  const [scope, setScope] = useState<"user" | "project">(projectId ? "project" : "user");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const valid = CONFIG_NAME.test(name) && (scope === "user" || projectId !== null);
  const location = newConfigLocation(kind, provider, scope, name || "<name>", projectId);
  const skill = kind === "skill";

  const create = useMutation({
    mutationFn: () =>
      client.agentConfig.write(
        {
          ...newConfigLocation(kind, provider, scope, name, projectId),
          content: newConfigTemplate(kind, provider, name, description),
        },
        { create: true },
      ),
    onSuccess: (res) => {
      toast.success(t("shell.newConfig.created", { name }), { description: res.file.absolutePath });
      onCreated(res.file);
      onOpenChange(false);
      setName("");
      setDescription("");
    },
    onError: (e) =>
      toast.error(skill ? t("shell.newConfig.failedSkill") : t("shell.newConfig.failedSubagent"), {
        description: e.message,
      }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {skill ? t("shell.configFiles.newSkill") : t("shell.configFiles.newSubagent")}
          </DialogTitle>
          <DialogDescription>{t("shell.newConfig.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={provider}
              onChange={setProvider}
              options={[
                { value: "claude", label: "Claude Code" },
                { value: "codex", label: "Codex" },
              ]}
            />
            <Segmented
              value={scope}
              onChange={setScope}
              options={[
                { value: "user", label: t("shell.newConfig.everywhere") },
                ...(projectId
                  ? [{ value: "project" as const, label: t("shell.newConfig.thisProject") }]
                  : []),
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-config-name">{t("shell.mcpDialog.name")}</Label>
            <Input
              id="new-config-name"
              value={name}
              onChange={(e) => setName(e.target.value.trim())}
              placeholder={kind === "skill" ? "release-notes" : "code-reviewer"}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-config-desc">{t("shell.newConfig.descriptionLabel")}</Label>
            <Input
              id="new-config-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("shell.newConfig.descriptionPlaceholder")}
            />
          </div>
          <p className="font-mono text-3xs break-all text-muted-foreground">
            {location.root === "home" ? "~/" : "<project>/"}
            {location.path}
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!valid || create.isPending} onClick={() => create.mutate()}>
            {create.isPending
              ? t("shell.newConfig.creating")
              : skill
                ? t("shell.newConfig.createSkill")
                : t("shell.newConfig.createSubagent")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
