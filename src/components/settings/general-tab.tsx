import { memo, useCallback } from "react";
import { scrollbarClasses } from "@/utils/classes";
import clsx from "clsx";

import { generalSettingsConfig, categoryConfig } from "@/config/settings";
import { SettingsField } from "./settings-field";
import { useSettingsStore } from "@/utils/stores/settings";

export const GeneralTab = memo(() => {
  const { settings, updateSetting } = useSettingsStore();

  const categories = ["upload", "display", "other"] as const;

  const handleFieldChange = useCallback(
    (key: keyof typeof settings, value: any) => {
      if (value instanceof HTMLElement || value instanceof Event) {
        console.error("Invalid value type for setting:", key, value);
        return;
      }
      updateSetting(key, value);
    },
    [updateSetting],
  );

  return (
    <div
      className={clsx(
        "flex flex-col gap-4 p-4 h-full overflow-y-auto",
        scrollbarClasses,
      )}
    >
      {categories.map((category) => {
        const fields = generalSettingsConfig.filter(
          (f) => f.category === category,
        );
        if (fields.length === 0) return null;

        const catConfig = categoryConfig[category];

        return (
          <div
            key={category}
            className="bg-surface rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-outline-variant/50 flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <h3 className="text-lg font-semibold">{catConfig.title}</h3>
            </div>
            <div className="space-y-4">
              {fields.map((field) => (
                <SettingsField
                  key={field.key}
                  config={field}
                  value={settings[field.key]}
                  onChange={(value) => handleFieldChange(field.key, value)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
