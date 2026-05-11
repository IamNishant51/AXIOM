/**
 * Extension Registry - Dynamic tool management for Axiom
 * Allows tools to be added/removed at runtime
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { AgentTool } from "@axiom/agent-core";

export interface ExtensionDefinition {
	name: string;
	label: string;
	description: string;
	parameters: Record<string, any>;
	code: string;
	createdAt: number;
	updatedAt: number;
}

type ToolChangeListener = (tools: AgentTool[]) => void;

export class ExtensionRegistry {
	private tools: Map<string, AgentTool> = new Map();
	private listeners: Set<ToolChangeListener> = new Set();
	private extensionsDir: string;
	private extensions: Map<string, ExtensionDefinition> = new Map();

	constructor(extensionsDir?: string) {
		this.extensionsDir =
			extensionsDir || path.join(process.env.HOME || "", ".axiom", "extensions");
		this.ensureExtensionsDir();
	}

	/**
	 * Ensure extensions directory exists
	 */
	private ensureExtensionsDir(): void {
		if (!fs.existsSync(this.extensionsDir)) {
			fs.mkdirSync(this.extensionsDir, { recursive: true });
		}
	}

	/**
	 * Register a new tool
	 */
	registerTool(tool: AgentTool): void {
		if (this.tools.has(tool.name)) {
			console.warn(`Tool "${tool.name}" already registered, overwriting`);
		}
		this.tools.set(tool.name, tool);
		this.notifyListeners();
	}

	/**
	 * Unregister a tool
	 */
	unregisterTool(name: string): boolean {
		const deleted = this.tools.delete(name);
		if (deleted) {
			this.notifyListeners();
		}
		return deleted;
	}

	/**
	 * Get a tool by name
	 */
	getTool(name: string): AgentTool | undefined {
		return this.tools.get(name);
	}

	/**
	 * Get all registered tools
	 */
	getAllTools(): AgentTool[] {
		return Array.from(this.tools.values());
	}

	/**
	 * Get all tool names
	 */
	getToolNames(): string[] {
		return Array.from(this.tools.keys());
	}

	/**
	 * Check if a tool exists
	 */
	hasTool(name: string): boolean {
		return this.tools.has(name);
	}

	/**
	 * Subscribe to tool changes
	 */
	onToolsChange(listener: ToolChangeListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/**
	 * Notify listeners of tool changes
	 */
	private notifyListeners(): void {
		const tools = this.getAllTools();
		for (const listener of this.listeners) {
			listener(tools);
		}
	}

	/**
	 * Save an extension to disk
	 */
	async saveExtension(extension: ExtensionDefinition): Promise<void> {
		const filePath = path.join(this.extensionsDir, `${extension.name}.json`);
		extension.updatedAt = Date.now();
		await fs.promises.writeFile(filePath, JSON.stringify(extension, null, 2), "utf-8");
		this.extensions.set(extension.name, extension);
	}

	/**
	 * Load an extension from disk
	 */
	async loadExtension(name: string): Promise<ExtensionDefinition | null> {
		const filePath = path.join(this.extensionsDir, `${name}.json`);

		if (!fs.existsSync(filePath)) {
			return null;
		}

		try {
			const content = await fs.promises.readFile(filePath, "utf-8");
			const extension = JSON.parse(content) as ExtensionDefinition;
			this.extensions.set(name, extension);
			return extension;
		} catch {
			return null;
		}
	}

	/**
	 * Delete an extension from disk
	 */
	async deleteExtension(name: string): Promise<boolean> {
		const filePath = path.join(this.extensionsDir, `${name}.json`);

		if (!fs.existsSync(filePath)) {
			return false;
		}

		try {
			await fs.promises.unlink(filePath);
			this.extensions.delete(name);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * List all saved extensions
	 */
	async listExtensions(): Promise<ExtensionDefinition[]> {
		this.ensureExtensionsDir();

		try {
			const files = await fs.promises.readdir(this.extensionsDir);
			const extensions: ExtensionDefinition[] = [];

			for (const file of files) {
				if (!file.endsWith(".json")) continue;

				try {
					const content = await fs.promises.readFile(
						path.join(this.extensionsDir, file),
						"utf-8",
					);
					const extension = JSON.parse(content) as ExtensionDefinition;
					extensions.push(extension);
				} catch {
					// Skip invalid files
				}
			}

			return extensions;
		} catch {
			return [];
		}
	}

	/**
	 * Load all extensions from disk and register their tools
	 */
	async loadAllExtensions(): Promise<void> {
		const extensions = await this.listExtensions();

		for (const extension of extensions) {
			try {
				await this.instantiateExtension(extension);
			} catch (error) {
				console.error(`Failed to load extension "${extension.name}":`, error);
			}
		}
	}

	/**
	 * Instantiate an extension from its definition
	 */
	private async instantiateExtension(extension: ExtensionDefinition): Promise<void> {
		// Clean up the code - remove CommonJS exports if present
		let code = extension.code
			.replace(/^exports\s*=\s*.*?;?\s*$/gm, "")
			.replace(/^module\.exports\s*=\s*.*?;?\s*$/gm, "")
			.trim();

		let executeCode: string;

		// Check for handler pattern like { ... handler: async function(params) {} }
		if (code.startsWith("{") && code.includes("handler")) {
			// Extract the handler function
			const handlerMatch = code.match(/handler\s*:\s*(?:async\s+)?function\s*(?:\w+)?\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*\}\s*;?\s*$/);
			if (handlerMatch) {
				executeCode = `
					const __handler = ${code};
					return (async () => {
						${handlerMatch[1]}
					})();
				`;
			} else {
				throw new Error("Could not parse handler from code");
			}
		} else if (!code.includes("return") && !code.includes("function")) {
			// Simple expression pattern - wrap it in return
			executeCode = `return (async () => ${code})();`;
		} else if (!code.includes("return")) {
			// Function definition without return - add return
			executeCode = `return (async () => { ${code} })();`;
		} else {
			// Has explicit return
			executeCode = `return (async () => { ${code} })();`;
		}

		const toolDef = {
			name: extension.name,
			label: extension.label,
			description: extension.description,
			parameters: extension.parameters,
			execute: new Function(
				"toolCallId",
				"params",
				"signal",
				"onUpdate",
				`
				const context = {
					toolCallId,
					params,
					signal,
					onUpdate,
					require: (module) => {
						if (module === "fs") return require("node:fs");
						if (module === "path") return require("node:path");
						if (module === "os") return require("node:os");
						if (module === "crypto") return require("node:crypto");
						return null;
					},
					console: {
						log: (...args) => console.log("[extension]", ...args),
						error: (...args) => console.error("[extension]", ...args),
					},
				};
				${executeCode}
			`,
			),
		} as AgentTool;

		this.registerTool(toolDef);
		this.extensions.set(extension.name, extension);
	}

	/**
	 * Create a new extension from user specification
	 */
	async createExtension(params: {
		name: string;
		label: string;
		description: string;
		parameterSchema: Record<string, any>;
		code: string;
	}): Promise<ExtensionDefinition> {
		const extension: ExtensionDefinition = {
			name: params.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
			label: params.label,
			description: params.description,
			parameters: params.parameterSchema,
			code: params.code,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await this.saveExtension(extension);
		await this.instantiateExtension(extension);

		return extension;
	}

	/**
	 * Get extensions directory
	 */
	getExtensionsDir(): string {
		return this.extensionsDir;
	}
}

// Singleton instance
let registryInstance: ExtensionRegistry | null = null;

export function getExtensionRegistry(): ExtensionRegistry {
	if (!registryInstance) {
		registryInstance = new ExtensionRegistry();
	}
	return registryInstance;
}

export function createExtensionRegistry(extensionsDir?: string): ExtensionRegistry {
	registryInstance = new ExtensionRegistry(extensionsDir);
	return registryInstance;
}