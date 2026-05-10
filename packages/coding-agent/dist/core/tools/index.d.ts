/**
 * Built-in Tools for Axiom Coding Agent
 */
import type { AgentTool } from "@axiom/agent-core";
/**
 * Read Tool - Read file contents
 */
export declare const readTool: AgentTool;
/**
 * Write Tool - Write file contents
 */
export declare const writeTool: AgentTool;
/**
 * Bash Tool - Execute shell commands
 */
export declare const bashTool: AgentTool;
/**
 * Edit Tool - Edit files with simple line-based editing
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
 * Default tools available to Axiom
 */
export declare const defaultTools: AgentTool<import("@sinclair/typebox").TSchema, any>[];
/**
 * Read-only tools (for safe mode)
 */
export declare const readOnlyTools: AgentTool<import("@sinclair/typebox").TSchema, any>[];
//# sourceMappingURL=index.d.ts.map