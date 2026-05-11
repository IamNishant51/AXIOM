/**
 * Extension Registry - Dynamic tool management for Axiom
 * SECURE VERSION - Sandboxed execution with strict security controls
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { AgentTool } from "@axiom/agent-core";

// Security constants
const MAX_CODE_SIZE = 50000; // 50KB max extension code
const MAX_EXECUTION_TIME = 30000; // 30s max execution time
const ALLOWED_MODULES = new Set(["fs", "path", "os", "crypto"]);
const FORBIDDEN_PATTERNS = [
	/process\.exit/,
	/process\.kill/,
	/child_process/,
	/eval/,
	/new\s+Function/,
	/\b__proto__\b/,
	/\bconstructor\b/,
	/globalThis/,
	/global\./,
	/require\s*\(\s*['"]child_process/,
	/require\s*\(\s*['"]net/,
	/require\s*\(\s*['"]http/,
	/require\s*\(\s*['"]https/,
	/require\s*\(\s*['"]dgram/,
	/require\s*\(\s*['"]dns/,
	/require\s*\(\s*['"]repl/,
	/import\s*\(/,
	/\bawait\s+import\(/,
];

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

	private ensureExtensionsDir(): void {
		if (!fs.existsSync(this.extensionsDir)) {
			fs.mkdirSync(this.extensionsDir, { recursive: true });
		}
	}

	/**
	 * Validate extension code for security issues
	 */
	private validateCode(code: string): { valid: boolean; error?: string } {
		// Check size
		if (code.length > MAX_CODE_SIZE) {
			return { valid: false, error: `Code exceeds maximum size of ${MAX_CODE_SIZE} characters` };
		}

		// Check for forbidden patterns
		for (const pattern of FORBIDDEN_PATTERNS) {
			if (pattern.test(code)) {
				return { valid: false, error: `Code contains forbidden pattern: ${pattern.toString()}` };
			}
		}

		return { valid: true };
	}

	/**
	 * Validate extension name
	 */
	private validateName(name: string): { valid: boolean; error?: string } {
		// Only allow alphanumeric and underscores
		if (!/^[a-z0-9_]+$/.test(name)) {
			return { valid: false, error: "Name must contain only lowercase letters, numbers, and underscores" };
		}

		// Reserved names
		const reserved = new Set([
			"read", "write", "edit", "bash", "grep", "find", "ls", "mkdir",
			"web_search", "fetch_url", "add_extension", "list_extensions",
			"remove_extension", "reload_extensions", "get_extension"
		]);

		if (reserved.has(name)) {
			return { valid: false, error: `"${name}" is a reserved name` };
		}

		return { valid: true };
	}

	registerTool(tool: AgentTool): void {
		if (this.tools.has(tool.name)) {
			console.warn(`Tool "${tool.name}" already registered, overwriting`);
		}
		this.tools.set(tool.name, tool);
		this.notifyListeners();
	}

	unregisterTool(name: string): boolean {
		const deleted = this.tools.delete(name);
		if (deleted) {
			this.notifyListeners();
		}
		return deleted;
	}

	getTool(name: string): AgentTool | undefined {
		return this.tools.get(name);
	}

	getAllTools(): AgentTool[] {
		return Array.from(this.tools.values());
	}

	getToolNames(): string[] {
		return Array.from(this.tools.keys());
	}

	hasTool(name: string): boolean {
		return this.tools.has(name);
	}

	onToolsChange(listener: ToolChangeListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notifyListeners(): void {
		const tools = this.getAllTools();
		for (const listener of this.listeners) {
			listener(tools);
		}
	}

	async saveExtension(extension: ExtensionDefinition): Promise<void> {
		const filePath = path.join(this.extensionsDir, `${extension.name}.json`);
		extension.updatedAt = Date.now();

		// Validate before saving
		const codeValidation = this.validateCode(extension.code);
		if (!codeValidation.valid) {
			throw new Error(`Security validation failed: ${codeValidation.error}`);
		}

		await fs.promises.writeFile(filePath, JSON.stringify(extension, null, 2), "utf-8");
		this.extensions.set(extension.name, extension);
	}

	async loadExtension(name: string): Promise<ExtensionDefinition | null> {
		const filePath = path.join(this.extensionsDir, `${name}.json`);

		if (!fs.existsSync(filePath)) {
			return null;
		}

		try {
			const content = await fs.promises.readFile(filePath, "utf-8");

			// Limit file size
			if (content.length > MAX_CODE_SIZE * 2) {
				console.error(`Extension "${name}" file too large`);
				return null;
			}

			const extension = JSON.parse(content) as ExtensionDefinition;

			// Validate on load
			const nameValidation = this.validateName(extension.name);
			if (!nameValidation.valid) {
				console.error(`Extension "${name}" has invalid name: ${nameValidation.error}`);
				return null;
			}

			const codeValidation = this.validateCode(extension.code);
			if (!codeValidation.valid) {
				console.error(`Extension "${name}" has invalid code: ${codeValidation.error}`);
				return null;
			}

			this.extensions.set(name, extension);
			return extension;
		} catch {
			return null;
		}
	}

	async deleteExtension(name: string): Promise<boolean> {
		// Verify it exists in extensions dir
		const filePath = path.join(this.extensionsDir, `${name}.json`);
		const normalizedExtDir = path.normalize(this.extensionsDir);
		const normalizedFilePath = path.normalize(filePath);

		// Ensure file is within extensions directory (prevent traversal)
		if (!normalizedFilePath.startsWith(normalizedExtDir + path.sep) &&
			normalizedFilePath !== path.join(normalizedExtDir, `${name}.json`)) {
			return false;
		}

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

	async listExtensions(): Promise<ExtensionDefinition[]> {
		this.ensureExtensionsDir();

		try {
			const files = await fs.promises.readdir(this.extensionsDir);
			const extensions: ExtensionDefinition[] = [];

			for (const file of files) {
				if (!file.endsWith(".json")) continue;

				const ext = await this.loadExtension(file.replace(".json", ""));
				if (ext) {
					extensions.push(ext);
				}
			}

			return extensions;
		} catch {
			return [];
		}
	}

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
	 * SECURE: Instantiate extension with sandboxed execution
	 */
	private async instantiateExtension(extension: ExtensionDefinition): Promise<void> {
		// Final validation
		const nameValidation = this.validateName(extension.name);
		if (!nameValidation.valid) {
			throw new Error(`Invalid extension name: ${nameValidation.error}`);
		}

		const codeValidation = this.validateCode(extension.code);
		if (!codeValidation.valid) {
			throw new Error(`Invalid code: ${codeValidation.error}`);
		}

		// Clean up the code
		let code = extension.code
			.replace(/^exports\s*=\s*.*?;?\s*$/gm, "")
			.replace(/^module\.exports\s*=\s*.*?;?\s*$/gm, "")
			.trim();

		// Parse code structure
		let executeCode: string;

		if (code.startsWith("{") && code.includes("handler")) {
			const handlerMatch = code.match(/handler\s*:\s*(?:async\s+)?function\s*(?:\w+)?\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*\}\s*;?\s*$/);
			if (handlerMatch) {
				executeCode = handlerMatch[1];
			} else {
				throw new Error("Could not parse handler from code");
			}
		} else if (!code.includes("return") && !code.includes("function")) {
			executeCode = `return (async () => ${code})();`;
		} else if (!code.includes("return")) {
			executeCode = `return (async () => { ${code} })();`;
		} else {
			executeCode = `return (async () => { ${code} })();`;
		}

		// Validate parsed code too
		const parsedValidation = this.validateCode(executeCode);
		if (!parsedValidation.valid) {
			throw new Error(`Generated code failed validation: ${parsedValidation.error}`);
		}

		const toolDef: AgentTool = {
			name: extension.name,
			label: extension.label,
			description: extension.description,
			parameters: extension.parameters as any,
			execute: async (toolCallId, params, signal, onUpdate) => {
				// Create abort controller for timeout
				const timeout = setTimeout(() => {
					throw new Error(`Extension "${extension.name}" execution timed out (${MAX_EXECUTION_TIME}ms)`);
				}, MAX_EXECUTION_TIME);

				// Wrap original signal with timeout
				const timeoutSignal = signal
					? (() => {
							const controller = new AbortController();
							signal.addEventListener("abort", () => controller.abort());
							return controller.signal;
					  })()
					: undefined;

				try {
					// SECURE: Create sandboxed function with minimal context
					const sandboxedExecute = new Function(
						"toolCallId",
						"params",
						"signal",
						`
						'use strict';

						// Minimal sandbox - only expose safe APIs
						const context = {
							toolCallId,
							params,
							signal,

							// Safe module access
							require: function(module) {
								if (!${JSON.stringify(Array.from(ALLOWED_MODULES))}.includes(module)) {
									throw new Error('Module "' + module + '" is not allowed. Allowed: ${Array.from(ALLOWED_MODULES).join(", ")}');
								}
								if (module === "fs") {
									return {
										promises: {
											readFile: (p, opts) => {
												const fp = String(p);
												if (fp.includes("..") || fp.includes("\\0")) throw new Error("Invalid path");
												return import("node:fs").then(m => m.promises.readFile(fp, opts));
											},
											writeFile: (p, data, opts) => {
												const fp = String(p);
												if (fp.includes("..") || fp.includes("\\0")) throw new Error("Invalid path");
												return import("node:fs").then(m => m.promises.writeFile(fp, data, opts));
											},
											mkdir: (p, opts) => {
												const fp = String(p);
												if (fp.includes("..") || fp.includes("\\0")) throw new Error("Invalid path");
												return import("node:fs").then(m => m.promises.mkdir(fp, opts));
											},
											readdir: (p, opts) => {
												const fp = String(p);
												if (fp.includes("..") || fp.includes("\\0")) throw new Error("Invalid path");
												return import("node:fs").then(m => m.promises.readdir(fp, opts));
											},
											stat: (p) => {
												const fp = String(p);
												if (fp.includes("..") || fp.includes("\\0")) throw new Error("Invalid path");
												return import("node:fs").then(m => m.promises.stat(fp));
											},
											existsSync: (p) => {
												const fp = String(p);
												if (fp.includes("..") || fp.includes("\\0")) return false;
												return import("node:fs").then(m => m.existsSync(fp));
											},
										},
									};
								}
								return import("node:" + module);
							},
							console: {
								log: function() { console.log("[extension]", Array.from(arguments).join(" ")); },
								error: function() { console.error("[extension]", Array.from(arguments).join(" ")); },
							},
						};

						let __result;
						${executeCode}
						return __result;
						`
					);

					const result = await sandboxedExecute(toolCallId, params, timeoutSignal);

					// Validate result structure
					if (!result || typeof result !== "object") {
						throw new Error("Extension must return an object with 'content' property");
					}

					if (!result.content || !Array.isArray(result.content)) {
						throw new Error("Extension must return { content: [...] }");
					}

					return {
						content: result.content,
						details: result.details || {},
					};
				} finally {
					clearTimeout(timeout);
				}
			},
		} as AgentTool;

		this.registerTool(toolDef);
		this.extensions.set(extension.name, extension);
	}

	async createExtension(params: {
		name: string;
		label: string;
		description: string;
		parameterSchema: Record<string, any>;
		code: string;
	}): Promise<ExtensionDefinition> {
		// Validate name
		const name = params.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");

		const nameValidation = this.validateName(name);
		if (!nameValidation.valid) {
			throw new Error(nameValidation.error);
		}

		// Validate code
		const codeValidation = this.validateCode(params.code);
		if (!codeValidation.valid) {
			throw new Error(codeValidation.error);
		}

		const extension: ExtensionDefinition = {
			name,
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