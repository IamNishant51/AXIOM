/**
 * Extension Registry - Dynamic tool management for Axiom
 * Allows tools to be added/removed at runtime
 */
import type { AgentTool } from "@axiom/agent-core";
export interface ExtensionDefinition {
    name: string;
    label: string;
    description: string;
    parameters: Record<string, any>;
    code: string;
    createdAt: number;
    updatedAt: number;
}
type ToolChangeListener = (tools: AgentTool[]) => void;
export declare class ExtensionRegistry {
    private tools;
    private listeners;
    private extensionsDir;
    private extensions;
    constructor(extensionsDir?: string);
    /**
     * Ensure extensions directory exists
     */
    private ensureExtensionsDir;
    /**
     * Register a new tool
     */
    registerTool(tool: AgentTool): void;
    /**
     * Unregister a tool
     */
    unregisterTool(name: string): boolean;
    /**
     * Get a tool by name
     */
    getTool(name: string): AgentTool | undefined;
    /**
     * Get all registered tools
     */
    getAllTools(): AgentTool[];
    /**
     * Get all tool names
     */
    getToolNames(): string[];
    /**
     * Check if a tool exists
     */
    hasTool(name: string): boolean;
    /**
     * Subscribe to tool changes
     */
    onToolsChange(listener: ToolChangeListener): () => void;
    /**
     * Notify listeners of tool changes
     */
    private notifyListeners;
    /**
     * Save an extension to disk
     */
    saveExtension(extension: ExtensionDefinition): Promise<void>;
    /**
     * Load an extension from disk
     */
    loadExtension(name: string): Promise<ExtensionDefinition | null>;
    /**
     * Delete an extension from disk
     */
    deleteExtension(name: string): Promise<boolean>;
    /**
     * List all saved extensions
     */
    listExtensions(): Promise<ExtensionDefinition[]>;
    /**
     * Load all extensions from disk and register their tools
     */
    loadAllExtensions(): Promise<void>;
    /**
     * Instantiate an extension from its definition
     */
    private instantiateExtension;
    /**
     * Create a new extension from user specification
     */
    createExtension(params: {
        name: string;
        label: string;
        description: string;
        parameterSchema: Record<string, any>;
        code: string;
    }): Promise<ExtensionDefinition>;
    /**
     * Get extensions directory
     */
    getExtensionsDir(): string;
}
export declare function getExtensionRegistry(): ExtensionRegistry;
export declare function createExtensionRegistry(extensionsDir?: string): ExtensionRegistry;
export {};
//# sourceMappingURL=registry.d.ts.map