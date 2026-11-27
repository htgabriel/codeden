import { useTranslation } from "@/lib/i18n";
import { useLocalStt, WhisperModelSelect, WhisperModelStatus } from "./local-whisper";
import { WhisperTest } from "./local-whisper-test";
import { SettingRow, useSettings } from "./settings-ui";

/** Settings › Voice rows for local Whisper (§11.3): model, download status and a test. */
export function LocalWhisperRows() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const dictation = settings.voice.dictation;
  const local = useLocalStt();
  const model = local.data?.models.find((m) => m.id === dictation.local.model);
  return (
    <>
      <SettingRow
        label={t("prefs.whisper.modelLabel")}
        help={
          local.error
            ? t("prefs.whisper.readFailed", { message: local.error.message })
            : t("prefs.whisper.location", {
                location: local.data?.location ?? t("prefs.whisper.defaultLocation"),
              })
        }
        stacked
      >
        <div className="flex flex-col gap-3">
          <WhisperModelSelect
            status={local.data}
            value={dictation.local.model}
            onChange={(id) => update({ voice: { dictation: { local: { model: id } } } })}
          />
          <WhisperModelStatus status={local.data} modelId={dictation.local.model} />
        </div>
      </SettingRow>
      <SettingRow label={t("prefs.whisper.tryIt")} help={t("prefs.whisper.tryItHelp")} stacked>
        <WhisperTest disabled={model?.state !== "installed"} language={dictation.language} />
      </SettingRow>
    </>
  );
}
