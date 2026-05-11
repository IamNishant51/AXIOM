/**
 * Web Search Extension - Internet search capability for Axiom
 * SECURE VERSION - SSRF protection, rate limiting, and safe parsing
 */
import type { AgentTool } from "@axiom/agent-core";
/**
 * Web Search Tool - Search the internet (read-only, safe)
 */
export declare const webSearchTool: AgentTool;
/**
 * Fetch URL Tool - Get content from a URL (SSRF protected)
 */
export declare const fetchUrlTool: AgentTool;
export declare const internetTools: AgentTool[];
//# sourceMappingURL=internet.d.ts.map