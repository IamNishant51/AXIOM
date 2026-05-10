/**
 * Model Registry - Manages available models and providers
 * Axiom AI
 */
// Registry storage
const providers = new Map();
const apis = new Map();
// Built-in model data (simplified - real version would have hundreds)
const BUILT_IN_MODELS = [
    // Anthropic
    {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        api: "anthropic-messages",
        provider: "anthropic",
        baseUrl: "https://api.anthropic.com",
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
        contextWindow: 200000,
        maxTokens: 8192,
    },
    {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        api: "anthropic-messages",
        provider: "anthropic",
        baseUrl: "https://api.anthropic.com",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
        contextWindow: 200000,
        maxTokens: 8192,
    },
    {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        api: "anthropic-messages",
        provider: "anthropic",
        baseUrl: "https://api.anthropic.com",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 0.8 },
        contextWindow: 200000,
        maxTokens: 4096,
    },
    // OpenAI
    {
        id: "gpt-4o",
        name: "GPT-4o",
        api: "openai-responses",
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 5, output: 15, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 16384,
    },
    {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        api: "openai-responses",
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 16384,
    },
    {
        id: "o1-preview",
        name: "OpenAI o1 Preview",
        api: "openai-responses",
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        reasoning: true,
        input: ["text"],
        cost: { input: 15, output: 60, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 32768,
    },
    // Google
    {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        api: "google-generative-ai",
        provider: "google",
        baseUrl: "https://generativelanguage.googleapis.com",
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 1000000,
        maxTokens: 8192,
    },
    {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        api: "google-generative-ai",
        provider: "google",
        baseUrl: "https://generativelanguage.googleapis.com",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 1000000,
        maxTokens: 8192,
    },
    // Groq (fast inference)
    {
        id: "llama-3.1-70b-versatile",
        name: "Llama 3.1 70B",
        api: "openai-completions",
        provider: "groq",
        baseUrl: "https://api.groq.com/openai/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0.59, output: 0.79, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 32768,
        maxTokens: 32768,
    },
    // Cerebras
    {
        id: "llama-3.3-70b",
        name: "Llama 3.3 70B",
        api: "openai-completions",
        provider: "cerebras",
        baseUrl: "https://api.cerebras.ai/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0.6, output: 0.6, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 4096,
    },
    // xAI
    {
        id: "grok-beta",
        name: "Grok Beta",
        api: "openai-completions",
        provider: "xai",
        baseUrl: "https://api.x.ai/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 5, output: 15, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 131072,
        maxTokens: 8192,
    },
    // OpenCode
    {
        id: "minimax-m2.5-free",
        name: "MiniMax M2.5 Free",
        api: "opencode-messages",
        provider: "opencode",
        baseUrl: "https://opencode.ai/zen",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
    },
];
// Initialize default providers
export function initializeProviders() {
    // Register built-in models
    const providerModels = new Map();
    for (const model of BUILT_IN_MODELS) {
        const existing = providerModels.get(model.provider) || [];
        existing.push(model);
        providerModels.set(model.provider, existing);
    }
    for (const [provider, models] of providerModels) {
        providers.set(provider, { name: provider, models });
    }
}
// Get all providers
export function getProviders() {
    if (providers.size === 0)
        initializeProviders();
    return Array.from(providers.keys());
}
// Get all models for a provider
export function getModels(provider) {
    if (providers.size === 0)
        initializeProviders();
    const meta = providers.get(provider);
    return meta?.models || [];
}
// Get a specific model
export function getModel(provider, modelId) {
    if (providers.size === 0)
        initializeProviders();
    // First try exact match
    const meta = providers.get(provider);
    if (meta) {
        const model = meta.models.find((m) => m.id === modelId);
        if (model)
            return model;
    }
    // Fall back to searching all providers
    for (const [, meta] of providers) {
        const model = meta.models.find((m) => m.id === modelId);
        if (model)
            return model;
    }
    // Check if it's a custom model (provider/id format)
    if (modelId.includes("/")) {
        const [prov, id] = modelId.split("/");
        return getModel(prov, id);
    }
    return undefined;
}
// Register a custom model
export function registerModel(model) {
    if (providers.size === 0)
        initializeProviders();
    const meta = providers.get(model.provider);
    if (meta) {
        meta.models.push(model);
    }
    else {
        providers.set(model.provider, { name: model.provider, models: [model] });
    }
}
// Initialize on module load
initializeProviders();
// Export models
export { BUILT_IN_MODELS };
//# sourceMappingURL=models.js.map