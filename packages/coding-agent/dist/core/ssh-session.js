/**
 * SSH Session - SSH connection management
 * Allows remote sessions over SSH
 */
import { spawn } from "node:child_process";
/**
 * Create SSH connection configuration
 */
export function createSSHConfig(host, user, options) {
    return {
        host,
        user,
        port: options?.port || 22,
        password: options?.password,
        keyPath: options?.keyPath,
        keyPassphrase: options?.keyPassphrase,
        timeout: options?.timeout || 30000,
        keepAlive: true,
    };
}
/**
 * SSH Session Manager
 */
export class SSHSessionManager {
    sessions;
    nextId;
    constructor() {
        this.sessions = new Map();
        this.nextId = 1;
    }
    /**
     * Connect to SSH server
     */
    async connect(config) {
        const sessionId = `ssh-${this.nextId++}`;
        try {
            // Build SSH command
            const args = this.buildSSHArgs(config);
            const session = {
                id: sessionId,
                config,
                connected: false,
                startTime: Date.now(),
            };
            // For now, just create the session object
            // Full implementation would use ssh2 library
            this.sessions.set(sessionId, session);
            return {
                success: true,
                session,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Connection failed",
            };
        }
    }
    /**
     * Build SSH command arguments
     */
    buildSSHArgs(config) {
        const args = [];
        // Port
        if (config.port && config.port !== 22) {
            args.push("-p", config.port.toString());
        }
        // Timeout
        if (config.timeout) {
            args.push("-o", `ServerAliveInterval=${Math.floor(config.timeout / 1000)}`);
        }
        // Keep alive
        if (config.keepAlive) {
            args.push("-o", "ServerAliveInterval=60");
            args.push("-o", "ServerAliveCountMax=3");
        }
        // Key file
        if (config.keyPath) {
            args.push("-i", config.keyPath);
        }
        // Batch mode (no password prompt)
        args.push("-o", "BatchMode=yes");
        // Strict host key checking (ask to add)
        args.push("-o", "StrictHostKeyChecking=ask");
        // User@host
        args.push(`${config.user}@${config.host}`);
        return args;
    }
    /**
     * Execute command on SSH session
     */
    async executeCommand(sessionId, command, timeout = 30000) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.connected) {
            throw new Error("Session not connected");
        }
        const startTime = Date.now();
        // Build SSH command with remote execution
        const sshArgs = this.buildSSHArgs(session.config);
        if (Array.isArray(command)) {
            sshArgs.push(command.join(" "));
        }
        else {
            sshArgs.push(command);
        }
        return new Promise((resolve) => {
            let stdout = "";
            let stderr = "";
            const child = spawn("ssh", sshArgs, {
                stdio: ["pipe", "pipe", "pipe"],
            });
            child.stdout.on("data", (data) => {
                stdout += data.toString();
            });
            child.stderr.on("data", (data) => {
                stderr += data.toString();
            });
            child.on("close", (code) => {
                resolve({
                    stdout,
                    stderr,
                    exitCode: code ?? 0,
                    duration: Date.now() - startTime,
                });
            });
            child.on("error", (error) => {
                resolve({
                    stdout,
                    stderr: error.message,
                    exitCode: 1,
                    duration: Date.now() - startTime,
                });
            });
            // Timeout
            setTimeout(() => {
                child.kill();
                resolve({
                    stdout,
                    stderr: "Command timed out",
                    exitCode: 124,
                    duration: timeout,
                });
            }, timeout);
        });
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * List all sessions
     */
    listSessions() {
        return Array.from(this.sessions.values());
    }
    /**
     * Disconnect session
     */
    disconnect(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session?.process) {
            session.process.kill();
        }
        this.sessions.delete(sessionId);
    }
    /**
     * Disconnect all sessions
     */
    disconnectAll() {
        for (const session of this.sessions.values()) {
            if (session.process) {
                session.process.kill();
            }
        }
        this.sessions.clear();
    }
    /**
     * Reconnect session
     */
    async reconnect(sessionId) {
        const oldSession = this.sessions.get(sessionId);
        if (!oldSession) {
            return { success: false, error: "Session not found" };
        }
        this.disconnect(sessionId);
        return this.connect(oldSession.config);
    }
    /**
     * Get session stats
     */
    getStats(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        return {
            uptime: Date.now() - session.startTime,
            connected: session.connected,
        };
    }
}
/**
 * Quick SSH connect function
 */
export async function quickConnect(host, user, command, options) {
    const manager = new SSHSessionManager();
    const config = createSSHConfig(host, user, options);
    const result = await manager.connect(config);
    if (!result.success || !result.session) {
        throw new Error(result.error || "Connection failed");
    }
    return manager.executeCommand(result.session.id, Array.isArray(command) ? command.join(" ") : command, options?.timeout);
}
/**
 * SSH key fingerprint verification
 */
export async function verifyKeyFingerprint(host, keyPath) {
    try {
        const { execSync } = await import("node:child_process");
        const output = execSync(`ssh-keyscan -t rsa,ed25519 -p 22 ${host} 2>/dev/null | ssh-keygen -lf -`, { encoding: "utf-8" });
        return output.trim();
    }
    catch {
        return null;
    }
}
/**
 * Generate SSH config string
 */
export function generateSSHConfig(sessions) {
    let config = "# SSH Config for Axiom\n\n";
    for (const session of sessions) {
        config += `Host axiom-${session.id}\n`;
        config += `  HostName ${session.config.host}\n`;
        config += `  User ${session.config.user}\n`;
        if (session.config.port && session.config.port !== 22) {
            config += `  Port ${session.config.port}\n`;
        }
        if (session.config.keyPath) {
            config += `  IdentityFile ${session.config.keyPath}\n`;
        }
        config += "\n";
    }
    return config;
}
//# sourceMappingURL=ssh-session.js.map