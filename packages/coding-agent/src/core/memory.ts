/**
 * Memory System - CLAUDE.md file detection and context loading
 * Similar to Claude Code's memory system
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface MemoryFile {
	path: string;
	name: string;
	content: string;
	loaded: boolean;
	size: number;
}

export interface MemoryContext {
	files: MemoryFile[];
	totalSize: number;
	projectRoot: string;
}

/**
 * Find CLAUDE.md files in the project
 */
export async function findMemoryFiles(projectRoot: string): Promise<MemoryFile[]> {
	const memoryFiles: MemoryFile[] = [];
	const patterns = ["CLAUDE.md", ".claude.md", "MEMORY.md", ".memory.md"];

	for (const pattern of patterns) {
		const searchPaths = [
			path.join(projectRoot, pattern),
			path.join(projectRoot, ".claude", pattern),
			path.join(projectRoot, ".memory", pattern),
		];

		for (const searchPath of searchPaths) {
			try {
				const stats = await fs.promises.stat(searchPath);
				if (stats.isFile() && stats.size < 100 * 1024) { // Max 100KB
					const content = await fs.promises.readFile(searchPath, "utf-8");
					memoryFiles.push({
						path: searchPath,
						name: path.basename(searchPath),
						content,
						loaded: true,
						size: stats.size,
					});
				}
			} catch {
				// File doesn't exist, skip
			}
		}
	}

	return memoryFiles;
}

/**
 * Load memory files and create context
 */
export async function loadMemoryContext(projectRoot: string): Promise<MemoryContext> {
	const files = await findMemoryFiles(projectRoot);
	const totalSize = files.reduce((sum, f) => sum + f.size, 0);

	return {
		files,
		totalSize,
		projectRoot,
	};
}

/**
 * Parse memory file content and extract instructions
 */
export function parseMemoryContent(content: string): {
	instructions: string;
	tags: string[];
	priority: "low" | "normal" | "high";
} {
	const tags: string[] = [];
	let priority: "low" | "normal" | "high" = "normal";

	// Extract priority from content
	if (content.includes("[priority: high]") || content.includes("[priority:high]")) {
		priority = "high";
	} else if (content.includes("[priority: low]") || content.includes("[priority:low]")) {
		priority = "low";
	}

	// Extract tags
	const tagMatches = content.match(/\[tag:\s*([^\]]+)\]/gi);
	if (tagMatches) {
		tags.push(...tagMatches.map(t => t.replace(/\[tag:\s*/i, "").replace(/\]/i, "").trim()));
	}

	// Remove metadata sections from instructions
	let instructions = content
		.replace(/\[priority:\s*\w+\]/gi, "")
		.replace(/\[tag:\s*[^\]]+\]/gi, "")
		.replace(/^---[\s\S]*?---\n?/gm, "")
		.trim();

	return { instructions, tags, priority };
}

/**
 * Create system prompt addition from memory
 */
export async function createMemorySystemPrompt(
	projectRoot: string,
	maxLength: number = 8000
): Promise<string | null> {
	const context = await loadMemoryContext(projectRoot);

	if (context.files.length === 0) {
		return null;
	}

	const parts: string[] = [];

	for (const file of context.files) {
		const header = `[Memory file: ${file.name}]`;
		const content = file.content.slice(0, maxLength - header.length);

		if (parts.join("\n\n").length + header.length + content.length > maxLength) {
			break;
		}

		parts.push(`${header}\n\n${content}`);
	}

	if (parts.length === 0) {
		return null;
	}

	return `

---

## Project Memory (${context.files.length} file${context.files.length > 1 ? "s" : ""})

${parts.join("\n\n---\n\n")}

---
`;
}

/**
 * Memory indicator for UI
 */
export function getMemoryIndicator(context: MemoryContext): {
	loaded: boolean;
	count: number;
	totalSize: number;
	files: string[];
} {
	return {
		loaded: context.files.length > 0,
		count: context.files.length,
		totalSize: context.totalSize,
		files: context.files.map(f => f.name),
	};
}