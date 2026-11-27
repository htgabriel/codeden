import { Eye, EyeOff } from "lucide-react";
import { isHidden } from "@/components/composer/model-picker/hidden";
import { useHiddenModels } from "@/components/composer/model-picker/use-model-settings";
import { useTranslation } from "@/lib/i18n";
import { useSnapshotData } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { SettingRow, SettingsSection } from "./settings-ui";

/**
 * Which models the picker lists, per provider (`settings.models.hidden`). Each chip toggles one
 * model; the picker can also hide models from a row and reveal hidden ones per provider.
 */
export function ModelVisibilitySettings() {
  const { t } = useTranslation();
  const providers = useSnapshotData((s) => s.runner.providers, []);
  const { hidden, toggle } = useHiddenModels();
  if (providers.length === 0) return null;
  return (
    <SettingsSection
      title={t("prefs.modelVisibility.title")}
      description={t("prefs.modelVisibility.description")}
    >
      {providers.map((p) => {
        const hiddenCount = p.models.filter((m) => isHidden(hidden, p.id, m.id)).length;
        return (
          <SettingRow
            key={p.id}
            label={p.displayName}
            help={t("prefs.modelVisibility.shown", {
              shown: p.models.length - hiddenCount,
              total: p.models.length,
            })}
            stacked
          >
            <div className="flex flex-wrap gap-1.5" data-testid={`model-visibility-${p.id}`}>
              {p.models.map((m) => {
                const shown = !isHidden(hidden, p.id, m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={shown}
                    aria-label={t("prefs.modelVisibility.showLabel", { model: m.label })}
                    title={m.description}
                    onClick={() => toggle(p.id, m.id)}
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs transition-colors",
                      shown
                        ? "border-border bg-background text-foreground hover:bg-accent"
                        : "border-dashed border-border text-muted-foreground line-through hover:bg-accent",
                    )}
                  >
                    {shown ? (
                      <Eye className="size-3" aria-hidden />
                    ) : (
                      <EyeOff className="size-3" aria-hidden />
                    )}
                    {m.label}
                  </button>
                );
              })}
            </div>
          </SettingRow>
        );
      })}
    </SettingsSection>
  );
}
