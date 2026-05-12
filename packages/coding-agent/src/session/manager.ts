/**
 * Session Manager - Coordinates storage, memory, and agent
 */

import {
  initDb,
  createSession,
  getSession,
  listSessions,
  addMessage,
  getSessionMessages,
  completeMessage,
  updateSession,
  deleteSession,
  getSessionForks,
  generateForkTitle,
  type Session,
  type Message,
  type SessionWithMessages,
} from "../storage/index.js";
import { getMemoryService, type MemoryService } from "../memory/index.js";

// Initialize database on module load
initDb();

export interface SessionManager {
  // Session management
  createSession(model: string, parentId?: string): Session;
  getCurrentSession(): Session | null;
  setCurrentSession(sessionId: string): void;
  loadSession(sessionId: string): SessionWithMessages | null;
  listAllSessions(): Session[];
  deleteCurrentSession(): void;

  // Message management
  addUserMessage(content: string): Message;
  addAssistantMessage(parts: { type: string; content: string; toolName?: string; toolResult?: string }[]): Message;
  completeCurrentMessage(): void;

  // Session forking
  forkCurrentSession(): Session;

  // Memory integration
  getMemory(): MemoryService;
}

let currentSessionId: string | null = null;

export function createSessionManager(): SessionManager {
  return {
    createSession(model: string, parentId?: string): Session {
      const session = createSession({
        model,
        parentId,
        title: parentId ? generateForkTitle(getSession(parentId)!) : `Session ${new Date().toLocaleString()}`,
      });
      currentSessionId = session.id;
      return session;
    },

    getCurrentSession(): Session | null {
      if (!currentSessionId) return null;
      return getSession(currentSessionId);
    },

    setCurrentSession(sessionId: string): void {
      currentSessionId = sessionId;
    },

    loadSession(sessionId: string): SessionWithMessages | null {
      const session = getSession(sessionId);
      if (!session) return null;

      const messages = getSessionMessages(sessionId);
      currentSessionId = sessionId;

      return { ...session, messages };
    },

    listAllSessions(): Session[] {
      return listSessions();
    },

    deleteCurrentSession(): void {
      if (currentSessionId) {
        deleteSession(currentSessionId);
        currentSessionId = null;
      }
    },

    addUserMessage(content: string): Message {
      if (!currentSessionId) {
        const session = createSession({ model: "opencode" });
        currentSessionId = session.id;
      }
      return addMessage(currentSessionId, "user", [{ type: "text", content }]);
    },

    addAssistantMessage(parts: { type: string; content: string; toolName?: string; toolResult?: string }[]): Message {
      if (!currentSessionId) {
        const session = createSession({ model: "opencode" });
        currentSessionId = session.id;
      }
      return addMessage(currentSessionId, "assistant", parts.map(p => ({
        type: p.type as any,
        content: p.content,
        toolName: p.toolName,
        toolResult: p.toolResult,
      })));
    },

    completeCurrentMessage(): void {
      // This would need the message ID - simplified for now
    },

    forkCurrentSession(): Session {
      if (!currentSessionId) {
        return createSession({ model: "opencode" });
      }

      const parent = getSession(currentSessionId);
      if (!parent) {
        return createSession({ model: "opencode" });
      }

      return createSession({
        model: parent.model,
        parentId: currentSessionId,
        title: generateForkTitle(parent),
      });
    },

    getMemory(): MemoryService {
      return getMemoryService();
    },
  };
}

// Singleton instance
let sessionManager: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManager) {
    sessionManager = createSessionManager();
  }
  return sessionManager;
}