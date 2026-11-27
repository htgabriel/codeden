import type { ImageEngineSetting, ImageTestResponse } from "@codeden/contracts";
import { FlaskConical } from "lucide-react";
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

const ENGINE_OPTIONS: ImageEngineSetting[] = ["auto", "codex", "gemini", "openai", "none"];

export function EngineSelect({
  value,
  onChange,
  inherit,
  label,
}: {
  value: ImageEngineSetting | "inherit";
  onChange: (v: ImageEngineSetting | "inherit") => void;
  inherit?: boolean;
  label: string;
}) {
  const { t } = useTranslation();
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ImageEngineSetting | "inherit")}>
      <SelectTrigger size="sm" className="w-48" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {inherit && <SelectItem value="inherit">{t("prefs.images.engine.inherit")}</SelectItem>}
        {ENGINE_OPTIONS.map((o) => (
          <SelectItem key={o} value={o}>
            {t(`prefs.images.engine.${o}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TestResult({
  result,
  pending,
  onTest,
}: {
  result: ImageTestResponse | null;
  pending: boolean;
  onTest: () => void;
}) {
  const { t } = useTranslation();
  const client = useClient();
  return (
    <div className="space-y-3" data-testid="image-test">
      <Button size="sm" variant="outline" onClick={onTest} disabled={pending}>
        <FlaskConical /> {pending ? t("prefs.images.generating") : t("prefs.images.test")}
      </Button>
      {result && !result.ok && (
        <p className="text-2xs text-status-failed">
          {result.error?.message ?? t("prefs.images.testFailed")}
        </p>
      )}
      {result?.ok && (
        <div className="flex items-start gap-3">
          {result.artifact && (
            <img
              src={client.artifactUrl(result.artifact.id)}
              alt={t("prefs.images.generatedAlt")}
              className="size-40 rounded-lg border border-border object-cover"
            />
          )}
          <div className="text-2xs text-muted-foreground">
            <div className="font-medium text-foreground">
              {t("prefs.images.generatedWith", { engine: result.engine ?? "" })}
            </div>
            {result.model && <div className="font-mono">{result.model}</div>}
            <div>{(result.durationMs / 1000).toFixed(1)}s</div>
          </div>
        </div>
      )}
    </div>
  );
}
