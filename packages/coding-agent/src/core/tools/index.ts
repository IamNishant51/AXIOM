/**
 * Built-in Tools for Axiom Coding Agent
 */

import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@axiom/agent-core";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Read Tool - Read file contents
 */
export const readTool: AgentTool = {
	name: "read",
	label: "Read File",
	description: "Read the contents of a file",
	parameters: Type.Object({
		path: Type.String({ description: "The path to the file to read" }),
	}),
	async execute(toolCallId, params: any) {
		const filePath = params.path;

		try {
			const content = await fs.promises.readFile(filePath, "utf-8");
			return {
				content: [{ type: "text" as const, text: content }],
				details: { path: filePath, size: content.length },
			};
		} catch (error) {
			throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
		}
	},
};

/**
 * Write Tool - Write file contents
 */
export const writeTool: AgentTool = {
	name: "write",
	label: "Write File",
	description: "Write content to a file",
	parameters: Type.Object({
		path: Type.String({ description: "The path to the file to write" }),
		content: Type.String({ description: "The content to write to the file" }),
	}),
	async execute(toolCallId, params: any) {
		const filePath = params.path;
		const content = params.content;

		try {
			// Ensure directory exists
			const dir = path.dirname(filePath);
			await fs.promises.mkdir(dir, { recursive: true });

			await fs.promises.writeFile(filePath, content, "utf-8");
			return {
				content: [{ type: "text" as const, text: `Wrote ${content.length} characters to ${filePath}` }],
				details: { path: filePath, size: content.length },
			};
		} catch (error) {
			throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
		}
	},
};

/**
 * Bash Tool - Execute shell commands
 */
export const bashTool: AgentTool = {
	name: "bash",
	label: "Bash",
	description: "Execute a shell command",
	parameters: Type.Object({
		command: Type.String({ description: "The command to execute" }),
	}),
	async execute(toolCallId, params: any) {
		const { execSync } = await import("node:child_process");

		try {
			const output = execSync(params.command, {
				encoding: "utf-8",
				stdio: ["pipe", "pipe", "pipe"],
				timeout: 60000,
			});

			return {
				content: [{ type: "text" as const, text: output }],
				details: { command: params.command },
			};
		} catch (error: any) {
			const errorOutput = error.stdout || error.message || String(error);
			return {
				content: [{ type: "text" as const, text: errorOutput }],
				details: { command: params.command, exitCode: error.status || 1 },
			};
		}
	},
};

/**
 * Edit Tool - Edit files with simple line-based editing
 */
export const editTool: AgentTool = {
	name: "edit",
	label: "Edit File",
	description: "Edit a file by replacing specific lines or content",
	parameters: Type.Object({
		path: Type.String({ description: "The path to the file to edit" }),
		old_string: Type.String({ description: "The content to replace" }),
		new_string: Type.String({ description: "The new content to insert" }),
	}),
	async execute(toolCallId, params: any) {
		const filePath = params.path;
		const oldString = params.old_string;
		const newString = params.new_string;

		try {
			// Read file
			let content = await fs.promises.readFile(filePath, "utf-8");

			// Replace content
			if (!content.includes(oldString)) {
				throw new Error(`Could not find "${oldString}" in file`);
			}

			content = content.replace(oldString, newString);

			// Write back
			await fs.promises.writeFile(filePath, content, "utf-8");

			return {
				content: [{ type: "text" as const, text: `Edited ${filePath}` }],
				details: { path: filePath },
			};
		} catch (error) {
			throw new Error(`Failed to edit file: ${error instanceof Error ? error.message : String(error)}`);
		}
	},
};

/**
 * Grep Tool - Search for content in files
 */
export const grepTool: AgentTool = {
	name: "grep",
	label: "Grep",
	description: "Search for a pattern in files",
	parameters: Type.Object({
		pattern: Type.String({ description: "The pattern to search for" }),
		path: Type.Optional(Type.String({ description: "The directory to search in (default: current directory)" })),
	}),
	async execute(toolCallId, params: any) {
		const { execSync } = await import("node:child_process");

		const searchPath = params.path || ".";
		try {
			const output = execSync(`grep -r "${params.pattern}" ${searchPath} --line-number 2>/dev/null || true`, {
				encoding: "utf-8",
				timeout: 30000,
			});

			return {
				content: [{ type: "text" as const, text: output || "No matches found" }],
				details: { pattern: params.pattern, path: searchPath },
			};
		} catch (error: any) {
			return {
				content: [{ type: "text" as const, text: error.stdout || "Search completed with no matches" }],
				details: { pattern: params.pattern, path: searchPath },
			};
		}
	},
};

/**
 * Ls Tool - List directory contents
 */
export const lsTool: AgentTool = {
	name: "ls",
	label: "List",
	description: "List files in a directory",
	parameters: Type.Object({
		path: Type.Optional(Type.String({ description: "The directory to list (default: current directory)" })),
	}),
	async execute(toolCallId, params: any) {
		const dirPath = params.path || ".";

		try {
			const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
			const lines = entries.map((entry) => {
				const prefix = entry.isDirectory() ? "📁 " : "📄 ";
				return prefix + entry.name;
			});

			return {
				content: [{ type: "text" as const, text: lines.join("\n") }],
				details: { path: dirPath },
			};
		} catch (error) {
			throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : String(error)}`);
		}
	},
};

/**
 * Find Tool - Find files by name pattern
 */
export const findTool: AgentTool = {
	name: "find",
	label: "Find",
	description: "Find files by name pattern",
	parameters: Type.Object({
		pattern: Type.String({ description: "The pattern to search for" }),
		path: Type.Optional(Type.String({ description: "The directory to search in (default: current directory)" })),
	}),
	async execute(toolCallId, params: any) {
		const { execSync } = await import("node:child_process");

		const searchPath = params.path || ".";
		const pattern = params.pattern;

		try {
			const output = execSync(`find ${searchPath} -name "${pattern}" 2>/dev/null`, {
				encoding: "utf-8",
				timeout: 30000,
			});

			return {
				content: [{ type: "text" as const, text: output || "No files found" }],
				details: { pattern, path: searchPath },
			};
		} catch (error: any) {
			return {
				content: [{ type: "text" as const, text: "No files found" }],
				details: { pattern, path: searchPath },
			};
		}
	},
};

/**
 * Default tools available to Axiom
 */
export const defaultTools = [readTool, writeTool, bashTool, editTool];

/**
 * Read-only tools (for safe mode)
 */
export const readOnlyTools = [readTool, grepTool, findTool, lsTool];