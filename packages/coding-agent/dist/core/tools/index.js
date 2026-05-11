/**
 * Built-in Tools for Axiom Coding Agent
 * Enhanced with security validation and proper result formatting
 */
import { Type } from "@sinclair/typebox";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
// Import security utilities
import { checkCommand, validatePath, getCommandCategory } from "./bash-security.js";
/**
 * Helper to format tool result
 */
function formatResult(content, details) {
    return {
        content: [{ type: "text", text: content }],
        details,
    };
}
/**
 * Read Tool - Read file contents with validation
 */
export const readTool = {
    name: "read",
    label: "Read File",
    description: "Read the contents of a file",
    parameters: Type.Object({
        path: Type.String({ description: "The path to the file to read" }),
        limit: Type.Optional(Type.Number({ description: "Maximum lines to read" })),
        offset: Type.Optional(Type.Number({ description: "Line offset to start from" })),
    }),
    async execute(_toolCallId, params) {
        const filePath = params.path;
        // Validate path
        const pathCheck = validatePath(filePath);
        if (!pathCheck.valid) {
            throw new Error(`Invalid path: ${pathCheck.error}`);
        }
        try {
            // Check file size
            const stats = await fs.promises.stat(filePath);
            const maxSize = 10 * 1024 * 1024; // 10MB limit
            if (stats.size > maxSize) {
                throw new Error(`File too large (${(stats.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
            }
            let content = await fs.promises.readFile(filePath, "utf-8");
            // Apply line limits
            const limit = params.limit;
            const offset = params.offset || 0;
            if (limit || offset) {
                const lines = content.split("\n");
                const start = Math.min(offset, lines.length);
                const end = limit ? Math.min(start + limit, lines.length) : lines.length;
                content = lines.slice(start, end).join("\n");
                if (offset || limit) {
                    content = `--- Showing lines ${start + 1}-${end} of ${lines.length} ---\n\n${content}`;
                }
            }
            return formatResult(content, { path: filePath, size: stats.size });
        }
        catch (error) {
            throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
/**
 * Write Tool - Write content to file with backup
 */
export const writeTool = {
    name: "write",
    label: "Write File",
    description: "Write content to a file (creates backup of existing files)",
    parameters: Type.Object({
        path: Type.String({ description: "The path to the file to write" }),
        content: Type.String({ description: "The content to write to the file" }),
        backup: Type.Optional(Type.Boolean({ description: "Create backup of existing file" })),
    }),
    async execute(_toolCallId, params) {
        const filePath = params.path;
        const content = params.content;
        const createBackup = params.backup !== false;
        // Validate path
        const pathCheck = validatePath(filePath);
        if (!pathCheck.valid) {
            throw new Error(`Invalid path: ${pathCheck.error}`);
        }
        try {
            // Check if file exists and create backup
            let backupPath;
            try {
                const existing = await fs.promises.readFile(filePath, "utf-8");
                if (createBackup) {
                    backupPath = `${filePath}.backup-${Date.now()}`;
                    await fs.promises.writeFile(backupPath, existing, "utf-8");
                }
            }
            catch {
                // File doesn't exist, that's fine
            }
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.promises.mkdir(dir, { recursive: true });
            // Write file
            await fs.promises.writeFile(filePath, content, "utf-8");
            const details = { path: filePath, size: content.length };
            if (backupPath)
                details.backup = backupPath;
            return formatResult(`Wrote ${content.length} characters to ${filePath}`, details);
        }
        catch (error) {
            throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
/**
 * Bash Tool - Execute shell commands with security validation
 */
export const bashTool = {
    name: "bash",
    label: "Bash",
    description: "Execute a shell command",
    parameters: Type.Object({
        command: Type.String({ description: "The command to execute" }),
        timeout: Type.Optional(Type.Number({ description: "Timeout in milliseconds (default: 60000)" })),
    }),
    async execute(_toolCallId, params) {
        const command = params.command;
        const timeout = params.timeout || 60000;
        // Security check
        const securityCheck = checkCommand(command);
        if (!securityCheck.allowed) {
            throw new Error(`BLOCKED: ${securityCheck.message}`);
        }
        const category = getCommandCategory(command);
        const startTime = Date.now();
        try {
            const output = execSync(command, {
                encoding: "utf-8",
                stdio: ["pipe", "pipe", "pipe"],
                timeout,
                maxBuffer: 1024 * 1024, // 1MB
            });
            const duration = Date.now() - startTime;
            const warning = securityCheck.requiresConfirmation ? securityCheck.message : undefined;
            const details = { command, exitCode: 0, duration, category };
            if (warning)
                details.warning = warning;
            return formatResult(String(output), details);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorOutput = error.stdout || error.message || "Command failed";
            const exitCode = error.status || 1;
            // For errors, we still return the output but it will be marked as error by the agent
            throw new Error(errorOutput);
        }
    },
};
/**
 * Edit Tool - Edit files with old_string/new_string replacement
 */
export const editTool = {
    name: "edit",
    label: "Edit File",
    description: "Edit a file by replacing specific content",
    parameters: Type.Object({
        path: Type.String({ description: "The path to the file to edit" }),
        old_string: Type.String({ description: "The content to replace" }),
        new_string: Type.String({ description: "The new content to insert" }),
    }),
    async execute(_toolCallId, params) {
        const filePath = params.path;
        const oldString = params.old_string;
        const newString = params.new_string;
        // Validate path
        const pathCheck = validatePath(filePath);
        if (!pathCheck.valid) {
            throw new Error(`Invalid path: ${pathCheck.error}`);
        }
        try {
            // Read file
            let content = await fs.promises.readFile(filePath, "utf-8");
            // Check if old_string exists
            if (!content.includes(oldString)) {
                throw new Error(`Could not find the specified content in file. The exact text you provided was not found.`);
            }
            // Create backup
            const backupPath = `${filePath}.backup-${Date.now()}`;
            await fs.promises.writeFile(backupPath, content, "utf-8");
            // Replace content
            content = content.replace(oldString, newString);
            // Write back
            await fs.promises.writeFile(filePath, content, "utf-8");
            return formatResult(`Edited ${filePath}`, { path: filePath, backup: backupPath });
        }
        catch (error) {
            throw new Error(`Failed to edit file: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
/**
 * Grep Tool - Search for content in files
 */
export const grepTool = {
    name: "grep",
    label: "Grep",
    description: "Search for a pattern in files",
    parameters: Type.Object({
        pattern: Type.String({ description: "The pattern to search for" }),
        path: Type.Optional(Type.String({ description: "The directory to search in (default: current directory)" })),
        options: Type.Optional(Type.String({ description: "Additional grep options (e.g., -i for case-insensitive)" })),
    }),
    async execute(_toolCallId, params) {
        const pattern = params.pattern;
        const searchPath = params.path || ".";
        const options = params.options || "";
        // Validate path
        const pathCheck = validatePath(searchPath);
        if (!pathCheck.valid) {
            throw new Error(`Invalid path: ${pathCheck.error}`);
        }
        // Basic injection prevention
        if (/[;&|`$]/.test(pattern) && !pattern.startsWith("'") && !pattern.startsWith('"')) {
            throw new Error("Invalid pattern: contains potentially dangerous characters");
        }
        const cmd = `grep ${options} -r "${pattern.replace(/"/g, '\\"')}" ${searchPath} --line-number 2>/dev/null || true`;
        try {
            const output = execSync(cmd, {
                encoding: "utf-8",
                timeout: 30000,
                maxBuffer: 1024 * 1024,
            });
            return formatResult(output || "No matches found", { pattern, path: searchPath });
        }
        catch (error) {
            return formatResult(error.stdout || "Search completed with no matches", { pattern, path: searchPath });
        }
    },
};
/**
 * Ls Tool - List directory contents
 */
export const lsTool = {
    name: "ls",
    label: "List",
    description: "List files in a directory",
    parameters: Type.Object({
        path: Type.Optional(Type.String({ description: "The directory to list (default: current directory)" })),
        all: Type.Optional(Type.Boolean({ description: "Show hidden files" })),
        long: Type.Optional(Type.Boolean({ description: "Long format with details" })),
    }),
    async execute(_toolCallId, params) {
        const dirPath = params.path || ".";
        const showHidden = params.all || false;
        const longFormat = params.long || false;
        // Validate path
        const pathCheck = validatePath(dirPath);
        if (!pathCheck.valid) {
            throw new Error(`Invalid path: ${pathCheck.error}`);
        }
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            let filtered = entries;
            if (!showHidden) {
                filtered = entries.filter(e => !e.name.startsWith("."));
            }
            if (longFormat) {
                const lines = filtered.map(entry => {
                    const type = entry.isDirectory() ? "d" : "-";
                    const perms = entry.isDirectory() ? "rwxr-xr-x" : "rw-r--r--";
                    const name = entry.name;
                    const suffix = entry.isDirectory() ? "/" : "";
                    return `${type}${perms}  ${name}${suffix}`;
                });
                return formatResult(lines.join("\n"), { path: dirPath, count: filtered.length });
            }
            else {
                const lines = filtered.map(entry => {
                    const prefix = entry.isDirectory() ? "📁 " : "📄 ";
                    return prefix + entry.name;
                });
                return formatResult(lines.join("\n"), { path: dirPath, count: filtered.length });
            }
        }
        catch (error) {
            throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
/**
 * Find Tool - Find files by name pattern
 */
export const findTool = {
    name: "find",
    label: "Find",
    description: "Find files by name pattern",
    parameters: Type.Object({
        pattern: Type.String({ description: "The pattern to search for (glob)" }),
        path: Type.Optional(Type.String({ description: "The directory to search in (default: current directory)" })),
        type: Type.Optional(Type.String({ description: "Type: f (file) or d (directory)" })),
    }),
    async execute(_toolCallId, params) {
        const pattern = params.pattern;
        const searchPath = params.path || ".";
        const fileType = params.type || "f";
        // Validate path
        const pathCheck = validatePath(searchPath);
        if (!pathCheck.valid) {
            throw new Error(`Invalid path: ${pathCheck.error}`);
        }
        try {
            const output = execSync(`find ${searchPath} -type ${fileType} -name "${pattern}" 2>/dev/null | head -100`, {
                encoding: "utf-8",
                timeout: 30000,
                maxBuffer: 1024 * 1024,
            });
            return formatResult(output || "No files found", { pattern, path: searchPath });
        }
        catch {
            return formatResult("No files found", { pattern, path: searchPath });
        }
    },
};
/**
 * Mkdir Tool - Create directories
 */
export const mkdirTool = {
    name: "mkdir",
    label: "Mkdir",
    description: "Create directories",
    parameters: Type.Object({
        path: Type.String({ description: "The directory path to create" }),
        parents: Type.Optional(Type.Boolean({ description: "Create parent directories" })),
    }),
    async execute(_toolCallId, params) {
        const dirPath = params.path;
        const createParents = params.parents !== false;
        // Validate path
        const pathCheck = validatePath(dirPath);
        if (!pathCheck.valid) {
            throw new Error(`Invalid path: ${pathCheck.error}`);
        }
        try {
            await fs.promises.mkdir(dirPath, { recursive: createParents });
            return formatResult(`Created directory ${dirPath}`, { path: dirPath });
        }
        catch (error) {
            throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
/**
 * Default tools available to Axiom
 */
export const defaultTools = [
    readTool,
    writeTool,
    bashTool,
    editTool,
    grepTool,
    lsTool,
    findTool,
    mkdirTool,
];
/**
 * Read-only tools (for safe mode)
 */
export const readOnlyTools = [
    readTool,
    grepTool,
    findTool,
    lsTool,
];
// Re-export security utilities for external use
export { checkCommand, validatePath, getCommandCategory };
//# sourceMappingURL=index.js.map