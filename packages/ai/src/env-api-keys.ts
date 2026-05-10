/**
 * Environment API Key Detection
 * Axiom AI
 */

// Environment variable mappings for different providers
const PROVIDER_ENV_VARS: Record<string, string[]> = {
	openai: ["OPENAI_API_KEY"],
	anthropic: ["ANTHROPIC_API_KEY", "ANTHROPIC_OAUTH_TOKEN"],
	google: ["GEMINI_API_KEY"],
	"google-vertex": ["GOOGLE_CLOUD_API_KEY", "GOOGLE_CLOUD_PROJECT", "GCLOUD_PROJECT"],
	azure: ["AZURE_OPENAI_API_KEY"],
	mistral: ["MISTRAL_API_KEY"],
	groq: ["GROQ_API_KEY"],
	cerebras: ["CEREBRAS_API_KEY"],
	xai: ["XAI_API_KEY"],
	openrouter: ["OPENROUTER_API_KEY"],
	"vercel-ai-gateway": ["AI_GATEWAY_API_KEY"],
	zai: ["ZAI_API_KEY"],
	minimax: ["MINIMAX_API_KEY"],
	huggingface: ["HUGGING_FACE_TOKEN"],
	opencode: ["OPENCODE_API_KEY"],
	"github-copilot": ["COPILOT_GITHUB_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"],
};

/**
 * Get API key from environment variables for a provider
 */
export function getEnvApiKey(provider: string): string | undefined {
	const envVars = PROVIDER_ENV_VARS[provider.toLowerCase()];
	if (!envVars) return undefined;

	for (const envVar of envVars) {
		const value = process.env[envVar];
		if (value) return value;
	}

	return undefined;
}

/**
 * Check if an API key exists in environment for a provider
 */
export function hasEnvApiKey(provider: string): boolean {
	return getEnvApiKey(provider) !== undefined;
}

/**
 * Get all available API keys from environment
 */
export function getAllEnvApiKeys(): Record<string, string> {
	const keys: Record<string, string> = {};

	for (const [provider, envVars] of Object.entries(PROVIDER_ENV_VARS)) {
		for (const envVar of envVars) {
			const value = process.env[envVar];
			if (value && !keys[provider]) {
				keys[provider] = value;
				break;
			}
		}
	}

	return keys;
}

/**
 * List providers that have API keys configured
 */
export function getConfiguredProviders(): string[] {
	const configured: string[] = [];

	for (const [provider] of Object.entries(PROVIDER_ENV_VARS)) {
		if (hasEnvApiKey(provider)) {
			configured.push(provider);
		}
	}

	return configured;
}