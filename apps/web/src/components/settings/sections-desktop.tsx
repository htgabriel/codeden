import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";
import { SettingRow, SettingsSection, useSettings } from "./settings-ui";

/**
 * Settings > App (§17): OS integration offered by the desktop app. Shown only when the
 * platform has it (`capabilities.osIntegration`); the desktop app applies changes live.
 */
export function DesktopSettings() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const { data: loginSupported = false } = useQuery({
    queryKey: ["platform", "launch-at-login"],
    queryFn: () => platform.launchAtLoginSupported(),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const desktop = settings.desktop;
  return (
    <SettingsSection
      title={t("settings.sections.desktop")}
      description={t("prefs.desktop.description")}
    >
      <SettingRow
        label={t("prefs.desktop.openAtLogin")}
        help={loginSupported ? t("prefs.desktop.openAtLoginHelp") : t("prefs.desktop.notAvailable")}
      >
        <Switch
          data-testid="launch-at-login"
          checked={desktop.launchAtLogin}
          disabled={!loginSupported}
          onCheckedChange={(launchAtLogin) => update({ desktop: { launchAtLogin } })}
        />
      </SettingRow>
      <SettingRow label={t("prefs.desktop.tray")} help={t("prefs.desktop.trayHelp")}>
        <Switch
          checked={desktop.closeToTray}
          onCheckedChange={(closeToTray) => update({ desktop: { closeToTray } })}
        />
      </SettingRow>
      <SettingRow label={t("prefs.desktop.keepAwake")} help={t("prefs.desktop.keepAwakeHelp")}>
        <Switch
          checked={desktop.keepAwake}
          onCheckedChange={(keepAwake) => update({ desktop: { keepAwake } })}
        />
      </SettingRow>
      {platform.capabilities.nativeBrowser && (
        <SettingRow
          label={t("prefs.desktop.nativeBrowser")}
          help={t("prefs.desktop.nativeBrowserHelp")}
        >
          <Switch
            data-testid="native-browser"
            checked={desktop.nativeBrowser}
            onCheckedChange={(nativeBrowser) => update({ desktop: { nativeBrowser } })}
          />
        </SettingRow>
      )}
    </SettingsSection>
  );
}
