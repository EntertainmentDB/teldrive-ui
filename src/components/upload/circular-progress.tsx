import { Button } from "@tw-material/react";
import clsx from "clsx";
import type React from "react";
import { memo } from "react";
import IcOutlineCheckCircle from "~icons/ic/outline-check-circle";
import IcRoundClose from "~icons/ic/round-close";
import IcRoundErrorOutline from "~icons/ic/round-error-outline";
import MdiCancel from "~icons/mdi/cancel";

import { FileUploadStatus } from "@/utils/stores";
import type { CircularProgressProps } from "./types";

export const CircularProgress = memo(function CircularProgress({
  progress,
  size = 24,
  strokeWidth = 3,
  className = "",
  showCancel = false,
  onCancel,
  status = FileUploadStatus.NOT_STARTED,
}: CircularProgressProps) {
  const showStatusIcon =
    status === FileUploadStatus.CANCELLED ||
    status === FileUploadStatus.FAILED ||
    status === FileUploadStatus.UPLOADED;

  const effectiveShowCancel = showCancel && !showStatusIcon;

  if (showStatusIcon) {
    return (
      <div
        className={clsx(
          "flex items-center justify-center rounded-full",
          status === FileUploadStatus.CANCELLED && "text-on-surface-variant/50",
          status === FileUploadStatus.FAILED && "text-error",
          status === FileUploadStatus.UPLOADED && "text-primary",
        )}
        style={{ width: size, height: size }}
      >
        {status === FileUploadStatus.CANCELLED && (
          <MdiCancel className="size-5" />
        )}
        {status === FileUploadStatus.FAILED && (
          <IcRoundErrorOutline className="size-5" />
        )}
        {status === FileUploadStatus.UPLOADED && (
          <IcOutlineCheckCircle className="size-5" />
        )}
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={clsx(
        "relative group inline-flex items-center justify-center",
        className,
      )}
    >
      <svg
        className="transform transition-transform duration-500 -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-secondary-container"
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
          className={"text-primary transition-all duration-300 ease-out"}
          strokeLinecap="round"
        />
      </svg>
      {effectiveShowCancel && onCancel && (
        <Button
          isIconOnly
          variant="text"
          onPress={onCancel}
          className="text-inherit transition-opacity size-6 min-w-6 absolute inset-0 [&>svg]:size-4 text-primary opacity-0 group-hover:opacity-100"
          aria-label="Cancel upload"
        >
          <IcRoundClose className="size-4" />
        </Button>
      )}
    </div>
  );
});
