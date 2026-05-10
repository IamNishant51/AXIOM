/**
 * API Registry - Manages provider implementations
 * Axiom AI
 */
import type { Api, Context, Model, StreamOptions } from "./types.js";
type ApiImpl = (model: Model<any>, context: Context, options?: StreamOptions) => AsyncIterable<any>;
/**
 * Register an API implementation
 */
export declare function registerApi<TApi extends Api>(api: TApi, impl: ApiImpl): void;
/**
 * Get API implementation
 */
export declare function getApi(api: Api): ApiImpl | undefined;
/**
 * Check if API is registered
 */
export declare function hasApi(api: Api): boolean;
/**
 * Get all registered APIs
 */
export declare function getRegisteredApis(): Api[];
export declare function registerBuiltinApis(): void;
export { getEnvApiKey, hasEnvApiKey, getAllEnvApiKeys, getConfiguredProviders } from "./env-api-keys.js";
//# sourceMappingURL=api-registry.d.ts.map