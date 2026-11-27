import { READ_ALOUD_FULL_MAX_CHARS } from "@codeden/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useClient } from "@/lib/api";
import { Trans, useTranslation } from "@/lib/i18n";
import { formatCombo, shortcut } from "@/lib/shortcuts";
import { browserSttAvailability, resetBrowserSttAvailability, tts } from "@/lib/voice/engines";
import { speak, speechQueue } from "@/lib/voice/speak";
import { SecretField, useSecrets } from "./secret-field";
import { LocalWhisperRows } from "./sections-voice-local";
import { Segmented, SettingRow, SettingsSection, useSettings } from "./settings-ui";
import { QuietHoursRow, ShortcutRecorder } from "./voice-controls";

const LANGUAGES = ["auto", "en-US", "en-GB", "en-ZA", "de-DE", "fr-FR", "es-ES", "nl-NL"];

/** Browser voices, refreshed when the browser finishes loading them. */
function useBrowserVoices() {
  const [voices, setVoices] = useState(() => tts.voices());
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => setVoices(tts.voices());
    window.speechSynthesis.addEventListener("voiceschanged", load);
    load();
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return voices;
}

export function VoiceSettings() {
  const { t } = useTranslation();
  const client = useClient();
  const { settings, update } = useSettings();
  const v = settings.voice;
  const browserVoices = useBrowserVoices();
  const secrets = useSecrets();
  const has = (key: string) => secrets.data?.keys.some((k) => k.key === key && k.set) ?? false;
  const cloudTts = v.readAloud.engine === "elevenlabs";
  const voices = useQuery({
    queryKey: ["eleven-voices", has("elevenlabs.apiKey")],
    queryFn: () => client.voice.voices(),
    enabled: cloudTts && has("elevenlabs.apiKey"),
    retry: false,
  });
  const voiceOptions = cloudTts
    ? (voices.data?.voices ?? []).map((vo) => ({ id: vo.id, label: vo.name }))
    : browserVoices.map((vo) => ({ id: vo.id, label: `${vo.label} (${vo.lang})` }));
  const testVoice = useMutation({
    // Plays straight away, ahead of (and stopping) any queued read-aloud.
    mutationFn: async () =>
      speechQueue.playNow({
        key: `test-${Date.now()}`,
        play: () =>
          speak(client, settings, t("prefs.voice.sample")).catch((e: Error) => {
            toast.error(t("prefs.voice.playFailed"), { description: e.message });
          }),
      }),
  });
  const dictationKey = v.dictation.engine === "openai" ? "openai.apiKey" : "elevenlabs.apiKey";
  const browserAvailable = browserSttAvailability() === "available";

  return (
    <>
      <SettingsSection
        title={t("prefs.voice.dictation")}
        description={t("prefs.voice.dictationDescription", {
          combo: formatCombo(shortcut("dictate").combo),
        })}
      >
        <SettingRow
          label={t("prefs.voice.engine")}
          help={
            v.dictation.engine === "browser" ? (
              browserAvailable ? (
                t("prefs.voice.browserWorks")
              ) : (
                <span data-testid="browser-stt-unavailable">
                  <Trans
                    i18nKey="prefs.voice.browserUnavailable"
                    components={{
                      use: (
                        <button
                          type="button"
                          className="text-foreground underline underline-offset-2"
                          onClick={() => update({ voice: { dictation: { engine: "local" } } })}
                        />
                      ),
                    }}
                  />
                </span>
              )
            ) : v.dictation.engine === "local" ? (
              t("prefs.voice.localHelp")
            ) : has(dictationKey) ? (
              t("prefs.voice.cloudHelp")
            ) : (
              t("prefs.voice.addKey", {
                provider: v.dictation.engine === "openai" ? "OpenAI" : "ElevenLabs",
              })
            )
          }
        >
          <Segmented
            value={v.dictation.engine}
            onChange={(engine) => {
              // Picking the browser engine again gives a remembered failure another try.
              if (engine === "browser") resetBrowserSttAvailability();
              update({ voice: { dictation: { engine } } });
            }}
            options={[
              {
                value: "browser",
                label:
                  browserAvailable || v.dictation.engine === "browser"
                    ? t("prefs.voice.browser")
                    : t("prefs.voice.browserUnavailableOption"),
              },
              { value: "local", label: t("prefs.voice.local") },
              { value: "elevenlabs", label: "ElevenLabs" },
              { value: "openai", label: "OpenAI" },
            ]}
          />
        </SettingRow>
        {v.dictation.engine === "local" && <LocalWhisperRows />}
        <SettingRow
          label={t("settings.appearance.language")}
          help={
            v.dictation.engine === "browser"
              ? t("prefs.voice.languageBrowser")
              : t("prefs.voice.languageAuto")
          }
        >
          <Select
            value={v.dictation.language ?? "auto"}
            onValueChange={(language) =>
              update({ voice: { dictation: { language: language === "auto" ? null : language } } })
            }
          >
            <SelectTrigger size="sm" className="w-40" aria-label={t("prefs.voice.languageLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l === "auto" ? t("settings.appearance.auto") : l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow
          label={t("prefs.voice.pushToTalk")}
          help={t("prefs.voice.pushToTalkHelp", {
            mod: formatCombo("mod"),
            alt: formatCombo("alt"),
          })}
        >
          <ShortcutRecorder
            value={v.dictation.pushToTalkShortcut}
            onChange={(pushToTalkShortcut) =>
              update({ voice: { dictation: { pushToTalkShortcut } } })
            }
          />
        </SettingRow>
        {v.dictation.engine === "openai" && (
          <SettingRow label={t("prefs.images.openaiKey")} help={t("prefs.voice.openaiKeyHelp")}>
            <SecretField secret="openai.apiKey" label={t("prefs.images.openaiKeyShort")} />
          </SettingRow>
        )}
      </SettingsSection>

      <SettingsSection
        title={t("prefs.voice.readAloud")}
        description={t("prefs.voice.readAloudDescription")}
      >
        <SettingRow label={t("prefs.voice.readFinal")} help={t("prefs.voice.readFinalHelp")}>
          <Switch
            aria-label={t("prefs.voice.readFinal")}
            checked={v.readAloud.enabled}
            onCheckedChange={(enabled) => {
              // Switching it off also stops what's playing and drops the queue.
              if (!enabled) speechQueue.clear();
              update({ voice: { readAloud: { enabled } } });
            }}
          />
        </SettingRow>
        <SettingRow
          label={t("prefs.voice.whatToRead")}
          help={
            v.readAloud.content === "summary"
              ? t("prefs.voice.summaryHelp")
              : t("prefs.voice.fullHelp", {
                  max: READ_ALOUD_FULL_MAX_CHARS.toLocaleString(t("prefs.voice.numberLocale")),
                })
          }
        >
          <Segmented
            value={v.readAloud.content}
            onChange={(content) => update({ voice: { readAloud: { content } } })}
            options={[
              { value: "summary", label: "TL;DR" },
              { value: "full", label: t("prefs.voice.fullMessage") },
            ]}
          />
        </SettingRow>
        <SettingRow label={t("prefs.voice.announce")} help={t("prefs.voice.announceHelp")}>
          <Switch
            aria-label={t("prefs.voice.announce")}
            checked={v.readAloud.announceSpeaker}
            onCheckedChange={(announceSpeaker) =>
              update({ voice: { readAloud: { announceSpeaker } } })
            }
          />
        </SettingRow>
        <SettingRow label={t("prefs.voice.engine")}>
          <Segmented
            value={v.readAloud.engine}
            // Voice ids differ per engine, so switching resets the voice.
            onChange={(engine) => update({ voice: { readAloud: { engine, voice: null } } })}
            options={[
              { value: "browser", label: t("prefs.voice.browserFree") },
              { value: "elevenlabs", label: "ElevenLabs" },
            ]}
          />
        </SettingRow>
        <SettingRow
          label={t("prefs.voice.voice")}
          help={
            cloudTts && !has("elevenlabs.apiKey")
              ? t("prefs.voice.addElevenKey")
              : voices.error
                ? voices.error.message
                : undefined
          }
        >
          <div className="flex items-center gap-2">
            <Select
              value={v.readAloud.voice ?? "default"}
              onValueChange={(voice) =>
                update({ voice: { readAloud: { voice: voice === "default" ? null : voice } } })
              }
            >
              <SelectTrigger size="sm" className="w-56" aria-label={t("prefs.voice.voiceLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  {cloudTts ? t("prefs.voice.defaultVoice") : t("prefs.voice.systemDefault")}
                </SelectItem>
                {voiceOptions.slice(0, 60).map((vo) => (
                  <SelectItem key={vo.id} value={vo.id}>
                    {vo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={
                (cloudTts ? !has("elevenlabs.apiKey") : !tts.supported) || testVoice.isPending
              }
              onClick={() => testVoice.mutate()}
            >
              <Volume2 /> {t("prefs.voice.test")}
            </Button>
          </div>
        </SettingRow>
        <SettingRow label={t("prefs.voice.onlyUnfocused")}>
          <Switch
            aria-label={t("prefs.voice.onlyUnfocused")}
            checked={v.readAloud.onlyWhenUnfocused}
            onCheckedChange={(onlyWhenUnfocused) =>
              update({ voice: { readAloud: { onlyWhenUnfocused } } })
            }
          />
        </SettingRow>
        <QuietHoursRow />
        <SettingRow label={t("prefs.voice.elevenKey")} help={t("prefs.voice.elevenKeyHelp")}>
          <SecretField secret="elevenlabs.apiKey" label={t("prefs.voice.elevenKeyShort")} />
        </SettingRow>
      </SettingsSection>
    </>
  );
}
