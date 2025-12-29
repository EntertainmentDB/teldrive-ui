import type React from "react";
import { memo } from "react";
import { Button } from "@tw-material/react";
import IcOutlineCheckCircle from "~icons/ic/outline-check-circle";
import IcRoundClose from "~icons/ic/round-close";
import IcRoundErrorOutline from "~icons/ic/round-error-outline";
import LineMdCancel from "~icons/line-md/cancel";
import clsx from "clsx";

import type { CircularProgressProps } from "./types";
import { FileUploadStatus } from "@/utils/stores";

export const CircularProgress = memo(
  ({
    progress,
    size = 24,
    strokeWidth = 3,
    className = "",
    showCancel = false,
    onCancel,
    status = FileUploadStatus.NOT_STARTED,
  }: CircularProgressProps) => {
    const showStatusIcon =
      status === FileUploadStatus.CANCELLED ||
      status === FileUploadStatus.FAILED ||
      status === FileUploadStatus.UPLOADED;

    const effectiveShowCancel = showCancel && !showStatusIcon;

    if (showStatusIcon) {
      return (
        <div className={className}>
          <div
            className={clsx(
              "flex items-center justify-center w-full h-full rounded-full",
              status === FileUploadStatus.CANCELLED && "text-gray-400",
              status === FileUploadStatus.FAILED && "text-error",
              status === FileUploadStatus.UPLOADED && "text-green-300",
            )}
            style={{ width: size, height: size }}
          >
            {status === FileUploadStatus.CANCELLED && (
              <LineMdCancel className="size-5" />
            )}
            {status === FileUploadStatus.FAILED && (
              <IcRoundErrorOutline className="size-5" />
            )}
            {status === FileUploadStatus.UPLOADED && (
              <IcOutlineCheckCircle className="size-5" />
            )}
          </div>
        </div>
      );
    }

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={clsx("relative group", className)}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-surface-variant"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-primary transition-all duration-300 ease-out"
            strokeLinecap="round"
          />
        </svg>
        {effectiveShowCancel && onCancel && (
          <Button
            isIconOnly
            variant="text"
            onPress={onCancel}
            className="text-inherit transition-opacity size-6 min-w-6 absolute inset-0 [&>svg]:size-4 opacity-0 group-hover:opacity-100"
            aria-label="Cancel upload"
          >
            <IcRoundClose className="size-1" />
          </Button>
        )}
      </div>
    );
  },
);
