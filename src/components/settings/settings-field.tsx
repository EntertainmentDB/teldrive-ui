import { memo, useState, useCallback, useEffect } from "react";
import { Input, Select, SelectItem, Switch } from "@tw-material/react";
import clsx from "clsx";
import type { SettingFieldConfig } from "@/config/settings";
import { debounce } from "@/utils/debounce";

interface SettingsFieldProps<T> {
  config: SettingFieldConfig<T>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

function validateUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const SettingsField = memo(
  <T,>({ config, value, onChange, disabled }: SettingsFieldProps<T>) => {
    const [error, setError] = useState("");
    const [localValue, setLocalValue] = useState<T>(value);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const debouncedValidate = useCallback(
      debounce((newValue: T) => {
        validateAndSave(newValue);
      }, 1000),
      [config],
    );

    const validateAndSave = (newValue: T) => {
      let errorMessage = "";

      if (config.type === "url" && typeof newValue === "string") {
        if (newValue && !validateUrl(newValue)) {
          errorMessage = "Invalid URL format";
        }
      } else if (config.validation?.pattern && typeof newValue === "string") {
        if (newValue && !config.validation.pattern.test(newValue)) {
          errorMessage = "Invalid format";
        }
      } else if (config.validation?.custom && newValue) {
        const result = config.validation.custom(newValue as any);
        if (result !== true) {
          errorMessage = result;
        }
      }

      setError(errorMessage);

      if (!errorMessage) {
        onChange(newValue);
      }
    };

    const handleFieldChange = (newValue: T) => {
      setLocalValue(newValue);
      debouncedValidate(newValue);
    };

    const renderField = () => {
      switch (config.type) {
        case "text":
        case "email":
        case "url":
          return (
            <Input
              size="lg"
              variant="bordered"
              isInvalid={!!error}
              errorMessage={error}
              placeholder={config.placeholder}
              value={localValue as string}
              onValueChange={(v) => handleFieldChange(v as T)}
              isDisabled={disabled}
            />
          );

        case "number":
          return (
            <Input
              size="lg"
              variant="bordered"
              isInvalid={!!error}
              errorMessage={error}
              type="number"
              value={localValue !== undefined && localValue !== null ? String(localValue) : ""}
              onValueChange={(v) => handleFieldChange(Number(v) as T)}
              isDisabled={disabled}
            />
          );

        case "select":
          return (
            <Select
              aria-label={config.label}
              size="lg"
              variant="bordered"
              isInvalid={!!error}
              errorMessage={error}
              defaultSelectedKeys={[String(value)]}
              scrollShadowProps={{
                isEnabled: false,
              }}
              classNames={{
                popoverContent: "rounded-lg shadow-1",
              }}
              items={config.options || []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                if (selected !== undefined) {
                  const option = config.options?.find((opt) => String(opt.value) === selected);
                  if (option) {
                    handleFieldChange(option.value as T);
                  }
                }
              }}
              isDisabled={disabled}
            >
              {(item) => (
                <SelectItem key={String(item.value)} value={String(item.value)}>
                  {item.label}
                </SelectItem>
              )}
            </Select>
          );

        case "switch":
          return (
            <Switch
              size="lg"
              onChange={(e) => handleFieldChange(e.target.checked as T)}
              isSelected={localValue as boolean}
              name={config.key}
              isDisabled={disabled}
            />
          );

        default:
          return null;
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <p className="text-lg font-medium">{config.label}</p>
          <p className="text-sm font-normal text-on-surface-variant">{config.description}</p>
        </div>
        <div className={clsx("flex justify-start", disabled && "opacity-50")}>{renderField()}</div>
      </div>
    );
  },
);
