/**
 * Settings Manager - Global and project-level configuration
 * Axiom Coding Agent
 */
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
export declare class SettingsManager {
    private globalSettings;
    private projectSettings;
    private configDir;
    private currentProjectDir?;
    constructor(configDir?: string);
    /**
     * Load global settings
     */
    private loadGlobalSettings;
    /**
     * Set project directory for project-level settings
     */
    setProjectDir(dir: string): void;
    /**
     * Load project-level settings (.axiom/settings.json)
     */
    private loadProjectSettings;
    /**
     * Get a setting value (project overrides global)
     */
    get<K extends keyof AxiomSettings>(key: K): AxiomSettings[K] | undefined;
    /**
     * Set a global setting
     */
    set<K extends keyof AxiomSettings>(key: K, value: AxiomSettings[K]): void;
    /**
     * Set multiple global settings
     */
    setMany(settings: Partial<AxiomSettings>): void;
    /**
     * Save global settings
     */
    private saveGlobalSettings;
    /**
     * Get all settings merged (project + global)
     */
    getAll(): AxiomSettings;
    /**
     * Get config directory
     */
    getConfigDir(): string;
    /**
     * Get API key for a provider
     */
    getApiKey(provider: string): string | undefined;
    /**
     * Set API key for a provider
     */
    setApiKey(provider: string, key: string): void;
    /**
     * Reset to defaults
     */
    reset(): void;
    /**
     * Import settings from file
     */
    importFrom(filePath: string): void;
    /**
     * Export settings to file
     */
    exportTo(filePath: string): void;
}
/**
 * Default settings
 */
export declare const DEFAULT_SETTINGS: AxiomSettings;
/**
 * Create settings manager instance
 */
export declare function createSettingsManager(): SettingsManager;
//# sourceMappingURL=settings-manager.d.ts.map