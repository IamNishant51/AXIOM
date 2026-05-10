/**
 * Model Registry - Manages models for the coding agent
 * Axiom Coding Agent
 */
import { type Model } from "@axiom/ai";
import type { SettingsManager } from "./settings-manager.js";
/**
 * Model info for display
 */
export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    contextWindow: number;
    reasoning: boolean;
    input: string[];
}
/**
 * Model registry for coding agent
 */
export declare class ModelRegistry {
    private settings;
    private preferredProvider?;
    private scopedModels;
    constructor(settings: SettingsManager);
    /**
     * Get the default model (auto-detects based on available API keys)
     * Prioritizes OpenCode since that's the working provider for this key
     */
    getDefaultModel(): Model<any>;
    /**
     * Get model by ID
     */
    getModel(provider: string, modelId: string): Model<any> | undefined;
    /**
     * Get all available models
     */
    getAllModels(): ModelInfo[];
    /**
     * Get models for a specific provider
     */
    getModelsForProvider(provider: string): ModelInfo[];
    /**
     * Get available providers
     */
    getAvailableProviders(): string[];
    /**
     * Set preferred provider
     */
    setPreferredProvider(provider: string): void;
    /**
     * Get preferred provider
     */
    getPreferredProvider(): string | undefined;
    /**
     * Set scoped models (for Ctrl+P cycling)
     */
    setScopedModels(patterns: string[]): void;
    /**
     * Get scoped models
     */
    getScopedModels(): string[];
    /**
     * Get next model in scope (for cycling)
     */
    getNextScopedModel(currentModel: string): string | undefined;
    /**
     * Resolve model from string (various formats)
     */
    resolveModel(modelStr: string): Model<any> | undefined;
    /**
     * Get model that has an API key available (auto-detect)
     */
    getModelWithApiKey(): Model<any>;
    /**
     * Get default model for a specific provider
     */
    getDefaultModelForProvider(provider: string): Model<any> | undefined;
    /**
     * Get API key for provider
     */
    getApiKey(provider: string): string | undefined;
}
/**
 * Create model registry
 */
export declare function createModelRegistry(settings: SettingsManager): ModelRegistry;
//# sourceMappingURL=model-registry.d.ts.map