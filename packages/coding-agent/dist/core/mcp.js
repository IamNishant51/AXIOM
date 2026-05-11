/**
 * MCP Client - Model Context Protocol integration
 * Allows connection to MCP servers for extended capabilities
 */
// MCP tool parameters schema
const mcpToolParams = {
    type: "object",
    properties: {},
    additionalProperties: true,
};
/**
 * Create MCP client for a server
 */
export async function createMCPClient(config) {
    const { spawn } = await import("node:child_process");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let childProcess = null;
    let connected = false;
    return {
        async connect(cfg) {
            childProcess = spawn(cfg.command, cfg.args || [], {
                stdio: ["pipe", "pipe", "pipe"],
            });
            connected = true;
        },
        async disconnect() {
            if (childProcess) {
                childProcess.kill();
                childProcess = null;
            }
            connected = false;
        },
        listServers() {
            return [];
        },
        listTools() {
            return [];
        },
        listResources() {
            return [];
        },
        async callTool(_toolName, _args) {
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
export async function discoverMCPServers(configPaths) {
    const configs = [];
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
        }
        catch {
            // Config file doesn't exist or is invalid
        }
    }
    return configs;
}
/**
 * Convert MCP tools to AgentTools format
 */
export function mcpToolsToAgentTools(mcpTools) {
    return mcpTools.map((tool) => ({
        name: tool.name,
        label: tool.label || tool.name,
        description: tool.description || "",
        parameters: tool.inputSchema || mcpToolParams,
        async execute(_toolCallId, params) {
            return {
                content: [{ type: "text", text: JSON.stringify(params) }],
                details: { tool: tool.name },
            };
        },
    }));
}
//# sourceMappingURL=mcp.js.map