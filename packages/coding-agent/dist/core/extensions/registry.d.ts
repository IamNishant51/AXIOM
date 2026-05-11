/**
 * Extension Registry - Dynamic tool management for Axiom
 * SECURE VERSION - Sandboxed execution with strict security controls
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
    private ensureExtensionsDir;
    /**
     * Validate extension code for security issues
     */
    private validateCode;
    /**
     * Validate extension name
     */
    private validateName;
    registerTool(tool: AgentTool): void;
    unregisterTool(name: string): boolean;
    getTool(name: string): AgentTool | undefined;
    getAllTools(): AgentTool[];
    getToolNames(): string[];
    hasTool(name: string): boolean;
    onToolsChange(listener: ToolChangeListener): () => void;
    private notifyListeners;
    saveExtension(extension: ExtensionDefinition): Promise<void>;
    loadExtension(name: string): Promise<ExtensionDefinition | null>;
    deleteExtension(name: string): Promise<boolean>;
    listExtensions(): Promise<ExtensionDefinition[]>;
    loadAllExtensions(): Promise<void>;
    /**
     * SECURE: Instantiate extension with sandboxed execution
     */
    private instantiateExtension;
    createExtension(params: {
        name: string;
        label: string;
        description: string;
        parameterSchema: Record<string, any>;
        code: string;
    }): Promise<ExtensionDefinition>;
    getExtensionsDir(): string;
}
export declare function getExtensionRegistry(): ExtensionRegistry;
export declare function createExtensionRegistry(extensionsDir?: string): ExtensionRegistry;
export {};
//# sourceMappingURL=registry.d.ts.map