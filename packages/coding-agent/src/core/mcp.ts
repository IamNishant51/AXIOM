/**
 * MCP Client - Model Context Protocol integration
 * Allows connection to MCP servers for extended capabilities
 */

import type { AgentTool } from "@axiom/agent-core";
import type { Static, TSchema } from "@sinclair/typebox";

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

// MCP tool parameters schema
const mcpToolParams = {
	type: "object" as const,
	properties: {},
	additionalProperties: true,
};

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
export async function createMCPClient(
	config: MCPConnectionConfig
): Promise<MCPClient> {
	const { spawn } = await import("node:child_process");

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let childProcess: any = null;
	let connected = false;

	return {
		async connect(cfg: MCPConnectionConfig): Promise<void> {
			childProcess = spawn(cfg.command, cfg.args || [], {
				stdio: ["pipe", "pipe", "pipe"],
			});
			connected = true;
		},

		async disconnect(): Promise<void> {
			if (childProcess) {
				childProcess.kill();
				childProcess = null;
			}
			connected = false;
		},

		listServers(): MCPServer[] {
			return [];
		},

		listTools(): AgentTool[] {
			return [];
		},

		listResources(): MCPResource[] {
			return [];
		},

		async callTool(_toolName: string, _args: Record<string, unknown>): Promise<any> {
			if (!connected) {
				throw new Error("MCP client not connected");
			}
			// Placeholder - full implementation would use JSON-RPC
			return { error: "MCP tool call not implemented" };
		},
	};
}

/**
 * Discover MCP servers from configuration
 */
export async function discoverMCPServers(configPaths: string[]): Promise<MCPConnectionConfig[]> {
	const configs: MCPConnectionConfig[] = [];
	const fs = await import("node:fs");

	for (const configPath of configPaths) {
		try {
			const content = await fs.promises.readFile(configPath, "utf-8");
			const config = JSON.parse(content);

			if (config.mcpServers && Array.isArray(config.mcpServers)) {
				for (const server of config.mcpServers) {
					if (server.command) {
						configs.push({
							name: server.name || "unknown",
							command: server.command,
							args: server.args,
							env: server.env,
						});
					}
				}
			}
		} catch {
			// Config file doesn't exist or is invalid
		}
	}

	return configs;
}

/**
 * Convert MCP tools to AgentTools format
 */
export function mcpToolsToAgentTools(mcpTools: Array<{name: string; description?: string; label?: string; inputSchema?: unknown}>): AgentTool[] {
	return mcpTools.map((tool) => ({
		name: tool.name,
		label: tool.label || tool.name,
		description: tool.description || "",
		parameters: tool.inputSchema as any || mcpToolParams,
		async execute(_toolCallId: string, params: any) {
			return {
				content: [{ type: "text" as const, text: JSON.stringify(params) }],
				details: { tool: tool.name },
			};
		},
	}));
}