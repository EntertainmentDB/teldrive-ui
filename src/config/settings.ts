import { splitFileSizes } from "@/utils/common";

export type FieldType =
  | "text"
  | "number"
  | "email"
  | "url"
  | "select"
  | "switch"
  | "textarea";

type SettingKeys =
  | "concurrency"
  | "randomChunking"
  | "resizerHost"
  | "pageSize"
  | "splitFileSize"
  | "encryptFiles"
  | "rcloneProxy";

type SettingValue = string | number | boolean;

export interface SettingFieldConfig<T> {
  key: SettingKeys;
  type: FieldType;
  label: string;
  description: string;
  placeholder?: string;
  defaultValue?: T;
  options?: Array<{ value: T; label: string }>;
  validation?: {
    pattern?: RegExp;
    custom?: (value: SettingValue) => string | true;
  };
  category: "upload" | "display" | "security" | "other";
}

export const generalSettingsConfig: SettingFieldConfig<SettingValue>[] = [
  {
    key: "concurrency",
    type: "number",
    label: "Concurrency",
    description: "Concurrent Part Uploads",
    defaultValue: 4,
    category: "upload",
  },
  {
    key: "resizerHost",
    type: "url",
    label: "Resizer Host",
    description: "Image Resize Host to resize images",
    placeholder: "https://resizer.example.com",
    category: "other",
  },
  {
    key: "pageSize",
    type: "number",
    label: "Page Size",
    description: "Number of items per page",
    defaultValue: 500,
    category: "display",
  },
  {
    key: "splitFileSize",
    type: "select",
    label: "Split File Size",
    description: "Split File Size for multipart uploads",
    options: splitFileSizes,
    defaultValue: splitFileSizes[1].value,
    category: "upload",
  },
  {
    key: "encryptFiles",
    type: "switch",
    label: "Encrypt Files",
    description: "Encrypt Files before uploading",
    defaultValue: false,
    category: "upload",
  },
  {
    key: "randomChunking",
    type: "switch",
    label: "Random Chunking",
    description: "Randomize Names of File Chunks",
    defaultValue: false,
    category: "upload",
  },
  {
    key: "rcloneProxy",
    type: "url",
    label: "Rclone Media Proxy",
    description: "Play Files directly from Rclone Webdav",
    placeholder: "http://localhost:8080",
    category: "other",
  },
];

type LiteralToPrimitive<T> = T extends boolean
  ? boolean
  : T extends number
    ? number
    : T extends string
      ? string
      : T;

export type Settings = {
  [P in (typeof generalSettingsConfig)[number] as P["key"]]: LiteralToPrimitive<
    P["defaultValue"]
  >;
};

export function getSettingsValues(): Settings {
  const settings = {} as any;
  generalSettingsConfig.forEach((item) => {
    settings[item.key] = item?.defaultValue || "";
  });
  return settings;
}

export const categoryConfig = {
  upload: {
    title: "Uploads",
    description: "Configure upload behavior",
  },
  display: {
    title: "Display",
    description: "Customize how content is displayed",
  },
  security: {
    title: "Security",
    description: "Configure security options",
  },
  other: {
    title: "Other",
    description: "Other Options",
  },
} as const;
