import { filesize } from "@/utils/common";
import { FileUploadStatus, useFileUploadStore } from "@/utils/stores";
import { ColorsLight } from "@tw-material/file-browser";
import { FbIcon, useIconData } from "@tw-material/file-browser";
import { Button } from "@tw-material/react";
import clsx from "clsx";
import { memo, useMemo } from "react";
import IcRoundKeyboardArrowDown from "~icons/ic/round-keyboard-arrow-down";
import IcRoundKeyboardArrowRight from "~icons/ic/round-keyboard-arrow-right";
import { CircularProgress } from "./circular-progress";

const UploadFileEntry = memo(function UploadFileEntry({
  id,
  chunkSize,
  fileIds,
}: {
  id: string;
  chunkSize: number;
  fileIds: string[];
}) {
  const { status, progress, file, isFolder, collapsed } = useFileUploadStore(
    (state) => state.fileMap[id],
  );
  const removeFile = useFileUploadStore((state) => state.actions.removeFile);
  const fileMap = useFileUploadStore((state) => state.fileMap);
  const { name } = file;

  const iconConfig = useMemo(
    () => ({ name, isDir: isFolder, id: "" }),
    [name, isFolder],
  );
  const { icon, colorCode } = useIconData(iconConfig);

  const childFiles = useMemo(() => {
    if (!isFolder) return [];
    return fileIds
      .filter((childId) => fileMap[childId]?.parentFolderId === id)
      .sort((a, b) => fileMap[a].file.name.localeCompare(fileMap[b].file.name));
  }, [isFolder, fileIds, fileMap, id]);

  const folderProgress = useMemo(() => {
    if (!isFolder || childFiles.length === 0) return 0;
    const totalProgress = childFiles.reduce(
      (sum, childId) => sum + (fileMap[childId]?.progress || 0),
      0,
    );
    return totalProgress / childFiles.length;
  }, [isFolder, childFiles, fileMap]);

  const folderStatus = useMemo(() => {
    if (!isFolder) return status;
    const statuses = childFiles.map((childId) => fileMap[childId]?.status);
    if (statuses.some((s) => s === FileUploadStatus.CANCELLED))
      return FileUploadStatus.CANCELLED;
    if (statuses.some((s) => s === FileUploadStatus.FAILED))
      return FileUploadStatus.FAILED;
    if (statuses.every((s) => s === FileUploadStatus.UPLOADED))
      return FileUploadStatus.UPLOADED;
    if (statuses.some((s) => s === FileUploadStatus.UPLOADING))
      return FileUploadStatus.UPLOADING;
    return FileUploadStatus.NOT_STARTED;
  }, [isFolder, childFiles, fileMap, status]);

  const displayStatus = isFolder ? folderStatus : status;
  const displayProgress = isFolder ? folderProgress : progress;

  const toggleFolderCollapsed = useFileUploadStore(
    (state) => state.actions.toggleFolderCollapsed,
  );

  const isChild = Boolean(fileMap[id]?.parentFolderId);

  const statusText = useMemo(() => {
    if (displayStatus === FileUploadStatus.UPLOADED) return "Completed";
    if (displayStatus === FileUploadStatus.FAILED) return "Failed";
    if (displayStatus === FileUploadStatus.CANCELLED) return "Cancelled";
    if (displayStatus === FileUploadStatus.SKIPPED) return "Skipped";
    if (displayStatus === FileUploadStatus.UPLOADING)
      return `Uploading ${Math.round(displayProgress)}%`;
    return "Pending";
  }, [displayStatus, displayProgress]);

  return (
    <div className={clsx("group/item", isChild && "ml-4")}>
      <div
        className={clsx(
          "flex items-center gap-4 py-3 px-4 transition-colors hover:bg-surface-container-high rounded-xl",
          isFolder && childFiles.length > 0 && "cursor-pointer",
        )}
        onClick={
          isFolder && childFiles.length > 0
            ? () => toggleFolderCollapsed(id)
            : undefined
        }
      >
        <div
          className="relative flex-shrink-0 flex items-center justify-center size-10 rounded-lg overflow-hidden"
          style={{ backgroundColor: `${ColorsLight[colorCode]}1A` }}
        >
          <FbIcon
            className="size-6"
            icon={icon}
            style={{ color: ColorsLight[colorCode] }}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="text-body-medium truncate" title={name}>
              {name}
            </span>
            {isFolder && childFiles.length > 0 && (
              <span className="text-label-small px-1.5 py-0.5 bg-secondary-container text-on-secondary-container rounded-full">
                {childFiles.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-label-medium text-on-surface-variant">
            {!isFolder && file.size > 0 && <span>{filesize(file.size)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isFolder && childFiles.length > 0 && (
            <Button
              isIconOnly
              className="size-8 min-w-8 p-0 text-on-surface-variant"
              variant="text"
              onPress={() => toggleFolderCollapsed(id)}
            >
              {collapsed ? (
                <IcRoundKeyboardArrowRight className="size-5" />
              ) : (
                <IcRoundKeyboardArrowDown className="size-5" />
              )}
            </Button>
          )}
          <CircularProgress
            progress={displayProgress}
            status={displayStatus}
            showCancel={
              displayStatus !== FileUploadStatus.UPLOADED &&
              displayStatus !== FileUploadStatus.SKIPPED &&
              displayStatus !== FileUploadStatus.CANCELLED
            }
            onCancel={() => removeFile(id)}
          />
        </div>
      </div>

      {isFolder && !collapsed && childFiles.length > 0 && (
        <div className="relative">
          <div className="space-y-1">
            {childFiles.map((childId) => (
              <UploadFileEntry
                key={childId}
                id={childId}
                chunkSize={chunkSize}
                fileIds={fileIds}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export { UploadFileEntry };
