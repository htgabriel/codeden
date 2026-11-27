import type { InstallSource, UpdateMode } from "@codeden/contracts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { i18n, useTranslation } from "@/lib/i18n";
import { useUpdates } from "@/lib/updates";
import { SettingRow, useSettings } from "./settings-ui";

/** Help text for where this install gets its updates from (in the UI language). */
export function updateModeHelp(mode: UpdateMode, source: InstallSource | undefined): string {
  return i18n.t(`prefs.updates.mode.${source === "desktop" ? "desktop" : "npm"}.${mode}`);
}

/** Settings > General > Updates (§16, §17): off, notify, or install automatically. */
export function UpdateModeSetting() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const { data } = useUpdates();
  const mode = settings.updates.mode;
  return (
    <SettingRow label={t("prefs.updates.label")} help={updateModeHelp(mode, data?.source)}>
      <Select value={mode} onValueChange={(v) => update({ updates: { mode: v as UpdateMode } })}>
        <SelectTrigger size="sm" className="w-44" data-testid="update-mode">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="off">{t("prefs.updates.modeOff")}</SelectItem>
          <SelectItem value="notify">{t("prefs.updates.modeNotify")}</SelectItem>
          <SelectItem value="auto">{t("prefs.updates.modeAuto")}</SelectItem>
        </SelectContent>
      </Select>
    </SettingRow>
  );
}
