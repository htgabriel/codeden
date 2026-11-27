import { SPOT_CHECK_DARK_FACTORY_DEFAULT } from "@codeden/contracts";
import { useId } from "react";
import { Field } from "@/components/automations/form-bits";
import { NumberField } from "@/components/common/number-field";
import { useTranslation } from "@/lib/i18n";

/**
 * "Spot-check share of automatic merges" (`FactoryTuning.spotCheckPercent`): a percentage, or
 * empty for the mode's default (10% in a dark factory, off otherwise). 0 turns spot-checks off.
 */
export function SpotCheckField({
  value,
  dark,
  onChange,
}: {
  value: number | null;
  /** The project is (or becomes) a dark factory: the default is on. */
  dark: boolean;
  onChange: (spotCheckPercent: number | null) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <Field
      label={t("factory.spotTuning.label")}
      htmlFor={id}
      hint={t("factory.spotTuning.hint")}
      help={t("factory.spotTuning.help", { n: SPOT_CHECK_DARK_FACTORY_DEFAULT })}
    >
      <NumberField
        id={id}
        optional
        min={0}
        max={100}
        value={value}
        placeholder={
          dark
            ? t("factory.spotTuning.placeholderDark", { n: SPOT_CHECK_DARK_FACTORY_DEFAULT })
            : t("factory.spotTuning.placeholderOff")
        }
        onChange={onChange}
        className="text-[13px]"
      />
    </Field>
  );
}
