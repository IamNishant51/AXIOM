import { create } from 'zustand';
import type { AxiomSettings, AgentMode } from '../../types';

interface SettingsState {
  settings: AxiomSettings;
  mode: AgentMode;
  isSidebarOpen: boolean;

  // Actions
  updateSettings: (settings: Partial<AxiomSettings>) => void;
  setMode: (mode: AgentMode) => void;
  toggleMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  reset: () => void;
}

const defaultSettings: AxiomSettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'Inter',
  showThinking: true,
  autoPreview: true,
  workspacePath: '~/.axiom/workspaces',
  apiProvider: 'opencode',
  model: 'opencode',
  maxTokens: 4000,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  mode: 'chat',
  isSidebarOpen: true,

  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),

  setMode: (mode) => set({ mode }),

  toggleMode: () =>
    set((state) => ({
      mode: state.mode === 'chat' ? 'build' : 'chat',
    })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  reset: () =>
    set({
      settings: defaultSettings,
      mode: 'chat',
      isSidebarOpen: true,
    }),
}));
