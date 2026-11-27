import { BellRing, Check, RotateCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { i18n, useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";

/**
 * How to get notifications back once they are blocked, by what this platform can do: the
 * desktop app's come from the operating system, and a browser's are a per-site permission.
 */
function blockedHelp(osIntegration: boolean): string {
  return osIntegration
    ? i18n.t("prefs.setup.notifications.blockedSystem")
    : i18n.t("prefs.setup.notifications.blockedSite");
}

/**
 * First-run setup (§14): the notifications row. Browsers only show notifications on secure
 * pages, so a phone reaching CodeDen over plain http on the network (§13) can't get them at
 * all; the row says so instead of pointing at a permission the browser won't grant there.
 */
export function NotificationsRow() {
  const { t } = useTranslation();
  const [permission, setPermission] = useState(platform.notificationPermission());
  const insecure = typeof window !== "undefined" && window.isSecureContext === false;
  const unavailable = permission !== "granted" && insecure && !platform.capabilities.osIntegration;
  const checkAgain = () => {
    const next = platform.notificationPermission();
    setPermission(next);
    if (next === "denied") {
      toast(t("prefs.setup.notifications.stillBlocked"), {
        description: t("prefs.setup.notifications.reload"),
      });
    }
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3.5" data-testid="setup-notifications">
      <BellRing className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium">{t("prefs.notifications.browser")}</div>
        <div className="text-2xs text-muted-foreground">
          {unavailable
            ? t("prefs.setup.notifications.insecure")
            : permission === "denied"
              ? blockedHelp(platform.capabilities.osIntegration)
              : t("prefs.setup.notifications.help")}
        </div>
      </div>
      {permission === "granted" ? (
        <span className="flex items-center gap-1 text-2xs text-status-done">
          <Check className="size-3" /> {t("prefs.setup.notifications.allowed")}
        </span>
      ) : unavailable ? (
        <span className="text-2xs text-muted-foreground">{t("prefs.images.unavailable")}</span>
      ) : permission === "denied" ? (
        <Button size="sm" variant="outline" onClick={checkAgain}>
          <RotateCw /> {t("prefs.setup.notifications.checkAgain")}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={permission === "unsupported"}
          onClick={async () => setPermission(await platform.requestNotificationPermission())}
        >
          {t("prefs.notifications.allow")}
        </Button>
      )}
    </div>
  );
}
