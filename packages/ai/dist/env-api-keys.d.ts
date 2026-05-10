/**
 * Environment API Key Detection
 * Axiom AI
 */
/**
 * Get API key from environment variables for a provider
 */
export declare function getEnvApiKey(provider: string): string | undefined;
/**
 * Check if an API key exists in environment for a provider
 */
export declare function hasEnvApiKey(provider: string): boolean;
/**
 * Get all available API keys from environment
 */
export declare function getAllEnvApiKeys(): Record<string, string>;
/**
 * List providers that have API keys configured
 */
export declare function getConfiguredProviders(): string[];
//# sourceMappingURL=env-api-keys.d.ts.map