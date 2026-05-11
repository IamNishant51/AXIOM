/**
 * Extension Tools - Tools for managing extensions dynamically
 * SECURE VERSION - Protected built-in tools, enhanced validation
 */
import { Type } from "@sinclair/typebox";
import { getExtensionRegistry } from "./registry.js";
function formatResult(content, details) {
    return {
        content: [{ type: "text", text: content }],
        details,
    };
}
// Built-in tool names that cannot be removed
const PROTECTED_TOOLS = new Set([
    "read", "write", "edit", "bash", "grep", "find", "ls", "mkdir",
    "web_search", "fetch_url",
    "add_extension", "list_extensions", "remove_extension",
    "reload_extensions", "get_extension",
]);
/**
 * Add Extension Tool - Add a new tool/extension to the agent
 */
export const addExtensionTool = {
    name: "add_extension",
    label: "Add Extension",
    description: "Add a new tool/extension to the agent. Creates tools for tasks like generating passwords, sending emails, API calls, etc. Code runs in a sandbox with access to: fs, path, os, crypto modules.",
    parameters: Type.Object({
        name: Type.String({
            description: "Unique name (lowercase, underscores only, 2-50 chars)",
        }),
        label: Type.String({ description: "Human-readable label for the tool" }),
        description: Type.String({
            description: "Description of what this extension does",
        }),
        parameters: Type.Record(Type.String(), Type.Any(), {
            description: "JSON Schema for parameters",
        }),
        code: Type.String({
            description: "JavaScript code. Must return { content: [{type:'text', text: '...'}], details: {} }. Use params for input.",
        }),
    }),
    async execute(_toolCallId, params) {
        // Validate inputs
        if (!params.name || typeof params.name !== "string") {
            throw new Error("Name is required");
        }
        if (!params.label || typeof params.label !== "string") {
            throw new Error("Label is required");
        }
        if (!params.code || typeof params.code !== "string") {
            throw new Error("Code is required");
        }
        if (params.label.length > 100) {
            throw new Error("Label too long (max 100 characters)");
        }
        if (params.description && params.description.length > 500) {
            throw new Error("Description too long (max 500 characters)");
        }
        const registry = getExtensionRegistry();
        // Validate and sanitize name
        const name = params.name.toLowerCase().replace(/[^a-z0-9_]/g, "_").substring(0, 50);
        if (name.length < 2) {
            throw new Error("Extension name must be at least 2 characters");
        }
        if (PROTECTED_TOOLS.has(name)) {
            throw new Error(`"${name}" is a protected tool name`);
        }
        // Check if already exists
        if (registry.hasTool(name)) {
            throw new Error(`Extension "${name}" already exists. Use remove_extension first to replace it.`);
        }
        try {
            const extension = await registry.createExtension({
                name,
                label: params.label.substring(0, 100),
                description: (params.description || "").substring(0, 500),
                parameterSchema: params.parameters || {},
                code: params.code,
            });
            return formatResult(`Extension "${extension.label}" (${extension.name}) added successfully.`, {
                name: extension.name,
                action: "added",
                details: {
                    label: extension.label,
                    description: extension.description,
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
    description: "List all installed custom extensions/tools (not built-in tools).",
    parameters: Type.Object({}),
    async execute() {
        const registry = getExtensionRegistry();
        const extensions = await registry.listExtensions();
        if (extensions.length === 0) {
            return formatResult("No custom extensions installed.", {
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
        const output = [
            `Custom Extensions (${extensions.length}):`,
            "",
            ...extensionList.map((ext) => `• ${ext.name}: ${ext.label}\n  ${ext.description}\n  Created: ${ext.createdAt}`),
            "",
            "Use get_extension <name> for details.",
        ].join("\n");
        return formatResult(output, {
            name: "extensions",
            action: "list",
            details: { count: extensions.length, extensions: extensionList },
        });
    },
};
/**
 * Remove Extension Tool - Remove a custom extension
 */
export const removeExtensionTool = {
    name: "remove_extension",
    label: "Remove Extension",
    description: "Remove a previously installed custom extension. Built-in tools cannot be removed.",
    parameters: Type.Object({
        name: Type.String({ description: "Name of the extension to remove" }),
    }),
    async execute(_toolCallId, params) {
        if (!params.name || typeof params.name !== "string") {
            throw new Error("Extension name is required");
        }
        const name = params.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
        // Cannot remove built-in tools
        if (PROTECTED_TOOLS.has(name)) {
            throw new Error(`"${name}" is a protected tool and cannot be removed`);
        }
        const registry = getExtensionRegistry();
        if (!registry.hasTool(name)) {
            throw new Error(`Extension "${name}" not found`);
        }
        // Unregister and delete
        registry.unregisterTool(name);
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
    description: "Reload all custom extensions from disk. Use after manually adding extension files.",
    parameters: Type.Object({}),
    async execute() {
        const registry = getExtensionRegistry();
        // Get current custom tools (exclude protected)
        const currentTools = registry.getAllTools();
        for (const tool of currentTools) {
            if (!PROTECTED_TOOLS.has(tool.name)) {
                registry.unregisterTool(tool.name);
            }
        }
        // Reload from disk
        await registry.loadAllExtensions();
        const loadedExtensions = await registry.listExtensions();
        return formatResult(`Extensions reloaded. ${loadedExtensions.length} custom extension(s) active.`, {
            name: "extensions",
            action: "reloaded",
            details: { count: loadedExtensions.length },
        });
    },
};
/**
 * Get Extension Details Tool - Get details about a specific extension
 */
export const getExtensionTool = {
    name: "get_extension",
    label: "Get Extension",
    description: "Get details about a specific custom extension.",
    parameters: Type.Object({
        name: Type.String({ description: "Name of the extension" }),
    }),
    async execute(_toolCallId, params) {
        if (!params.name || typeof params.name !== "string") {
            throw new Error("Extension name is required");
        }
        const name = params.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
        const registry = getExtensionRegistry();
        const extensions = await registry.listExtensions();
        const extension = extensions.find((e) => e.name === name);
        if (!extension) {
            throw new Error(`Extension "${name}" not found`);
        }
        // Mask sensitive parts of code for display
        const displayCode = extension.code.length > 500
            ? extension.code.substring(0, 500) + "..."
            : extension.code;
        return formatResult(`Extension: ${extension.label} (${extension.name})
Description: ${extension.description}
Created: ${new Date(extension.createdAt).toISOString()}
Updated: ${new Date(extension.updatedAt).toISOString()}
Parameters: ${JSON.stringify(extension.parameters, null, 2)}
Code: ${displayCode}`, {
            name: extension.name,
            action: "details",
            details: extension,
        });
    },
};
export const extensionTools = [
    addExtensionTool,
    listExtensionsTool,
    removeExtensionTool,
    reloadExtensionsTool,
    getExtensionTool,
];
//# sourceMappingURL=tools.js.map