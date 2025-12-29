import type React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Listbox, ListboxItem } from "@tw-material/react";
import IconParkOutlineCloseOne from "~icons/icon-park-outline/close-one";
import IconParkOutlineDownC from "~icons/icon-park-outline/down-c";
import clsx from "clsx";
import toast from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";

import type { UploadProps } from "./types";
import { UploadFileEntry } from "./upload-file-entry";
import { uploadFile } from "./upload-file";
import { scrollbarClasses } from "@/utils/classes";
import { filesize } from "@/utils/common";
import useSettings from "@/hooks/use-settings";
import { $api } from "@/utils/api";
import { useSession } from "@/utils/query-options";
import { FileUploadStatus, useFileUploadStore } from "@/utils/stores";
import { useSearch } from "@tanstack/react-router";

export const Upload = ({ queryKey }: UploadProps) => {
  const {
    fileIds,
    currentFile,
    collapse,
    fileDialogOpen,
    folderDialogOpen,
    actions,
    fileMap,
  } = useFileUploadStore(
    useShallow((state) => ({
      fileIds: state.filesIds,
      fileMap: state.fileMap,
      currentFile: state.fileMap[state.currentFileId],
      collapse: state.collapse,
      actions: state.actions,
      fileDialogOpen: state.fileDialogOpen,
      folderDialogOpen: state.folderDialogOpen,
    })),
  );

  const isDialogOpening = useRef(false);

  const uploadSummary = useMemo(() => {
    const topLevelIds = fileIds.filter((id) => {
      const file = fileMap[id];
      if (!file) return false;
      const isChildFile =
        file.parentFolderId && fileIds.includes(file.parentFolderId);
      return !isChildFile;
    });

    // Filter out cancelled, failed, and skipped files from progress calculations
    const validFileIds = fileIds.filter((id) => {
      const status = fileMap[id]?.status;
      return (
        status !== FileUploadStatus.CANCELLED &&
        status !== FileUploadStatus.FAILED &&
        status !== FileUploadStatus.SKIPPED
      );
    });

    const validTopLevelIds = topLevelIds.filter((id) => {
      const status = fileMap[id]?.status;
      return (
        status !== FileUploadStatus.CANCELLED &&
        status !== FileUploadStatus.FAILED &&
        status !== FileUploadStatus.SKIPPED
      );
    });

    const folders = validTopLevelIds.filter(
      (id) => fileMap[id]?.isFolder,
    ).length;
    const files = validTopLevelIds.filter(
      (id) => !fileMap[id]?.isFolder,
    ).length;

    const totalSize = validFileIds.reduce(
      (sum, id) => sum + (fileMap[id]?.file.size || 0),
      0,
    );
    const uploadedSize = validFileIds.reduce((sum, id) => {
      const file = fileMap[id];
      // For uploaded files, count as 100% progress
      const progress =
        file?.status === FileUploadStatus.UPLOADED ? 100 : file?.progress || 0;
      return sum + (progress / 100) * (file?.file.size || 0);
    }, 0);

    // Calculate progress only for actual files (exclude folders)
    const totalProgress = totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0;

    return {
      folders,
      files,
      totalProgress,
      totalSize,
      uploadedSize,
    };
  }, [fileIds, fileMap]);

  const topLevelFileIds = useMemo(() => {
    return fileIds.filter((id) => {
      const file = fileMap[id];
      if (!file) return false;
      const isChildFile =
        file.parentFolderId && fileIds.includes(file.parentFolderId);
      return !isChildFile;
    });
  }, [fileIds, fileMap]);

  const { settings } = useSettings();

  const [session] = useSession();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const openFileSelector = useCallback(() => {
    if (!isDialogOpening.current) {
      isDialogOpening.current = true;
      fileInputRef?.current?.click();
      setTimeout(() => {
        isDialogOpening.current = false;
      }, 200);
    }
  }, []);

  const openFolderSelector = useCallback(() => {
    if (!isDialogOpening.current) {
      isDialogOpening.current = true;
      folderInputRef?.current?.click();
      setTimeout(() => {
        isDialogOpening.current = false;
      }, 200);
    }
  }, []);

  useEffect(() => {
    const handleFileSelect = () => {
      actions.setFileDialogOpen(false);
    };

    if (fileDialogOpen) {
      openFileSelector();
      fileInputRef.current?.addEventListener("change", handleFileSelect, {
        once: true,
      });
    }

    return () => {
      fileInputRef.current?.removeEventListener("change", handleFileSelect);
    };
  }, [fileDialogOpen, actions]);

  useEffect(() => {
    const handleFolderSelect = () => {
      actions.setFolderDialogOpen(false);
    };

    if (folderDialogOpen) {
      openFolderSelector();
      folderInputRef.current?.addEventListener("change", handleFolderSelect, {
        once: true,
      });
    }

    return () => {
      folderInputRef.current?.removeEventListener("change", handleFolderSelect);
    };
  }, [folderDialogOpen, actions]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
        ? Array.from(event.target.files).filter((f) => f.size > 0)
        : [];
      if (files.length > 0) {
        actions.addFiles(files);
      }
      event.target.value = "";
    },
    [actions],
  );

  const handleFolderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const fileList = Array.from(files);
      const firstFile = fileList[0];
      const relativePath = firstFile?.webkitRelativePath;
      const hasFolderStructure = relativePath && fileList.length > 0;

      if (hasFolderStructure) {
        const pathParts = relativePath.split("/");
        const folderName = pathParts[0] || "Untitled Folder";
        actions.addFolder(Array.from(files), folderName);
      } else {
        const validFiles = Array.from(files).filter((f) => f.size > 0);
        if (validFiles.length > 0) {
          actions.addFiles(validFiles);
        }
      }
      event.target.value = "";
    },
    [actions],
  );

  const queryClient = useQueryClient();

  const creatFile = $api.useMutation("post", "/files", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  const { path } = useSearch({ from: "/_authed/$view" });

  useEffect(() => {
    if (
      currentFile?.id &&
      currentFile?.status === FileUploadStatus.NOT_STARTED
    ) {
      if (currentFile.isFolder) {
        actions.setFileUploadStatus(currentFile.id, FileUploadStatus.UPLOADING);
        creatFile
          .mutateAsync({
            body: {
              name: currentFile.file.name,
              type: "folder",
              path: currentFile.relativePath ? `${path || "/"}/${currentFile.relativePath.split("/").slice(0, -1).join("/")}` : path || "/",
            },
          })
          .then(() => {
            actions.setFileUploadStatus(
              currentFile.id,
              FileUploadStatus.UPLOADED,
            );
            actions.startNextUpload();
          })
          .catch((err) => {
            if (
              err.message.includes("already exists") ||
              err.message.includes("exists")
            ) {
              actions.setFileUploadStatus(
                currentFile.id,
                FileUploadStatus.SKIPPED,
              );
            } else {
              actions.setError(currentFile.id, err.message);
              actions.setFileUploadStatus(
                currentFile.id,
                FileUploadStatus.FAILED,
              );
            }
          });
      } else {
        actions.setFileUploadStatus(currentFile.id, FileUploadStatus.UPLOADING);
        uploadFile(
          currentFile.file,
          currentFile.parentFolderId
            ? `${path || "/"}/${currentFile.relativePath?.split("/").slice(0, -1).join("/")}`
            : path || "/",
          Number(settings.splitFileSize),
          session?.userId as number,
          Number(settings.uploadConcurrency),
          Boolean(settings.encryptFiles),
          currentFile.controller.signal,
          (progress) => actions.setProgress(currentFile.id, progress),
          (chunks) => actions.setChunksCompleted(currentFile.id, chunks),
          async (payload) => {
            await creatFile.mutateAsync({
              body: payload,
            });
            if (creatFile.isSuccess) {
              actions.setFileUploadStatus(
                currentFile.id,
                FileUploadStatus.UPLOADED,
              );
            }
          },
          currentFile.parentFolderId !== undefined, // Skip check for folder files
        )
          .then(() => {
            if (currentFile.status !== FileUploadStatus.SKIPPED) {
              actions.setFileUploadStatus(
                currentFile.id,
                FileUploadStatus.UPLOADED,
              );
            }
            actions.startNextUpload();
          })
          .catch((error) => {
            if (error.message.includes("already exists")) {
              actions.setFileUploadStatus(
                currentFile.id,
                FileUploadStatus.SKIPPED,
              );
            } else if (error.message.includes("aborted")) {
              actions.setFileUploadStatus(
                currentFile.id,
                FileUploadStatus.CANCELLED,
              );
            } else {
              actions.setError(
                currentFile.id,
                error instanceof Error ? error.message : "upload failed",
              );
              actions.setFileUploadStatus(
                currentFile.id,
                FileUploadStatus.FAILED,
              );
            }
          });
      }
    }
  }, [currentFile?.id, currentFile?.status]);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <input
        className="opacity-0 size-0"
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
      />
      <input
        className="opacity-0 size-0"
        ref={folderInputRef}
        type="file"
        {...({ webkitdirectory: "" } as any)}
        onChange={handleFolderChange}
      />
      {fileIds.length > 0 && (
        <div className="relative w-96">
          <div
            className={clsx(
              "transition-transform duration-200 ease-out will-change-transform",
              collapse ? "translate-y-0" : "-translate-y-1",
            )}
          >
            <div
              className={clsx(
                "bg-surface-container border-surface-variant border-2 border-b-0",
                "relative overflow-hidden",
                collapse ? "rounded-lg border-b-2" : "rounded-t-lg",
              )}
            >
              <div className="h-1.5 bg-surface-container-highest rounded-t-lg overflow-hidden relative">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out shadow-sm relative overflow-hidden"
                  style={{ width: `${uploadSummary.totalProgress}%` }}
                />
              </div>
              <div className="flex items-center p-1 justify-between">
                <div className="flex flex-1 items-center gap-3 text-xs text-on-surface-variant">
                  {uploadSummary.totalSize > 0 && (
                    <span className="w-1/2">
                      {filesize(uploadSummary.uploadedSize)} of{" "}
                      {filesize(uploadSummary.totalSize)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 transition-all duration-300 ease-out">
                  <Button
                    variant="text"
                    className="text-inherit p-1 min-w-7"
                    isIconOnly
                    onPress={actions.toggleCollapse}
                  >
                    <IconParkOutlineDownC
                      className={clsx(
                        "transition-transform duration-200 ease-out",
                        collapse ? "rotate-180" : "rotate-0",
                      )}
                    />
                  </Button>
                  <Button
                    variant="text"
                    className="text-inherit p-1 min-w-7"
                    isIconOnly
                    onPress={actions.cancelUpload}
                  >
                    <IconParkOutlineCloseOne />
                  </Button>
                </div>
              </div>
            </div>
            <div
              className={clsx(
                "bg-surface-container-lowest rounded-b-lg border-surface-variant border-2",
                "overflow-hidden transition-all duration-200 ease-out will-change-transform",
                collapse
                  ? "opacity-0 scale-95 translate-y-0 pointer-events-none h-0"
                  : "opacity-100 scale-100 translate-y-0 pointer-events-auto max-h-80 overflow-x-auto overflow-y-auto",
                scrollbarClasses,
              )}
            >
              <div className="px-3 py-2">
                <Listbox
                  aria-label="Upload Files"
                  isVirtualized={fileIds.length > 100}
                  className="select-none"
                >
                  {topLevelFileIds.map((id) => (
                    <ListboxItem
                      className="data-[hover=true]:bg-transparent px-0"
                      key={id}
                      textValue={id}
                    >
                      <UploadFileEntry
                        id={id}
                        chunkSize={Number(settings.splitFileSize)}
                        fileIds={fileIds}
                      />
                    </ListboxItem>
                  ))}
                </Listbox>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
