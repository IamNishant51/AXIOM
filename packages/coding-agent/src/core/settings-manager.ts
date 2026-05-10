/**
 * Settings Manager - Global and project-level configuration
 * Axiom Coding Agent
 */

import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Axiom settings
 */
export interface AxiomSettings {
	/** Thinking/reasoning level */
	thinkingLevel?: "off" | "minimal" | "low" | "medium" | "high" | "xhigh";
	/** Theme name */
	theme?: "dark" | "light";
	/** Default model */
	defaultModel?: string;
	/** Default provider */
	defaultProvider?: string;
	/** Message delivery mode */
	steeringMode?: "one-at-a-time" | "all";
	/** Follow-up message mode */
	followUpMode?: "one-at-a-time" | "all";
	/** Transport preference */
	transport?: "sse" | "websocket" | "auto";
	/** Session directory */
	sessionDir?: string;
	/** Auto-compaction enabled */
	autoCompact?: boolean;
	/** Custom keybindings file */
	keybindingsFile?: string;
	/** Extensions directory */
	extensionsDir?: string;
	/** Skills directory */
	skillsDir?: string;
	/** Prompts directory */
	promptsDir?: string;
	/** Themes directory */
	themesDir?: string;
	/** Custom tools to enable (default: all) */
	tools?: string[];
	/** API keys by provider */
	apiKeys?: Record<string, string>;
}

/**
 * Settings manager - handles configuration from multiple sources
 */
export class SettingsManager {
	private globalSettings: AxiomSettings = {};
	private projectSettings: AxiomSettings = {};
	private configDir: string;
	private currentProjectDir?: string;

	constructor(configDir?: string) {
		this.configDir = configDir || path.join(process.env.HOME || "", ".axiom", "agent");
		this.loadGlobalSettings();
	}

	/**
	 * Load global settings
	 */
	private loadGlobalSettings(): void {
		const settingsPath = path.join(this.configDir, "settings.json");

		if (fs.existsSync(settingsPath)) {
			try {
				this.globalSettings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
			} catch {
				this.globalSettings = {};
			}
		}

		// Ensure config directory exists
		fs.mkdirSync(this.configDir, { recursive: true });
	}

	/**
	 * Set project directory for project-level settings
	 */
	setProjectDir(dir: string): void {
		this.currentProjectDir = dir;
		this.loadProjectSettings();
	}

	/**
	 * Load project-level settings (.axiom/settings.json)
	 */
	private loadProjectSettings(): void {
		if (!this.currentProjectDir) {
			this.projectSettings = {};
			return;
		}

		const projectSettingsPath = path.join(this.currentProjectDir, ".axiom", "settings.json");

		if (fs.existsSync(projectSettingsPath)) {
			try {
				this.projectSettings = JSON.parse(fs.readFileSync(projectSettingsPath, "utf-8"));
			} catch {
				this.projectSettings = {};
			}
		} else {
			this.projectSettings = {};
		}
	}

	/**
	 * Get a setting value (project overrides global)
	 */
	get<K extends keyof AxiomSettings>(key: K): AxiomSettings[K] | undefined {
		// Project settings take precedence
		if (this.projectSettings[key] !== undefined) {
			return this.projectSettings[key];
		}

		// Fall back to global settings
		return this.globalSettings[key];
	}

	/**
	 * Set a global setting
	 */
	set<K extends keyof AxiomSettings>(key: K, value: AxiomSettings[K]): void {
		this.globalSettings[key] = value;
		this.saveGlobalSettings();
	}

	/**
	 * Set multiple global settings
	 */
	setMany(settings: Partial<AxiomSettings>): void {
		this.globalSettings = { ...this.globalSettings, ...settings };
		this.saveGlobalSettings();
	}

	/**
	 * Save global settings
	 */
	private saveGlobalSettings(): void {
		const settingsPath = path.join(this.configDir, "settings.json");
		fs.mkdirSync(this.configDir, { recursive: true });
		fs.writeFileSync(settingsPath, JSON.stringify(this.globalSettings, null, 2), "utf-8");
	}

	/**
	 * Get all settings merged (project + global)
	 */
	getAll(): AxiomSettings {
		return { ...this.globalSettings, ...this.projectSettings };
	}

	/**
	 * Get config directory
	 */
	getConfigDir(): string {
		return this.configDir;
	}

	/**
	 * Get API key for a provider
	 */
	getApiKey(provider: string): string | undefined {
		// Check settings
		const fromSettings = this.globalSettings.apiKeys?.[provider];
		if (fromSettings) return fromSettings;

		// Check environment variables
		const envKeys: Record<string, string> = {
			anthropic: "ANTHROPIC_API_KEY",
			openai: "OPENAI_API_KEY",
			google: "GEMINI_API_KEY",
			groq: "GROQ_API_KEY",
			xai: "XAI_API_KEY",
			mistral: "MISTRAL_API_KEY",
		};

		const envVar = envKeys[provider.toLowerCase()];
		if (envVar && process.env[envVar]) {
			return process.env[envVar];
		}

		return undefined;
	}

	/**
	 * Set API key for a provider
	 */
	setApiKey(provider: string, key: string): void {
		if (!this.globalSettings.apiKeys) {
			this.globalSettings.apiKeys = {};
		}
		this.globalSettings.apiKeys[provider] = key;
		this.saveGlobalSettings();
	}

	/**
	 * Reset to defaults
	 */
	reset(): void {
		this.globalSettings = {};
		this.saveGlobalSettings();
	}

	/**
	 * Import settings from file
	 */
	importFrom(filePath: string): void {
		if (fs.existsSync(filePath)) {
			const imported = JSON.parse(fs.readFileSync(filePath, "utf-8"));
			this.globalSettings = { ...this.globalSettings, ...imported };
			this.saveGlobalSettings();
		}
	}

	/**
	 * Export settings to file
	 */
	exportTo(filePath: string): void {
		fs.writeFileSync(filePath, JSON.stringify(this.globalSettings, null, 2), "utf-8");
	}
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: AxiomSettings = {
	thinkingLevel: "medium",
	theme: "dark",
	transport: "sse",
	autoCompact: true,
	steeringMode: "one-at-a-time",
	followUpMode: "one-at-a-time",
};

/**
 * Create settings manager instance
 */
export function createSettingsManager(): SettingsManager {
	return new SettingsManager();
}