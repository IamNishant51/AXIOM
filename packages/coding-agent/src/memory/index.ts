/**
 * Memory Service for Axiom
 * Manages long-term memory with automatic saving and retrieval
 */

import { setMemory, getMemory, searchMemory, deleteMemory, clearMemory, type MemoryItem } from "../storage/index.js";

// Auto-save important context
const CONTEXT_KEYS = {
  PROJECT_CONTEXT: "project_context",
  USER_PREFERENCES: "user_preferences",
  RECENT_FILES: "recent_files",
  CUSTOM_INSTRUCTIONS: "custom_instructions",
};

export interface MemoryService {
  // Save project context
  saveProjectContext(context: string): void;

  // Get project context
  getProjectContext(): string | undefined;

  // Save user preferences
  savePreferences(preferences: Record<string, any>): void;

  // Get user preferences
  getPreferences(): Record<string, any>;

  // Auto-save important context
  autoSave(key: string, value: string): void;

  // Get auto-saved context
  autoGet(key: string): string | undefined;

  // Search memory
  search(query: string, limit?: number): MemoryItem[];

  // Delete memory
  forget(key: string): void;

  // Clear all memory
  clear(): void;
}

export function createMemoryService(): MemoryService {
  return {
    saveProjectContext(context: string) {
      setMemory(CONTEXT_KEYS.PROJECT_CONTEXT, context, ["project", "context"]);
    },

    getProjectContext() {
      return getMemory(CONTEXT_KEYS.PROJECT_CONTEXT);
    },

    savePreferences(preferences: Record<string, any>) {
      setMemory(CONTEXT_KEYS.USER_PREFERENCES, JSON.stringify(preferences), ["preferences", "user"]);
    },

    getPreferences(): Record<string, any> {
      const data = getMemory(CONTEXT_KEYS.USER_PREFERENCES);
      if (!data) return {};
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    },

    autoSave(key: string, value: string) {
      setMemory(`auto_${key}`, value, ["auto", key]);
    },

    autoGet(key: string): string | undefined {
      return getMemory(`auto_${key}`);
    },

    search(query: string, limit = 10): MemoryItem[] {
      return searchMemory(query, limit);
    },

    forget(key: string) {
      deleteMemory(key);
    },

    clear() {
      clearMemory();
    },
  };
}

// Singleton instance
let memoryService: MemoryService | null = null;

export function getMemoryService(): MemoryService {
  if (!memoryService) {
    memoryService = createMemoryService();
  }
  return memoryService;
}

export { CONTEXT_KEYS };