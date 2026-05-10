/**
 * API Registry - Manages provider implementations
 * Axiom AI
 */

import type { Api, Context, Model, StreamOptions, AssistantMessageEvent } from "./types.js";

type ApiImpl = (model: Model<any>, context: Context, options?: StreamOptions) => AsyncIterable<any>;

const apiImpls = new Map<Api, ApiImpl>();

/**
 * Register an API implementation
 */
export function registerApi<TApi extends Api>(
	api: TApi,
	impl: ApiImpl,
): void {
	apiImpls.set(api, impl);
}

/**
 * Get API implementation
 */
export function getApi(api: Api): ApiImpl | undefined {
	return apiImpls.get(api);
}

/**
 * Check if API is registered
 */
export function hasApi(api: Api): boolean {
	return apiImpls.has(api);
}

/**
 * Get all registered APIs
 */
export function getRegisteredApis(): Api[] {
	return Array.from(apiImpls.keys());
}

// Import and register providers
import { registerAnthropicProvider } from "./providers/anthropic.js";
import { registerOpenAICompletionsProvider } from "./providers/openai-completions.js";
import { registerGoogleProvider } from "./providers/google.js";
import { registerOpenCodeProvider } from "./providers/opencode.js";

// Register all built-in providers
export function registerBuiltinApis(): void {
	registerAnthropicProvider();
	registerOpenAICompletionsProvider();
	registerGoogleProvider();
	registerOpenCodeProvider();
}

// Auto-register on import
registerBuiltinApis();

// Re-export env key functions
export { getEnvApiKey, hasEnvApiKey, getAllEnvApiKeys, getConfiguredProviders } from "./env-api-keys.js";