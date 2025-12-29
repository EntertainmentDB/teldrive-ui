import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export enum FileUploadStatus {
  NOT_STARTED = 0,
  UPLOADING = 1,
  UPLOADED = 2,
  CANCELLED = 3,
  FAILED = 4,
  SKIPPED = 5,
}

export interface UploadFile {
  id: string;
  file: File;
  status: FileUploadStatus;
  totalChunks: number;
  controller: AbortController;
  progress: number;
  relativePath?: string;
  parentFolderId?: string;
  isFolder: boolean;
  folderId?: string;
  speed?: number;
  eta?: number;
  chunksCompleted?: number;
  error?: string;
  collapsed?: boolean;
}

export interface UploadState {
  filesIds: string[];
  fileMap: Record<string, UploadFile>;
  currentFileId: string;
  collapse: boolean;
  fileDialogOpen: boolean;
  folderDialogOpen: boolean;
  uploadOpen: boolean;
  actions: {
    addFiles: (files: File[]) => void;
    addFolder: (files: File[], folderName: string) => void;
    setCurrentFileId: (id: string) => void;
    toggleCollapse: () => void;
    setFileUploadStatus: (id: string, status: FileUploadStatus) => void;
    removeFile: (id: string) => void;
    cancelUpload: () => void;
    setFileDialogOpen: (open: boolean) => void;
    setFolderDialogOpen: (open: boolean) => void;
    setUploadOpen: (open: boolean) => void;
    setProgress: (id: string, progress: number) => void;
    setSpeed: (id: string, speed: number) => void;
    setETA: (id: string, eta: number) => void;
    setChunksCompleted: (id: string, chunks: number) => void;
    setError: (id: string, error: string) => void;
    setFolderId: (id: string, folderId: string) => void;
    toggleFolderCollapsed: (id: string) => void;
    startNextUpload: () => void;
    clearAll: () => void;
  };
}

export const useFileUploadStore = create<UploadState>()(
  immer((set) => ({
    filesIds: [],
    fileMap: {},
    currentFileId: "",
    collapse: false,
    fileDialogOpen: false,
    folderDialogOpen: false,
    uploadOpen: false,
    actions: {
      addFiles: (files: File[]) =>
        set((state) => {
          const newFiles = files.map((file) => ({
            id: Math.random().toString(36).slice(2, 9),
            file,
            status: FileUploadStatus.NOT_STARTED,
            totalChunks: 0,
            controller: new AbortController(),
            progress: 0,
            isFolder: false,
            speed: 0,
            collapsed: false,
          }));

          const ids = newFiles.map((file) => {
            state.fileMap[file.id] = file;
            return file.id;
          });
          state.filesIds.push(...ids);
          if (!state.currentFileId) {
            state.currentFileId = ids[0];
          } else {
            const currentFile = state.fileMap[state.currentFileId];
            // Update currentFileId if current file is not actively uploading
            const isCurrentFileActive =
              currentFile.status === FileUploadStatus.NOT_STARTED ||
              currentFile.status === FileUploadStatus.UPLOADING;
            if (!isCurrentFileActive) {
              state.currentFileId = ids[0];
            }
          }
        }),

      addFolder: (files: File[], folderName: string) =>
        set((state) => {
          const folderId = Math.random().toString(36).slice(2, 9);
          const folderFile = new File([], folderName, { type: "folder" });

          state.fileMap[folderId] = {
            id: folderId,
            file: folderFile,
            status: FileUploadStatus.NOT_STARTED,
            totalChunks: 0,
            controller: new AbortController(),
            progress: 0,
            isFolder: true,
            speed: 0,
            collapsed: false,
          };

          const newFiles = files.map((file) => ({
            id: Math.random().toString(36).slice(2, 9),
            file,
            status: FileUploadStatus.NOT_STARTED,
            totalChunks: 0,
            controller: new AbortController(),
            progress: 0,
            isFolder: false,
            parentFolderId: folderId,
            relativePath: file.webkitRelativePath,
            speed: 0,
            collapsed: false,
          }));

          state.filesIds.push(folderId);
          newFiles.forEach((file) => {
            state.fileMap[file.id] = file;
            state.filesIds.push(file.id);
          });

          if (!state.currentFileId) {
            state.currentFileId = folderId;
          }
        }),

      setProgress: (id: string, progress: number) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].progress = progress;
        }),
      setSpeed: (id: string, speed: number) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].speed = speed;
        }),
      setETA: (id: string, eta: number) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].eta = eta;
        }),
      setChunksCompleted: (id: string, chunks: number) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].chunksCompleted = chunks;
        }),
      setError: (id: string, error: string) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].error = error;
        }),
      clearAll: () =>
        set((state) => {
          const completedIds = state.filesIds.filter(
            (id) =>
              state.fileMap[id]?.status === FileUploadStatus.UPLOADED ||
              state.fileMap[id]?.status === FileUploadStatus.CANCELLED ||
              state.fileMap[id]?.status === FileUploadStatus.FAILED ||
              state.fileMap[id]?.status === FileUploadStatus.SKIPPED,
          );
          completedIds.forEach((id) => {
            delete state.fileMap[id];
          });
          state.filesIds = state.filesIds.filter((id) => !completedIds.includes(id));
          if (state.filesIds.length === 0) {
            state.currentFileId = "";
            state.collapse = false;
            state.uploadOpen = false;
          }
        }),
      setFolderId: (id: string, folderId: string) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].folderId = folderId;
        }),
      toggleFolderCollapsed: (id: string) =>
        set((state) => {
          if (state.fileMap[id]?.isFolder) {
            state.fileMap[id].collapsed = !state.fileMap[id].collapsed;
          }
        }),
      setFileUploadStatus: (id: string, status: FileUploadStatus) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].status = status;
        }),
      setFolderDialogOpen: (open: boolean) =>
        set((state) => {
          state.folderDialogOpen = open;
        }),

      setCurrentFileId: (id: string) =>
        set((state) => {
          state.currentFileId = id;
        }),

      removeFile: (id: string) =>
        set((state) => {
          const file = state.fileMap[id];

          if (file?.controller && file.status !== FileUploadStatus.CANCELLED) {
            file.controller.abort();
          }

          const wasCurrentFile = state.currentFileId === id;

          if (file?.isFolder) {
            const childrenIds = state.filesIds.filter(
              (fileId) => state.fileMap[fileId]?.parentFolderId === id,
            );
            childrenIds.forEach((childId) => {
              const childFile = state.fileMap[childId];
              if (childFile?.controller && childFile.status !== FileUploadStatus.CANCELLED) {
                childFile.controller.abort();
              }
              state.fileMap[childId].status = FileUploadStatus.CANCELLED;
            });
            state.fileMap[id].status = FileUploadStatus.CANCELLED;
          } else {
            state.fileMap[id].status = FileUploadStatus.CANCELLED;
          }

          if (state.filesIds.length === 0) {
            state.currentFileId = "";
            state.collapse = false;
            state.uploadOpen = false;
            state.fileDialogOpen = false;
            state.folderDialogOpen = false;
          } else if (wasCurrentFile) {
            const nextFileIndex = state.filesIds.findIndex(
              (fileId) => state.fileMap[fileId]?.status === FileUploadStatus.NOT_STARTED,
            );
            if (nextFileIndex !== -1) {
              state.currentFileId = state.filesIds[nextFileIndex];
            } else {
              state.currentFileId = "";
            }
          }
        }),

      cancelUpload: () =>
        set((state) => {
          const file = state.fileMap[state.currentFileId];
          if (file?.controller) {
            file.controller.abort();
          }
          state.fileMap = {};
          state.filesIds = [];
          state.currentFileId = "";
          state.collapse = false;
          state.uploadOpen = false;
          state.fileDialogOpen = false;
          state.folderDialogOpen = false;
        }),
      toggleCollapse: () =>
        set((state) => {
          state.collapse = !state.collapse;
        }),
      setFileDialogOpen: (open: boolean) =>
        set((state) => {
          state.fileDialogOpen = open;
        }),
      setUploadOpen: (open: boolean) =>
        set((state) => {
          state.uploadOpen = open;
        }),
      startNextUpload: () =>
        set((state) => {
          const eligibleFiles = state.filesIds.filter((id) => {
            const file = state.fileMap[id];
            // Skip if already processed
            if (file.status !== FileUploadStatus.NOT_STARTED) return false;

            // If file has parent folder, check if parent is uploaded/skipped
            if (file.parentFolderId) {
              const parent = state.fileMap[file.parentFolderId];
              return (
                parent &&
                (parent.status === FileUploadStatus.UPLOADED ||
                  parent.status === FileUploadStatus.SKIPPED)
              );
            }

            return true; // No dependencies, eligible
          });

          state.currentFileId = eligibleFiles[0] || "";
        }),
    },
  })),
);
