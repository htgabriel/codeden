import type { NetworkAddress, NetworkStatus, RemoteDevice } from "@codeden/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, LogOut, Monitor, Smartphone, Wifi } from "lucide-react";
import { toast } from "sonner";
import { QrCode } from "@/components/common/qr-code";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useClient } from "@/lib/api";
import { copyWithFeedback } from "@/lib/copy";
import { ago } from "@/lib/format";
import { i18n, Trans, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { NETWORK_KEY, NetworkPassword } from "./network-password";
import { SettingRow, SettingsSection } from "./settings-ui";

/** "iPhone · Safari" from a user agent; good enough to tell your devices apart. */
export function deviceName(userAgent: string): string {
  const t = i18n.t;
  const ua = userAgent.toLowerCase();
  const device = ua.includes("iphone")
    ? "iPhone"
    : ua.includes("ipad")
      ? "iPad"
      : ua.includes("android")
        ? ua.includes("mobile")
          ? t("prefs.network.androidPhone")
          : t("prefs.network.androidTablet")
        : ua.includes("mac os")
          ? "Mac"
          : ua.includes("windows")
            ? "Windows"
            : ua.includes("linux")
              ? "Linux"
              : t("prefs.network.device");
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("firefox") || ua.includes("fxios")
      ? "Firefox"
      : ua.includes("chrome") || ua.includes("crios")
        ? "Chrome"
        : ua.includes("safari")
          ? "Safari"
          : null;
  return browser ? `${device} · ${browser}` : device;
}

function AddressCard({ address, live }: { address: NetworkAddress; live: boolean }) {
  const { t } = useTranslation();
  const scannable = address.kind !== "local";
  return (
    <div
      className={cn("flex items-center gap-4 px-4 py-3.5", !live && "opacity-60")}
      data-testid="network-address"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-medium">{address.label}</span>
          {address.kind !== "local" && (
            <span className="rounded border border-border px-1.5 py-px text-3xs text-muted-foreground">
              {t(`prefs.network.kind.${address.kind}`)}
            </span>
          )}
        </div>
        <button
          type="button"
          className="mt-1 flex max-w-full items-center gap-1.5 font-mono text-[12.5px] text-muted-foreground hover:text-foreground pointer-coarse:min-h-10"
          onClick={() => void copyWithFeedback(address.url, t("prefs.network.addressCopied"))}
          title={t("prefs.network.copyAddress")}
        >
          <span className="truncate">{address.url}</span>
          <Copy className="size-3 shrink-0" />
        </button>
        {address.kind === "local" && (
          <p className="mt-1 text-2xs text-muted-foreground">{t("prefs.network.localOnly")}</p>
        )}
      </div>
      {scannable && (
        <QrCode
          value={address.url}
          label={t("prefs.network.qrLabel", { url: address.url })}
          className="size-28 shrink-0 p-1 sm:size-32"
        />
      )}
    </div>
  );
}

function DeviceRow({
  device,
  onSignOut,
  pending,
}: {
  device: RemoteDevice;
  onSignOut: () => void;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const mobile = /iphone|ipad|android/i.test(device.label);
  const Icon = mobile ? Smartphone : Monitor;
  return (
    <div className="flex items-center gap-3 px-4 py-3" data-testid="network-device">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium" title={device.label}>
          {deviceName(device.label)}
          {device.current && (
            <span className="ml-2 text-2xs text-primary">{t("prefs.network.thisDevice")}</span>
          )}
        </div>
        <div className="truncate text-2xs text-muted-foreground">
          {device.address ?? t("prefs.network.unknownAddress")}
          {device.addressViaProxy && device.address ? t("prefs.network.viaProxy") : ""}
          {t("prefs.network.seen", {
            seen: ago(device.lastSeenAt),
            signedIn: ago(device.createdAt),
          })}
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={onSignOut} disabled={pending}>
        <LogOut /> {t("prefs.network.signOut")}
      </Button>
    </div>
  );
}

/**
 * Settings › Network access (§15.1): open CodeDen from a phone or tablet on the same network
 * or over your own VPN. Changing it is for this computer only; remote devices see it read-only.
 */
export function NetworkSettings() {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const { data: status, error } = useQuery({
    queryKey: NETWORK_KEY,
    queryFn: () => client.network.status(),
    refetchInterval: 15_000,
  });
  const apply = (next: NetworkStatus) => queryClient.setQueryData(NETWORK_KEY, next);
  const toggle = useMutation({
    mutationFn: (enabled: boolean) => client.network.setEnabled(enabled),
    onSuccess: (next) => {
      apply(next);
      toast.success(next.enabled ? t("prefs.network.onToast") : t("prefs.network.offToast"));
    },
    onError: (e) => toast.error(t("prefs.network.notChanged"), { description: e.message }),
  });
  const loopback = useMutation({
    mutationFn: (loopbackOnly: boolean) => client.network.setLoopbackOnly(loopbackOnly),
    onSuccess: apply,
    onError: (e) => toast.error(t("prefs.network.notChanged"), { description: e.message }),
  });
  const signOut = useMutation({
    mutationFn: (id: string | null) =>
      id ? client.network.signOutDevice(id) : client.network.signOutAll(),
    onSuccess: apply,
    onError: (e) => toast.error(t("prefs.network.notSignedOut"), { description: e.message }),
  });

  if (error) {
    return (
      <SettingsSection title={t("settings.sections.network")}>
        <p className="p-4 text-[13px] text-muted-foreground">{t("prefs.network.unsupported")}</p>
      </SettingsSection>
    );
  }
  if (!status) return null;
  const remote = status.remote;
  const addresses = status.enabled ? status.addresses : status.candidates;

  return (
    <div data-testid="network-settings">
      <SettingsSection
        title={t("settings.sections.network")}
        description={t("prefs.network.description")}
      >
        <SettingRow
          label={t("prefs.network.allow")}
          help={
            remote
              ? t("prefs.network.changeOnHost")
              : status.enabled
                ? t("prefs.network.allowOn")
                : status.passwordSet
                  ? t("prefs.network.allowOff")
                  : t("prefs.network.setPasswordFirst")
          }
        >
          <Switch
            aria-label={t("prefs.network.allow")}
            data-testid="network-toggle"
            checked={status.enabled}
            disabled={remote || !status.passwordSet || toggle.isPending || loopback.isPending}
            onCheckedChange={(enabled) => toggle.mutate(enabled)}
          />
        </SettingRow>
        <SettingRow
          label={t("prefs.network.loopback")}
          help={remote ? t("prefs.network.changeOnHost") : t("prefs.network.loopbackHelp")}
        >
          <Switch
            aria-label={t("prefs.network.loopback")}
            data-testid="network-loopback-only"
            checked={status.loopbackOnly}
            disabled={remote || loopback.isPending || toggle.isPending}
            onCheckedChange={(on) => loopback.mutate(on)}
          />
        </SettingRow>
        {!remote && (
          <SettingRow
            label={t("prefs.network.password.title")}
            stacked
            help={
              status.passwordSetAt
                ? t("prefs.network.password.setAgo", { ago: ago(status.passwordSetAt) })
                : t("prefs.network.password.help")
            }
          >
            <NetworkPassword passwordSet={status.passwordSet} />
          </SettingRow>
        )}
      </SettingsSection>

      <SettingsSection
        title={t("prefs.network.addresses")}
        description={
          status.enabled ? t("prefs.network.addressesOn") : t("prefs.network.addressesOff")
        }
      >
        {addresses.map((a) => (
          <AddressCard key={a.url} address={a} live={status.enabled || a.kind === "local"} />
        ))}
        {status.candidates.length === 1 && (
          <p className="flex items-center gap-2 px-4 py-3 text-2xs text-muted-foreground">
            <Wifi className="size-3.5" /> {t("prefs.network.offline")}
          </p>
        )}
        <p className="px-4 py-3 text-2xs leading-relaxed text-muted-foreground">
          {t("prefs.network.vpnTip")}
        </p>
      </SettingsSection>

      <SettingsSection
        title={t("prefs.network.origins")}
        description={t("prefs.network.originsDescription")}
      >
        {status.trustedOrigins.length === 0 ? (
          <p className="px-4 py-3.5 text-[13px] text-muted-foreground">
            <Trans
              i18nKey="prefs.network.noOrigins"
              components={{
                code: (
                  <code className="font-mono">codeden network origin add https://&lt;host&gt;</code>
                ),
              }}
            />
          </p>
        ) : (
          status.trustedOrigins.map((origin) => (
            <p
              key={origin}
              className="px-4 py-3 font-mono text-[12.5px] text-muted-foreground"
              data-testid="network-trusted-origin"
            >
              {origin}
            </p>
          ))
        )}
      </SettingsSection>

      <SettingsSection
        title={t("prefs.network.devices")}
        description={t("prefs.network.devicesDescription")}
      >
        {status.devices.length === 0 ? (
          <p className="px-4 py-3.5 text-[13px] text-muted-foreground">
            {t("prefs.network.noDevices")}
          </p>
        ) : (
          <>
            {status.devices.map((d) => (
              <DeviceRow
                key={d.id}
                device={d}
                pending={signOut.isPending}
                onSignOut={() => signOut.mutate(d.id)}
              />
            ))}
            <div className="flex justify-end px-4 py-3">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => signOut.mutate(null)}
                disabled={signOut.isPending}
              >
                <LogOut /> {t("prefs.network.signOutAll")}
              </Button>
            </div>
          </>
        )}
      </SettingsSection>
    </div>
  );
}
