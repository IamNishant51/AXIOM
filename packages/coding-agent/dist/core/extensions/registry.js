/**
 * Extension Registry - Dynamic tool management for Axiom
 * Allows tools to be added/removed at runtime
 */
import * as fs from "node:fs";
import * as path from "node:path";
export class ExtensionRegistry {
    tools = new Map();
    listeners = new Set();
    extensionsDir;
    extensions = new Map();
    constructor(extensionsDir) {
        this.extensionsDir =
            extensionsDir || path.join(process.env.HOME || "", ".axiom", "extensions");
        this.ensureExtensionsDir();
    }
    /**
     * Ensure extensions directory exists
     */
    ensureExtensionsDir() {
        if (!fs.existsSync(this.extensionsDir)) {
            fs.mkdirSync(this.extensionsDir, { recursive: true });
        }
    }
    /**
     * Register a new tool
     */
    registerTool(tool) {
        if (this.tools.has(tool.name)) {
            console.warn(`Tool "${tool.name}" already registered, overwriting`);
        }
        this.tools.set(tool.name, tool);
        this.notifyListeners();
    }
    /**
     * Unregister a tool
     */
    unregisterTool(name) {
        const deleted = this.tools.delete(name);
        if (deleted) {
            this.notifyListeners();
        }
        return deleted;
    }
    /**
     * Get a tool by name
     */
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * Get all registered tools
     */
    getAllTools() {
        return Array.from(this.tools.values());
    }
    /**
     * Get all tool names
     */
    getToolNames() {
        return Array.from(this.tools.keys());
    }
    /**
     * Check if a tool exists
     */
    hasTool(name) {
        return this.tools.has(name);
    }
    /**
     * Subscribe to tool changes
     */
    onToolsChange(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Notify listeners of tool changes
     */
    notifyListeners() {
        const tools = this.getAllTools();
        for (const listener of this.listeners) {
            listener(tools);
        }
    }
    /**
     * Save an extension to disk
     */
    async saveExtension(extension) {
        const filePath = path.join(this.extensionsDir, `${extension.name}.json`);
        extension.updatedAt = Date.now();
        await fs.promises.writeFile(filePath, JSON.stringify(extension, null, 2), "utf-8");
        this.extensions.set(extension.name, extension);
    }
    /**
     * Load an extension from disk
     */
    async loadExtension(name) {
        const filePath = path.join(this.extensionsDir, `${name}.json`);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        try {
            const content = await fs.promises.readFile(filePath, "utf-8");
            const extension = JSON.parse(content);
            this.extensions.set(name, extension);
            return extension;
        }
        catch {
            return null;
        }
    }
    /**
     * Delete an extension from disk
     */
    async deleteExtension(name) {
        const filePath = path.join(this.extensionsDir, `${name}.json`);
        if (!fs.existsSync(filePath)) {
            return false;
        }
        try {
            await fs.promises.unlink(filePath);
            this.extensions.delete(name);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * List all saved extensions
     */
    async listExtensions() {
        this.ensureExtensionsDir();
        try {
            const files = await fs.promises.readdir(this.extensionsDir);
            const extensions = [];
            for (const file of files) {
                if (!file.endsWith(".json"))
                    continue;
                try {
                    const content = await fs.promises.readFile(path.join(this.extensionsDir, file), "utf-8");
                    const extension = JSON.parse(content);
                    extensions.push(extension);
                }
                catch {
                    // Skip invalid files
                }
            }
            return extensions;
        }
        catch {
            return [];
        }
    }
    /**
     * Load all extensions from disk and register their tools
     */
    async loadAllExtensions() {
        const extensions = await this.listExtensions();
        for (const extension of extensions) {
            try {
                await this.instantiateExtension(extension);
            }
            catch (error) {
                console.error(`Failed to load extension "${extension.name}":`, error);
            }
        }
    }
    /**
     * Instantiate an extension from its definition
     */
    async instantiateExtension(extension) {
        // Clean up the code - remove CommonJS exports if present
        let code = extension.code
            .replace(/^exports\s*=\s*.*?;?\s*$/gm, "")
            .replace(/^module\.exports\s*=\s*.*?;?\s*$/gm, "")
            .trim();
        let executeCode;
        // Check for handler pattern like { ... handler: async function(params) {} }
        if (code.startsWith("{") && code.includes("handler")) {
            // Extract the handler function
            const handlerMatch = code.match(/handler\s*:\s*(?:async\s+)?function\s*(?:\w+)?\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*\}\s*;?\s*$/);
            if (handlerMatch) {
                executeCode = `
					const __handler = ${code};
					return (async () => {
						${handlerMatch[1]}
					})();
				`;
            }
            else {
                throw new Error("Could not parse handler from code");
            }
        }
        else if (!code.includes("return") && !code.includes("function")) {
            // Simple expression pattern - wrap it in return
            executeCode = `return (async () => ${code})();`;
        }
        else if (!code.includes("return")) {
            // Function definition without return - add return
            executeCode = `return (async () => { ${code} })();`;
        }
        else {
            // Has explicit return
            executeCode = `return (async () => { ${code} })();`;
        }
        const toolDef = {
            name: extension.name,
            label: extension.label,
            description: extension.description,
            parameters: extension.parameters,
            execute: new Function("toolCallId", "params", "signal", "onUpdate", `
				const context = {
					toolCallId,
					params,
					signal,
					onUpdate,
					require: (module) => {
						if (module === "fs") return require("node:fs");
						if (module === "path") return require("node:path");
						if (module === "os") return require("node:os");
						if (module === "crypto") return require("node:crypto");
						return null;
					},
					console: {
						log: (...args) => console.log("[extension]", ...args),
						error: (...args) => console.error("[extension]", ...args),
					},
				};
				${executeCode}
			`),
        };
        this.registerTool(toolDef);
        this.extensions.set(extension.name, extension);
    }
    /**
     * Create a new extension from user specification
     */
    async createExtension(params) {
        const extension = {
            name: params.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
            label: params.label,
            description: params.description,
            parameters: params.parameterSchema,
            code: params.code,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await this.saveExtension(extension);
        await this.instantiateExtension(extension);
        return extension;
    }
    /**
     * Get extensions directory
     */
    getExtensionsDir() {
        return this.extensionsDir;
    }
}
// Singleton instance
let registryInstance = null;
export function getExtensionRegistry() {
    if (!registryInstance) {
        registryInstance = new ExtensionRegistry();
    }
    return registryInstance;
}
export function createExtensionRegistry(extensionsDir) {
    registryInstance = new ExtensionRegistry(extensionsDir);
    return registryInstance;
}
//# sourceMappingURL=registry.js.map