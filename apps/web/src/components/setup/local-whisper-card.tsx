import { Cpu } from "lucide-react";
import {
  useLocalStt,
  useLocalSttActions,
  WhisperModelSelect,
  WhisperModelStatus,
} from "@/components/settings/local-whisper";
import { WhisperTest } from "@/components/settings/local-whisper-test";
import { useSettings } from "@/components/settings/settings-ui";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";

/**
 * First-run setup (§14): optional local Whisper for dictation. Turning it on picks the
 * engine and starts the download, which carries on in the background if the user moves on;
 * nothing here blocks finishing setup.
 */
export function LocalWhisperCard({ recommended }: { recommended: boolean }) {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const local = useLocalStt();
  const actions = useLocalSttActions();
  const dictation = settings.voice.dictation;
  const using = dictation.engine === "local";
  const model = local.data?.models.find((m) => m.id === dictation.local.model);
  const supported = local.data?.supported ?? true;
  return (
    <div className="px-4 py-3.5" data-testid="local-whisper-card">
      <div className="flex items-center gap-3">
        <Cpu className="size-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="text-[13.5px] font-medium">{t("prefs.setup.whisper.title")}</div>
          <div className="text-2xs text-muted-foreground">
            {!supported
              ? (local.data?.unsupportedReason ?? t("prefs.setup.whisper.unsupported"))
              : recommended
                ? t("prefs.setup.whisper.recommended")
                : t("prefs.setup.whisper.optional")}
          </div>
        </div>
        <Switch
          aria-label={t("prefs.setup.whisper.title")}
          checked={using}
          disabled={!supported}
          onCheckedChange={(on) => {
            update({ voice: { dictation: { engine: on ? "local" : "browser" } } });
            if (on && (model?.state === "missing" || model?.state === "failed")) {
              void actions.download(model.id);
            }
          }}
        />
      </div>
      {using && (
        <div className="mt-3 flex flex-col gap-3 pl-7">
          <WhisperModelSelect
            status={local.data}
            value={dictation.local.model}
            onChange={(id) => update({ voice: { dictation: { local: { model: id } } } })}
          />
          <WhisperModelStatus status={local.data} modelId={dictation.local.model} />
          <WhisperTest disabled={model?.state !== "installed"} language={dictation.language} />
        </div>
      )}
    </div>
  );
}
