import { memo, useMemo } from "react";
import { Button } from "@tw-material/react";
import clsx from "clsx";
import { ColorsLight } from "@tw-material/file-browser";
import { FbIcon, useIconData } from "@tw-material/file-browser";
import { CircularProgress } from "./circular-progress";
import { FileUploadStatus, useFileUploadStore } from "@/utils/stores";
import IcRoundKeyboardArrowRight from "~icons/ic/round-keyboard-arrow-right";
import IcRoundKeyboardArrowDown from "~icons/ic/round-keyboard-arrow-down";

const UploadFileEntry = memo(
  ({
    id,
    chunkSize,
    fileIds,
  }: {
    id: string;
    chunkSize: number;
    fileIds: string[];
  }) => {
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
        .sort((a, b) =>
          fileMap[a].file.name.localeCompare(fileMap[b].file.name),
        );
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

    return (
      <div
        className={clsx(isChild && "folder-connector relative")}
      >
        <div
          className={clsx(
            "flex size-full items-center gap-3 p-1",
            isFolder && childFiles.length > 0 && "cursor-pointer",
          )}
          onClick={
            isFolder && childFiles.length > 0
              ? () => toggleFolderCollapsed(id)
              : undefined
          }
        >
          <div
            className="size-8 grid rounded-lg shrink-0"
            style={{ backgroundColor: `${ColorsLight[colorCode]}1F` }}
          >
            <FbIcon
              className="size-5 text-center min-w-5 place-self-center text-primary"
              icon={icon}
              style={{
                color: ColorsLight[colorCode],
              }}
            />
          </div>
          <div className="flex flex-col gap-1 truncate flex-1 min-w-0">
            <p title={name} className="truncate text-base font-normal">
              {name}
              {isFolder && collapsed && childFiles.length > 0 && (
                <span className="text-xs text-on-surface-variant ml-2">
                  ({childFiles.length})
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isFolder && childFiles.length > 0 && (
              <Button
                isIconOnly
                className="size-8 min-w-8 p-0"
                variant="text"
                onPress={() => toggleFolderCollapsed(id)}
              >
                {collapsed ? (
                  <IcRoundKeyboardArrowRight className="transition-transform duration-200" />
                ) : (
                  <IcRoundKeyboardArrowDown className="transition-transform duration-200" />
                )}
              </Button>
            )}
            <CircularProgress
              progress={displayProgress}
              className="transition-opacity duration-200"
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

        {isFolder && !collapsed && (
          <div className="mt-2 space-y-2 ml-6">
            {childFiles.map((childId) => (
              <UploadFileEntry
                key={childId}
                id={childId}
                chunkSize={chunkSize}
                fileIds={fileIds}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);

export { UploadFileEntry };
