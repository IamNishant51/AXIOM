/**
 * API Registry - Manages provider implementations
 * Axiom AI
 */
const apiImpls = new Map();
/**
 * Register an API implementation
 */
export function registerApi(api, impl) {
    apiImpls.set(api, impl);
}
/**
 * Get API implementation
 */
export function getApi(api) {
    return apiImpls.get(api);
}
/**
 * Check if API is registered
 */
export function hasApi(api) {
    return apiImpls.has(api);
}
/**
 * Get all registered APIs
 */
export function getRegisteredApis() {
    return Array.from(apiImpls.keys());
}
// Import and register providers
import { registerAnthropicProvider } from "./providers/anthropic.js";
import { registerOpenAICompletionsProvider } from "./providers/openai-completions.js";
import { registerGoogleProvider } from "./providers/google.js";
import { registerOpenCodeProvider } from "./providers/opencode.js";
// Register all built-in providers
export function registerBuiltinApis() {
    registerAnthropicProvider();
    registerOpenAICompletionsProvider();
    registerGoogleProvider();
    registerOpenCodeProvider();
}
// Auto-register on import
registerBuiltinApis();
// Re-export env key functions
export { getEnvApiKey, hasEnvApiKey, getAllEnvApiKeys, getConfiguredProviders } from "./env-api-keys.js";
//# sourceMappingURL=api-registry.js.map