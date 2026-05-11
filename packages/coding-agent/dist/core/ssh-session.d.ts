/**
 * SSH Session - SSH connection management
 * Allows remote sessions over SSH
 */
import { type ChildProcessWithoutNullStreams } from "node:child_process";
export interface SSHConfig {
    host: string;
    port?: number;
    user: string;
    password?: string;
    keyPath?: string;
    keyPassphrase?: string;
    timeout?: number;
    keepAlive?: boolean;
}
export interface SSHSession {
    id: string;
    config: SSHConfig;
    connected: boolean;
    startTime: number;
    process?: ChildProcessWithoutNullStreams;
}
export interface SSHConnectionResult {
    success: boolean;
    session?: SSHSession;
    error?: string;
}
export interface SSHCommandResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    duration: number;
}
/**
 * Create SSH connection configuration
 */
export declare function createSSHConfig(host: string, user: string, options?: {
    port?: number;
    password?: string;
    keyPath?: string;
    keyPassphrase?: string;
    timeout?: number;
}): SSHConfig;
/**
 * SSH Session Manager
 */
export declare class SSHSessionManager {
    private sessions;
    private nextId;
    constructor();
    /**
     * Connect to SSH server
     */
    connect(config: SSHConfig): Promise<SSHConnectionResult>;
    /**
     * Build SSH command arguments
     */
    private buildSSHArgs;
    /**
     * Execute command on SSH session
     */
    executeCommand(sessionId: string, command: string, timeout?: number): Promise<SSHCommandResult>;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): SSHSession | undefined;
    /**
     * List all sessions
     */
    listSessions(): SSHSession[];
    /**
     * Disconnect session
     */
    disconnect(sessionId: string): void;
    /**
     * Disconnect all sessions
     */
    disconnectAll(): void;
    /**
     * Reconnect session
     */
    reconnect(sessionId: string): Promise<SSHConnectionResult>;
    /**
     * Get session stats
     */
    getStats(sessionId: string): {
        uptime: number;
        connected: boolean;
    } | null;
}
/**
 * Quick SSH connect function
 */
export declare function quickConnect(host: string, user: string, command: string[], options?: {
    port?: number;
    password?: string;
    keyPath?: string;
    timeout?: number;
}): Promise<SSHCommandResult>;
/**
 * SSH key fingerprint verification
 */
export declare function verifyKeyFingerprint(host: string, keyPath: string): Promise<string | null>;
/**
 * Generate SSH config string
 */
export declare function generateSSHConfig(sessions: SSHSession[]): string;
//# sourceMappingURL=ssh-session.d.ts.map