import { create } from 'zustand';
import type { WorkspaceFile, Activity } from '../../types';

interface BuildState {
  files: WorkspaceFile[];
  activeTab: 'preview' | 'code' | 'files';
  previewUrl: string;
  isStreamingFile: boolean;
  currentStreamingFile: string | null;
  activity: Activity;
  previewPort: number;

  // Actions
  setFiles: (files: WorkspaceFile[]) => void;
  addFile: (file: WorkspaceFile) => void;
  removeFile: (path: string) => void;
  updateFile: (path: string, updates: Partial<WorkspaceFile>) => void;
  setActiveTab: (tab: 'preview' | 'code' | 'files') => void;
  setPreviewUrl: (url: string) => void;
  setPreviewPort: (port: number) => void;
  setStreamingFile: (isStreaming: boolean, filePath?: string) => void;
  setActivity: (activity: Partial<Activity>) => void;
  reset: () => void;
}

export const useBuildStore = create<BuildState>((set) => ({
  files: [],
  activeTab: 'preview',
  previewUrl: '',
  isStreamingFile: false,
  currentStreamingFile: null,
  activity: { kind: 'idle' },
  previewPort: 3001,

  setFiles: (files) => set({ files }),

  addFile: (file) =>
    set((state) => ({
      files: [...state.files, file],
    })),

  removeFile: (path) =>
    set((state) => ({
      files: state.files.filter((f) => f.path !== path),
    })),

  updateFile: (path, updates) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.path === path ? { ...f, ...updates } : f
      ),
    })),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setPreviewUrl: (url) => set({ previewUrl: url }),

  setPreviewPort: (port) =>
    set({ previewPort: port, previewUrl: `http://localhost:${port}/` }),

  setStreamingFile: (isStreaming, filePath) =>
    set({
      isStreamingFile: isStreaming,
      currentStreamingFile: filePath || null,
    }),

  setActivity: (activity) =>
    set((state) => ({
      activity: { ...state.activity, ...activity },
    })),

  reset: () =>
    set({
      files: [],
      activeTab: 'preview',
      previewUrl: '',
      isStreamingFile: false,
      currentStreamingFile: null,
      activity: { kind: 'idle' },
    }),
}));
