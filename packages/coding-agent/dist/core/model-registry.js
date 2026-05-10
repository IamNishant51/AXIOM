/**
 * Model Registry - Manages models for the coding agent
 * Axiom Coding Agent
 */
import { getModel, getModels, getProviders } from "@axiom/ai";
/**
 * Default models by provider
 */
const DEFAULT_MODELS = {
    anthropic: "claude-sonnet-4-20250514",
    openai: "gpt-4o",
    google: "gemini-2.5-flash",
    groq: "llama-3.1-70b-versatile",
    xai: "grok-beta",
    cerebras: "llama-3.3-70b",
    mistral: "mistral-large-latest",
};
/**
 * Model registry for coding agent
 */
export class ModelRegistry {
    settings;
    preferredProvider;
    scopedModels = [];
    constructor(settings) {
        this.settings = settings;
        this.preferredProvider = settings.get("defaultProvider");
    }
    /**
     * Get the default model (auto-detects based on available API keys)
     * Prioritizes OpenCode since that's the working provider for this key
     */
    getDefaultModel() {
        // Prefer OpenCode first (known to work with the provided key)
        const opencodeKey = this.getApiKey("opencode");
        if (opencodeKey) {
            const model = getModel("opencode", "minimax-m2.5-free");
            if (model)
                return model;
        }
        // Then check preferred provider
        const provider = this.preferredProvider || this.settings.get("defaultProvider");
        if (provider && provider !== "opencode") {
            const apiKey = this.getApiKey(provider);
            if (apiKey) {
                const model = this.getDefaultModelForProvider(provider);
                if (model)
                    return model;
            }
        }
        // Auto-detect other providers
        const providers = getProviders();
        for (const p of providers) {
            if (p === "opencode")
                continue; // already checked
            const apiKey = this.getApiKey(p);
            if (apiKey) {
                const model = this.getDefaultModelForProvider(p);
                if (model)
                    return model;
            }
        }
        // Hard fallback to OpenCode
        const fallback = getModel("opencode", "minimax-m2.5-free");
        if (fallback)
            return fallback;
        // Last resort
        return getModel("anthropic", "claude-sonnet-4-20250514");
    }
    /**
     * Get model by ID
     */
    getModel(provider, modelId) {
        return getModel(provider, modelId);
    }
    /**
     * Get all available models
     */
    getAllModels() {
        const models = [];
        const providers = getProviders();
        for (const provider of providers) {
            const providerModels = getModels(provider);
            for (const model of providerModels) {
                models.push({
                    id: model.id,
                    name: model.name,
                    provider: model.provider,
                    contextWindow: model.contextWindow,
                    reasoning: model.reasoning,
                    input: model.input,
                });
            }
        }
        return models.sort((a, b) => a.name.localeCompare(b.name));
    }
    /**
     * Get models for a specific provider
     */
    getModelsForProvider(provider) {
        const providerModels = getModels(provider);
        return providerModels.map((model) => ({
            id: model.id,
            name: model.name,
            provider: model.provider,
            contextWindow: model.contextWindow,
            reasoning: model.reasoning,
            input: model.input,
        }));
    }
    /**
     * Get available providers
     */
    getAvailableProviders() {
        return getProviders();
    }
    /**
     * Set preferred provider
     */
    setPreferredProvider(provider) {
        this.preferredProvider = provider;
    }
    /**
     * Get preferred provider
     */
    getPreferredProvider() {
        return this.preferredProvider;
    }
    /**
     * Set scoped models (for Ctrl+P cycling)
     */
    setScopedModels(patterns) {
        this.scopedModels = patterns;
    }
    /**
     * Get scoped models
     */
    getScopedModels() {
        return this.scopedModels;
    }
    /**
     * Get next model in scope (for cycling)
     */
    getNextScopedModel(currentModel) {
        if (this.scopedModels.length === 0)
            return undefined;
        // Simple cycling - just cycle through all available
        const allModels = this.getAllModels();
        const currentIndex = allModels.findIndex((m) => m.id === currentModel);
        if (currentIndex === -1) {
            return allModels[0]?.id;
        }
        return allModels[(currentIndex + 1) % allModels.length]?.id;
    }
    /**
     * Resolve model from string (various formats)
     */
    resolveModel(modelStr) {
        if (!modelStr) {
            return this.getModelWithApiKey();
        }
        // Format: "provider/model" or just "model"
        if (modelStr.includes("/")) {
            const [provider, modelId] = modelStr.split("/");
            return getModel(provider, modelId);
        }
        // Try as direct model ID
        const model = getModel(this.preferredProvider || "anthropic", modelStr);
        if (model)
            return model;
        // Search all providers
        return getModel("openai", modelStr) || getModel("anthropic", modelStr) || getModel("google", modelStr);
    }
    /**
     * Get model that has an API key available (auto-detect)
     */
    getModelWithApiKey() {
        const providers = getProviders();
        for (const provider of providers) {
            const apiKey = this.getApiKey(provider);
            if (apiKey) {
                // Found a provider with API key - return its default model
                const model = this.getDefaultModelForProvider(provider);
                if (model)
                    return model;
            }
        }
        // Hard fallback
        const fallback = getModel("opencode", "minimax-m2.5-free");
        if (fallback)
            return fallback;
        return getModel("anthropic", "claude-sonnet-4-20250514");
    }
    /**
     * Get default model for a specific provider
     */
    getDefaultModelForProvider(provider) {
        const defaultModelIds = {
            opencode: "minimax-m2.5-free",
            anthropic: "claude-sonnet-4-20250514",
            openai: "gpt-4o",
            google: "gemini-2.5-flash",
            groq: "llama-3.1-70b-versatile",
            xai: "grok-beta",
            cerebras: "llama-3.3-70b",
        };
        const modelId = defaultModelIds[provider];
        if (modelId) {
            return getModel(provider, modelId);
        }
        return getModels(provider)[0];
    }
    /**
     * Get API key for provider
     */
    getApiKey(provider) {
        // First check settings
        const settingsKey = this.settings.getApiKey(provider);
        if (settingsKey)
            return settingsKey;
        // Fall back to environment
        const envVars = {
            anthropic: "ANTHROPIC_API_KEY",
            openai: "OPENAI_API_KEY",
            google: "GEMINI_API_KEY",
            groq: "GROQ_API_KEY",
            xai: "XAI_API_KEY",
            cerebras: "CEREBRAS_API_KEY",
            mistral: "MISTRAL_API_KEY",
            opencode: "OPENCODE_API_KEY",
        };
        const envVar = envVars[provider.toLowerCase()];
        if (envVar && process.env[envVar]) {
            return process.env[envVar];
        }
        return undefined;
    }
}
/**
 * Create model registry
 */
export function createModelRegistry(settings) {
    return new ModelRegistry(settings);
}
//# sourceMappingURL=model-registry.js.map