/**
 * Enhanced Bash Tool - With security validation
 */
import type { AgentTool } from "@axiom/agent-core";
export interface BashToolOptions {
    allowedPaths?: string[];
    timeout?: number;
    maxOutputSize?: number;
}
export declare function createBashTool(options?: BashToolOptions): AgentTool;
export declare const secureBashTool: AgentTool<import("@sinclair/typebox").TSchema, any>;
//# sourceMappingURL=bash-tool.d.ts.map