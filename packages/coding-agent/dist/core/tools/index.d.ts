/**
 * Built-in Tools for Axiom Coding Agent
 * Enhanced with security validation and proper result formatting
 */
import type { AgentTool } from "@axiom/agent-core";
import { checkCommand, validatePath, getCommandCategory } from "./bash-security.js";
/**
 * Read Tool - Read file contents with validation
 */
export declare const readTool: AgentTool;
/**
 * Write Tool - Write content to file with backup
 */
export declare const writeTool: AgentTool;
/**
 * Bash Tool - Execute shell commands with security validation
 */
export declare const bashTool: AgentTool;
/**
 * Edit Tool - Edit files with old_string/new_string replacement
 */
export declare const editTool: AgentTool;
/**
 * Grep Tool - Search for content in files
 */
export declare const grepTool: AgentTool;
/**
 * Ls Tool - List directory contents
 */
export declare const lsTool: AgentTool;
/**
 * Find Tool - Find files by name pattern
 */
export declare const findTool: AgentTool;
/**
 * Mkdir Tool - Create directories
 */
export declare const mkdirTool: AgentTool;
/**
 * Default tools available to Axiom
 */
export declare const defaultTools: AgentTool[];
/**
 * Read-only tools (for safe mode)
 */
export declare const readOnlyTools: AgentTool[];
export { checkCommand, validatePath, getCommandCategory };
export type { SecurityCheck, DangerLevel } from "./bash-security.js";
//# sourceMappingURL=index.d.ts.map