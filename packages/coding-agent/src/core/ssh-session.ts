/**
 * SSH Session - SSH connection management
 * Allows remote sessions over SSH
 */

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

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
export function createSSHConfig(
	host: string,
	user: string,
	options?: {
		port?: number;
		password?: string;
		keyPath?: string;
		keyPassphrase?: string;
		timeout?: number;
	}
): SSHConfig {
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
	private sessions: Map<string, SSHSession>;
	private nextId: number;

	constructor() {
		this.sessions = new Map();
		this.nextId = 1;
	}

	/**
	 * Connect to SSH server
	 */
	async connect(config: SSHConfig): Promise<SSHConnectionResult> {
		const sessionId = `ssh-${this.nextId++}`;

		try {
			// Build SSH command
			const args = this.buildSSHArgs(config);

			const session: SSHSession = {
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
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Connection failed",
			};
		}
	}

	/**
	 * Build SSH command arguments
	 */
	private buildSSHArgs(config: SSHConfig): string[] {
		const args: string[] = [];

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
	async executeCommand(
		sessionId: string,
		command: string,
		timeout: number = 30000
	): Promise<SSHCommandResult> {
		const session = this.sessions.get(sessionId);
		if (!session || !session.connected) {
			throw new Error("Session not connected");
		}

		const startTime = Date.now();

		// Build SSH command with remote execution
		const sshArgs = this.buildSSHArgs(session.config);
		if (Array.isArray(command)) {
			sshArgs.push(command.join(" "));
		} else {
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
	getSession(sessionId: string): SSHSession | undefined {
		return this.sessions.get(sessionId);
	}

	/**
	 * List all sessions
	 */
	listSessions(): SSHSession[] {
		return Array.from(this.sessions.values());
	}

	/**
	 * Disconnect session
	 */
	disconnect(sessionId: string): void {
		const session = this.sessions.get(sessionId);
		if (session?.process) {
			session.process.kill();
		}
		this.sessions.delete(sessionId);
	}

	/**
	 * Disconnect all sessions
	 */
	disconnectAll(): void {
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
	async reconnect(sessionId: string): Promise<SSHConnectionResult> {
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
	getStats(sessionId: string): { uptime: number; connected: boolean } | null {
		const session = this.sessions.get(sessionId);
		if (!session) return null;

		return {
			uptime: Date.now() - session.startTime,
			connected: session.connected,
		};
	}
}

/**
 * Quick SSH connect function
 */
export async function quickConnect(
	host: string,
	user: string,
	command: string[],
	options?: {
		port?: number;
		password?: string;
		keyPath?: string;
		timeout?: number;
	}
): Promise<SSHCommandResult> {
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
export async function verifyKeyFingerprint(
	host: string,
	keyPath: string
): Promise<string | null> {
	try {
		const { execSync } = await import("node:child_process");
		const output = execSync(
			`ssh-keyscan -t rsa,ed25519 -p 22 ${host} 2>/dev/null | ssh-keygen -lf -`,
			{ encoding: "utf-8" }
		);
		return output.trim();
	} catch {
		return null;
	}
}

/**
 * Generate SSH config string
 */
export function generateSSHConfig(sessions: SSHSession[]): string {
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