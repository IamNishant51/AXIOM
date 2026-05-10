/**
 * Session Manager - JSONL-based session persistence with tree structure
 * Axiom Coding Agent
 */
import type { AgentMessage } from "@axiom/agent-core";
/**
 * Session entry (one line in the JSONL file)
 */
export interface SessionEntry {
    id: string;
    parentId?: string;
    timestamp: number;
    message: AgentMessage;
}
/**
 * Session metadata
 */
export interface SessionMetadata {
    id: string;
    workingDirectory: string;
    createdAt: number;
    updatedAt: number;
    currentBranch: string;
    currentId: string;
    title?: string;
}
/**
 * Session manager - handles session persistence
 */
export declare class SessionManager {
    private sessionsDir;
    private currentSession?;
    private entries;
    constructor(sessionsDir?: string);
    /**
     * Ensure sessions directory exists
     */
    private ensureSessionsDir;
    /**
     * Create a new session
     */
    create(workingDirectory: string, initialMessage?: string): Promise<string>;
    /**
     * Load existing session
     */
    load(sessionPathOrId: string): Promise<void>;
    /**
     * Add a message to the session
     */
    addMessage(message: AgentMessage, parentId?: string): Promise<string>;
    /**
     * Get current messages (following parent chain)
     */
    getMessages(): AgentMessage[];
    /**
     * Get all messages (including branches)
     */
    getAllMessages(): AgentMessage[];
    /**
     * Fork session from a point
     */
    fork(fromId: string): Promise<string>;
    /**
     * Navigate to a specific point in session tree
     */
    navigateTo(entryId: string): Promise<void>;
    /**
     * Get session metadata
     */
    getMetadata(): SessionMetadata | undefined;
    /**
     * List all sessions
     */
    list(): Promise<SessionMetadata[]>;
    /**
     * Delete a session
     */
    delete(sessionId: string): Promise<void>;
    /**
     * Save current session
     */
    private save;
    /**
     * Generate unique ID
     */
    private generateId;
}
//# sourceMappingURL=session-manager.d.ts.map