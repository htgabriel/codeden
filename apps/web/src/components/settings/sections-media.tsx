import type { InboxNotify } from "@codeden/contracts";
import { BellRing, Volume2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { chime } from "@/lib/attention/chime";
import { useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";
import { SettingRow, SettingsSection, useSettings } from "./settings-ui";

/** The inbox categories (`InboxItem.notify`); `prefs.notifications.categories` says what each covers. */
const CATEGORIES: InboxNotify[] = ["needs_you", "failure", "factory", "automation"];

export function NotificationSettings() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const [permission, setPermission] = useState(platform.notificationPermission());
  const categories = settings.notifications.categories;
  return (
    <SettingsSection
      title={t("settings.sections.notifications")}
      description={t("prefs.notifications.description")}
    >
      <SettingRow
        label={t("prefs.notifications.toasts")}
        help={t("prefs.notifications.toastsHelp")}
      >
        <Switch
          checked={settings.notifications.toasts}
          onCheckedChange={(toasts) => update({ notifications: { toasts } })}
        />
      </SettingRow>
      <SettingRow
        label={t("prefs.notifications.notifyAbout")}
        help={t("prefs.notifications.notifyAboutHelp")}
        stacked
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {CATEGORIES.map((id) => (
            <div
              key={id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium">
                  {t(`prefs.notifications.categories.${id}.label`)}
                </div>
                <div className="mt-0.5 text-2xs leading-relaxed text-muted-foreground">
                  {t(`prefs.notifications.categories.${id}.help`)}
                </div>
              </div>
              <Switch
                aria-label={t(`prefs.notifications.categories.${id}.label`)}
                checked={categories[id]}
                onCheckedChange={(on) =>
                  update({ notifications: { categories: { ...categories, [id]: on } } })
                }
              />
            </div>
          ))}
        </div>
      </SettingRow>
      <SettingRow label={t("prefs.notifications.sound")} help={t("prefs.notifications.soundHelp")}>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              chime.unlock();
              chime.play();
            }}
          >
            <Volume2 /> {t("prefs.notifications.test")}
          </Button>
          <Switch
            aria-label={t("prefs.notifications.sound")}
            checked={settings.notifications.sound}
            onCheckedChange={(sound) => update({ notifications: { sound } })}
          />
        </div>
      </SettingRow>
      <SettingRow
        label={
          platform.capabilities.osIntegration
            ? t("prefs.notifications.system")
            : t("prefs.notifications.browser")
        }
        help={
          permission === "denied"
            ? t("prefs.notifications.blocked")
            : platform.capabilities.osIntegration
              ? t("prefs.notifications.windowUnfocused")
              : t("prefs.notifications.tabUnfocused")
        }
      >
        <div className="flex items-center gap-2">
          {permission !== "granted" && permission !== "unsupported" && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => setPermission(await platform.requestNotificationPermission())}
            >
              <BellRing /> {t("prefs.notifications.allow")}
            </Button>
          )}
          <Switch
            checked={settings.notifications.browser}
            disabled={permission === "unsupported"}
            onCheckedChange={(browser) => update({ notifications: { browser } })}
          />
        </div>
      </SettingRow>
      <SettingRow label={t("prefs.notifications.sendTest")}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const title = t("prefs.notifications.sampleTitle");
            const body = t("prefs.notifications.sampleBody");
            toast(title, { description: body });
            platform.notify(title, { body });
          }}
        >
          {t("prefs.notifications.test")}
        </Button>
      </SettingRow>
    </SettingsSection>
  );
}
