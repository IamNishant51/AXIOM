/**
 * MCP Client - Model Context Protocol integration
 * Allows connection to MCP servers for extended capabilities
 */
import type { AgentTool } from "@axiom/agent-core";
export interface MCPConnectionConfig {
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
export interface MCPServer {
    name: string;
    version: string;
    tools: AgentTool[];
    resources: MCPResource[];
}
export interface MCPResource {
    uri: string;
    name: string;
    mimeType?: string;
    description?: string;
}
export interface MCPClient {
    connect(config: MCPConnectionConfig): Promise<void>;
    disconnect(): Promise<void>;
    listServers(): MCPServer[];
    listTools(serverName?: string): AgentTool[];
    listResources(serverName?: string): MCPResource[];
    callTool(toolName: string, args: Record<string, unknown>): Promise<any>;
}
/**
 * Create MCP client for a server
 */
export declare function createMCPClient(config: MCPConnectionConfig): Promise<MCPClient>;
/**
 * Discover MCP servers from configuration
 */
export declare function discoverMCPServers(configPaths: string[]): Promise<MCPConnectionConfig[]>;
/**
 * Convert MCP tools to AgentTools format
 */
export declare function mcpToolsToAgentTools(mcpTools: Array<{
    name: string;
    description?: string;
    label?: string;
    inputSchema?: unknown;
}>): AgentTool[];
//# sourceMappingURL=mcp.d.ts.map