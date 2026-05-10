/**
 * Session Manager - JSONL-based session persistence with tree structure
 * Axiom Coding Agent
 */

import * as fs from "node:fs";
import * as path from "node:path";
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
export class SessionManager {
	private sessionsDir: string;
	private currentSession?: SessionMetadata;
	private entries: SessionEntry[] = [];

	constructor(sessionsDir?: string) {
		this.sessionsDir = sessionsDir || path.join(process.env.HOME || "", ".axiom", "agent", "sessions");
		this.ensureSessionsDir();
	}

	/**
	 * Ensure sessions directory exists
	 */
	private ensureSessionsDir(): void {
		fs.mkdirSync(this.sessionsDir, { recursive: true });
	}

	/**
	 * Create a new session
	 */
	async create(workingDirectory: string, initialMessage?: string): Promise<string> {
		const sessionId = this.generateId();
		const now = Date.now();

		this.currentSession = {
			id: sessionId,
			workingDirectory,
			createdAt: now,
			updatedAt: now,
			currentBranch: sessionId,
			currentId: sessionId,
			title: initialMessage?.slice(0, 50),
		};

		this.entries = [];

		// Save initial entry
		if (initialMessage) {
			await this.addMessage({
				role: "user",
				content: initialMessage,
				timestamp: now,
			} as AgentMessage);
		}

		return sessionId;
	}

	/**
	 * Load existing session
	 */
	async load(sessionPathOrId: string): Promise<void> {
		// Find session file
		let sessionPath: string;
		if (sessionPathOrId.includes("/") || sessionPathOrId.includes("\\")) {
			sessionPath = sessionPathOrId;
		} else {
			// Search by ID
			const files = fs.readdirSync(this.sessionsDir);
			sessionPath = files.find((f) => f.includes(sessionPathOrId)) || "";
			if (sessionPath) {
				sessionPath = path.join(this.sessionsDir, sessionPath);
			}
		}

		if (!sessionPath || !fs.existsSync(sessionPath)) {
			throw new Error(`Session not found: ${sessionPathOrId}`);
		}

		// Load session
		const content = await fs.promises.readFile(sessionPath, "utf-8");
		const lines = content.split("\n").filter((l) => l.trim());

		this.entries = [];
		for (const line of lines) {
			try {
				this.entries.push(JSON.parse(line));
			} catch {
				// Skip invalid lines
			}
		}

		// Load metadata from first entry or separate file
		if (this.entries.length > 0) {
			const metadataPath = sessionPath.replace(".jsonl", ".meta.json");
			if (fs.existsSync(metadataPath)) {
				this.currentSession = JSON.parse(await fs.promises.readFile(metadataPath, "utf-8"));
			}
		}
	}

	/**
	 * Add a message to the session
	 */
	async addMessage(message: AgentMessage, parentId?: string): Promise<string> {
		const entry: SessionEntry = {
			id: this.generateId(),
			parentId: parentId || this.currentSession?.currentId,
			timestamp: Date.now(),
			message,
		};

		this.entries.push(entry);

		// Update current position
		if (this.currentSession) {
			this.currentSession.currentId = entry.id;
			this.currentSession.updatedAt = entry.timestamp;
		}

		// Auto-save
		await this.save();

		return entry.id;
	}

	/**
	 * Get current messages (following parent chain)
	 */
	getMessages(): AgentMessage[] {
		if (!this.currentSession) return [];

		const messages: AgentMessage[] = [];
		let currentId: string | undefined = this.currentSession.currentId;

		// Build map for quick lookup
		const entryMap = new Map<string, SessionEntry>();
		for (const entry of this.entries) {
			entryMap.set(entry.id, entry);
		}

		// Follow parent chain
		while (currentId) {
			const entry = entryMap.get(currentId);
			if (!entry) break;

			messages.unshift(entry.message);
			currentId = entry.parentId || undefined;
		}

		return messages;
	}

	/**
	 * Get all messages (including branches)
	 */
	getAllMessages(): AgentMessage[] {
		return this.entries.map((e) => e.message);
	}

	/**
	 * Fork session from a point
	 */
	async fork(fromId: string): Promise<string> {
		if (!this.currentSession) {
			throw new Error("No active session");
		}

		const newSessionId = this.generateId();
		const now = Date.now();

		// Find the entry to fork from
		const forkEntry = this.entries.find((e) => e.id === fromId);
		if (!forkEntry) {
			throw new Error(`Entry not found: ${fromId}`);
		}

		// Update metadata
		this.currentSession = {
			...this.currentSession,
			id: newSessionId,
			createdAt: now,
			updatedAt: now,
			currentBranch: newSessionId,
			currentId: newSessionId,
			title: `Fork of ${this.currentSession.title}`,
		};

		// Keep entries from fork point onward
		const forkIndex = this.entries.findIndex((e) => e.id === fromId);
		this.entries = this.entries.slice(forkIndex).map((e) => ({
			...e,
			id: this.generateId(),
			parentId: undefined,
			timestamp: now,
		}));

		await this.save();

		return newSessionId;
	}

	/**
	 * Navigate to a specific point in session tree
	 */
	async navigateTo(entryId: string): Promise<void> {
		if (!this.currentSession) {
			throw new Error("No active session");
		}

		this.currentSession.currentId = entryId;
		await this.save();
	}

	/**
	 * Get session metadata
	 */
	getMetadata(): SessionMetadata | undefined {
		return this.currentSession;
	}

	/**
	 * List all sessions
	 */
	async list(): Promise<SessionMetadata[]> {
		const files = fs.readdirSync(this.sessionsDir).filter((f) => f.endsWith(".meta.json"));
		const sessions: SessionMetadata[] = [];

		for (const file of files) {
			try {
				const content = await fs.promises.readFile(path.join(this.sessionsDir, file), "utf-8");
				sessions.push(JSON.parse(content));
			} catch {
				// Skip invalid files
			}
		}

		return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
	}

	/**
	 * Delete a session
	 */
	async delete(sessionId: string): Promise<void> {
		const baseName = sessionId.slice(0, 8);
		const jsonlFile = path.join(this.sessionsDir, `${baseName}.jsonl`);
		const metaFile = path.join(this.sessionsDir, `${baseName}.meta.json`);

		if (fs.existsSync(jsonlFile)) {
			await fs.promises.unlink(jsonlFile);
		}
		if (fs.existsSync(metaFile)) {
			await fs.promises.unlink(metaFile);
		}
	}

	/**
	 * Save current session
	 */
	private async save(): Promise<void> {
		if (!this.currentSession) return;

		const baseName = this.currentSession.id.slice(0, 8);
		const jsonlPath = path.join(this.sessionsDir, `${baseName}.jsonl`);
		const metaPath = path.join(this.sessionsDir, `${baseName}.meta.json`);

		// Write JSONL
		const jsonlContent = this.entries.map((e) => JSON.stringify(e)).join("\n");
		await fs.promises.writeFile(jsonlPath, jsonlContent, "utf-8");

		// Write metadata
		await fs.promises.writeFile(metaPath, JSON.stringify(this.currentSession, null, 2), "utf-8");
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
	}
}