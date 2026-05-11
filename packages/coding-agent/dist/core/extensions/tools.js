/**
 * Extension Tools - Tools for managing extensions dynamically
 * Axiom Coding Agent
 */
import { Type } from "@sinclair/typebox";
import { getExtensionRegistry, } from "./registry.js";
/**
 * Format tool result
 */
function formatResult(content, details) {
    return {
        content: [{ type: "text", text: content }],
        details,
    };
}
/**
 * Add Extension Tool - Add a new tool/extension to the agent
 */
export const addExtensionTool = {
    name: "add_extension",
    label: "Add Extension",
    description: "Add a new tool/extension to the agent. When the user asks to add a tool that does something specific, use this tool to create it. The code runs in a sandboxed context with access to: fs, path, os, crypto modules.",
    parameters: Type.Object({
        name: Type.String({
            description: "Unique name for the extension (lowercase, underscores allowed)",
        }),
        label: Type.String({ description: "Human-readable label for the tool" }),
        description: Type.String({
            description: "Description of what this extension does",
        }),
        parameters: Type.Record(Type.String(), Type.Any(), {
            description: "JSON Schema for the extension's parameters (e.g., { message: { type: 'string', description: 'The message' } })",
        }),
        code: Type.String({
            description: "The JavaScript code to execute. Use 'params' object for input, return an object with 'content' (array of {type: 'text', text: string}) and 'details' properties. Access modules via context.require('module'). Available modules: fs, path, os, crypto",
        }),
    }),
    async execute(_toolCallId, params) {
        const registry = getExtensionRegistry();
        try {
            // Validate name
            const name = params.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
            if (!name || name.length < 2) {
                throw new Error("Extension name must be at least 2 characters");
            }
            // Check if already exists
            if (registry.hasTool(name)) {
                throw new Error(`Extension "${name}" already exists. Use remove_extension first to replace it.`);
            }
            // Create the extension
            const extension = await registry.createExtension({
                name,
                label: params.label,
                description: params.description,
                parameterSchema: params.parameters,
                code: params.code,
            });
            return formatResult(`Extension "${extension.label}" (${extension.name}) has been added successfully. You can now use it.`, {
                name: extension.name,
                action: "added",
                details: {
                    label: extension.label,
                    description: extension.description,
                    parameters: extension.parameters,
                },
            });
        }
        catch (error) {
            throw new Error(`Failed to add extension: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
/**
 * List Extensions Tool - List all available extensions
 */
export const listExtensionsTool = {
    name: "list_extensions",
    label: "List Extensions",
    description: "List all installed extensions/tools. Use this to see what custom tools are available.",
    parameters: Type.Object({}),
    async execute(_toolCallId) {
        const registry = getExtensionRegistry();
        const extensions = await registry.listExtensions();
        const tools = registry.getAllTools();
        if (extensions.length === 0 && tools.length === 0) {
            return formatResult("No extensions installed yet.", {
                name: "extensions",
                action: "list",
                details: { count: 0, extensions: [] },
            });
        }
        const extensionList = extensions.map((ext) => ({
            name: ext.name,
            label: ext.label,
            description: ext.description,
            createdAt: new Date(ext.createdAt).toISOString(),
        }));
        const activeTools = tools.map((t) => ({
            name: t.name,
            label: t.label,
            description: t.description,
        }));
        const output = [
            `Installed Extensions (${extensions.length}):`,
            ...extensionList.map((ext) => `  - ${ext.name}: ${ext.label} - ${ext.description} (created: ${ext.createdAt})`),
            "",
            `Active Tools (${tools.length}):`,
            ...activeTools.map((t) => `  - ${t.name}: ${t.label} - ${t.description}`),
        ].join("\n");
        return formatResult(output, {
            name: "extensions",
            action: "list",
            details: { count: extensions.length, extensions: extensionList, tools: activeTools },
        });
    },
};
/**
 * Remove Extension Tool - Remove an installed extension
 */
export const removeExtensionTool = {
    name: "remove_extension",
    label: "Remove Extension",
    description: "Remove a previously installed extension/tool.",
    parameters: Type.Object({
        name: Type.String({ description: "Name of the extension to remove" }),
    }),
    async execute(_toolCallId, params) {
        const registry = getExtensionRegistry();
        const name = params.name.toLowerCase();
        // Check if it exists
        if (!registry.hasTool(name)) {
            throw new Error(`Extension "${name}" not found`);
        }
        // Unregister the tool
        registry.unregisterTool(name);
        // Delete from disk
        await registry.deleteExtension(name);
        return formatResult(`Extension "${name}" has been removed.`, {
            name,
            action: "removed",
        });
    },
};
/**
 * Reload Extensions Tool - Reload all extensions from disk
 */
export const reloadExtensionsTool = {
    name: "reload_extensions",
    label: "Reload Extensions",
    description: "Reload all extensions from disk. Use this after manually adding extension files.",
    parameters: Type.Object({}),
    async execute(_toolCallId) {
        const registry = getExtensionRegistry();
        // Clear existing dynamic tools (but not built-in ones)
        const currentTools = registry.getAllTools();
        for (const tool of currentTools) {
            // Only clear tools that were loaded from extensions
            if (tool.name !== "add_extension" &&
                tool.name !== "list_extensions" &&
                tool.name !== "remove_extension" &&
                tool.name !== "reload_extensions") {
                registry.unregisterTool(tool.name);
            }
        }
        // Reload from disk
        await registry.loadAllExtensions();
        const tools = registry.getAllTools().filter((t) => t.name !== "add_extension" &&
            t.name !== "list_extensions" &&
            t.name !== "remove_extension" &&
            t.name !== "reload_extensions");
        return formatResult(`Extensions reloaded. ${tools.length} extension tool(s) are now active.`, {
            name: "extensions",
            action: "reloaded",
            details: { count: tools.length },
        });
    },
};
/**
 * Get Extension Details Tool - Get details about a specific extension
 */
export const getExtensionTool = {
    name: "get_extension",
    label: "Get Extension",
    description: "Get details about a specific extension.",
    parameters: Type.Object({
        name: Type.String({ description: "Name of the extension" }),
    }),
    async execute(_toolCallId, params) {
        const registry = getExtensionRegistry();
        const name = params.name.toLowerCase();
        const extensions = await registry.listExtensions();
        const extension = extensions.find((e) => e.name === name);
        if (!extension) {
            throw new Error(`Extension "${name}" not found`);
        }
        return formatResult(`Extension: ${extension.label} (${extension.name})
Description: ${extension.description}
Created: ${new Date(extension.createdAt).toISOString()}
Updated: ${new Date(extension.updatedAt).toISOString()}
Parameters: ${JSON.stringify(extension.parameters, null, 2)}
Code:
${extension.code}`, {
            name: extension.name,
            action: "details",
            details: extension,
        });
    },
};
/**
 * Extension management tools
 */
export const extensionTools = [
    addExtensionTool,
    listExtensionsTool,
    removeExtensionTool,
    reloadExtensionsTool,
    getExtensionTool,
];
//# sourceMappingURL=tools.js.map