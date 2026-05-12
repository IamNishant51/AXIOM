/**
 * Live File Streaming System for Axiom
 * Streams file content updates to UI in real-time
 */

import { wsWriteFile, ensureWorkspace, type FileEntry } from "../workspace/index.js";
import { cleanFileContent } from "../workspace/index.js";

export interface StreamState {
  livePath: string | null;
  liveContentStart: number;
  lastLiveWrite: number;
  lastEmittedContent: string;
  pending: Promise<unknown> | null;
}

export interface StreamCallbacks {
  onFileStreaming: (data: { path: string; content: string; done: boolean }) => void;
  onWorkspaceChanged: () => void;
  onActivityUpdate: (activity: { kind: string; tool?: string; target?: string; chars?: number }) => void;
}

// Write live partial to disk (called every 450ms during streaming)
export async function writeLivePartial(
  conversationId: string,
  buffer: string,
  state: StreamState,
  callbacks: StreamCallbacks
): Promise<void> {
  if (!state.livePath || state.liveContentStart < 0 || state.pending) return;

  let partial = buffer.slice(state.liveContentStart);
  if (partial.startsWith("\n")) partial = partial.slice(1);

  const closeIdx = partial.indexOf("</content>");
  if (closeIdx >= 0) partial = partial.slice(0, closeIdx);

  const cleaned = cleanFileContent(partial, state.livePath);

  if (cleaned !== state.lastEmittedContent) {
    state.lastEmittedContent = cleaned;
    callbacks.onFileStreaming({
      path: state.livePath,
      content: cleaned,
      done: false
    });
  }

  state.pending = wsWriteFile(conversationId, state.livePath, cleaned)
    .then(() => {
      callbacks.onWorkspaceChanged();
    })
    .catch(() => {
      // tolerate partial write failures
    })
    .finally(() => {
      state.pending = null;
    });
}

// Detect if streaming has started
export function detectStreamStart(
  buffer: string,
  state: StreamState,
  emittedIdx: number
): void {
  if (!state.pending) {
    const openMatch = buffer.slice(emittedIdx).match(/<action\s+name\s*=\s*["']?([a-zA-Z_][\w]*)["']?\s*>/i);
    if (openMatch && openMatch[1] === "write_file") {
      const rest = buffer.slice(emittedIdx + (openMatch.index ?? 0));
      const pathM = rest.match(/<path>([^<]+?)<\/path>/i);
      if (pathM?.[1]) {
        state.livePath = pathM[1];
      }
    }
  }

  if (state.livePath && state.liveContentStart < 0) {
    const idx = buffer.indexOf("<content>");
    if (idx >= 0) {
      state.liveContentStart = idx + "<content>".length;
    }
  }
}

// Complete streaming and emit final update
export async function completeStreaming(
  conversationId: string,
  state: StreamState,
  callbacks: StreamCallbacks
): Promise<void> {
  if (state.livePath) {
    callbacks.onFileStreaming({
      path: state.livePath,
      content: state.lastEmittedContent,
      done: true
    });
  }
  state.livePath = null;
  state.liveContentStart = -1;
  state.lastEmittedContent = "";
}

// Reset streaming state
export function resetStreamState(): StreamState {
  return {
    livePath: null,
    liveContentStart: -1,
    lastLiveWrite: 0,
    lastEmittedContent: "",
    pending: null
  };
}

// Create stream manager for a conversation
export function createStreamManager(conversationId: string, callbacks: StreamCallbacks) {
  let state = resetStreamState();

  return {
    detectStart(buffer: string, emittedIdx: number): void {
      detectStreamStart(buffer, state, emittedIdx);
    },

    async writePartial(buffer: string): Promise<void> {
      const now = Date.now();
      if (now - state.lastLiveWrite > 450) {
        state.lastLiveWrite = now;
        await writeLivePartial(conversationId, buffer, state, callbacks);
      }
    },

    async complete(): Promise<void> {
      await completeStreaming(conversationId, state, callbacks);
    },

    reset(): void {
      state = resetStreamState();
    },

    getState(): StreamState {
      return state;
    },

    isStreaming(): boolean {
      return state.livePath !== null;
    }
  };
}

export type StreamManager = ReturnType<typeof createStreamManager>;