import type { UiLanguagePreference } from "@codeden/contracts";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LanguageState {
  preference: UiLanguagePreference;
  setPreference: (preference: UiLanguagePreference) => void;
}

/**
 * UI language preference (§13), persisted per browser like the theme so the first paint
 * already uses it; Settings also saves it to `appearance.language`.
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      preference: "auto",
      setPreference: (preference) => set({ preference }),
    }),
    { name: "codeden.language" },
  ),
);
