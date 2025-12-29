import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import type { Settings } from "@/config/settings";
import { getSettingsValues } from "@/config/settings";

const settings = getSettingsValues();

export interface SettingsState {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      settings: { ...settings },
      updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) =>
        set((state) => {
          if (value instanceof HTMLElement || value instanceof Event) {
            console.warn("Cannot store DOM elements or events in settings", { key, value });
            return;
          }
          state.settings[key] = value;
        }),
      updateSettings: (newSettings) =>
        set((state) => {
          Object.assign(state.settings, newSettings);
        }),
      resetSettings: () =>
        set((state) => {
          state.settings = { ...settings };
        }),
    })),
    {
      name: "teldrive-settings",
    },
  ),
);
