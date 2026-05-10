/**
 * Settings Manager - Global and project-level configuration
 * Axiom Coding Agent
 */
import * as fs from "node:fs";
import * as path from "node:path";
/**
 * Settings manager - handles configuration from multiple sources
 */
export class SettingsManager {
    globalSettings = {};
    projectSettings = {};
    configDir;
    currentProjectDir;
    constructor(configDir) {
        this.configDir = configDir || path.join(process.env.HOME || "", ".axiom", "agent");
        this.loadGlobalSettings();
    }
    /**
     * Load global settings
     */
    loadGlobalSettings() {
        const settingsPath = path.join(this.configDir, "settings.json");
        if (fs.existsSync(settingsPath)) {
            try {
                this.globalSettings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
            }
            catch {
                this.globalSettings = {};
            }
        }
        // Ensure config directory exists
        fs.mkdirSync(this.configDir, { recursive: true });
    }
    /**
     * Set project directory for project-level settings
     */
    setProjectDir(dir) {
        this.currentProjectDir = dir;
        this.loadProjectSettings();
    }
    /**
     * Load project-level settings (.axiom/settings.json)
     */
    loadProjectSettings() {
        if (!this.currentProjectDir) {
            this.projectSettings = {};
            return;
        }
        const projectSettingsPath = path.join(this.currentProjectDir, ".axiom", "settings.json");
        if (fs.existsSync(projectSettingsPath)) {
            try {
                this.projectSettings = JSON.parse(fs.readFileSync(projectSettingsPath, "utf-8"));
            }
            catch {
                this.projectSettings = {};
            }
        }
        else {
            this.projectSettings = {};
        }
    }
    /**
     * Get a setting value (project overrides global)
     */
    get(key) {
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
    set(key, value) {
        this.globalSettings[key] = value;
        this.saveGlobalSettings();
    }
    /**
     * Set multiple global settings
     */
    setMany(settings) {
        this.globalSettings = { ...this.globalSettings, ...settings };
        this.saveGlobalSettings();
    }
    /**
     * Save global settings
     */
    saveGlobalSettings() {
        const settingsPath = path.join(this.configDir, "settings.json");
        fs.mkdirSync(this.configDir, { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify(this.globalSettings, null, 2), "utf-8");
    }
    /**
     * Get all settings merged (project + global)
     */
    getAll() {
        return { ...this.globalSettings, ...this.projectSettings };
    }
    /**
     * Get config directory
     */
    getConfigDir() {
        return this.configDir;
    }
    /**
     * Get API key for a provider
     */
    getApiKey(provider) {
        // Check settings
        const fromSettings = this.globalSettings.apiKeys?.[provider];
        if (fromSettings)
            return fromSettings;
        // Check environment variables
        const envKeys = {
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
    setApiKey(provider, key) {
        if (!this.globalSettings.apiKeys) {
            this.globalSettings.apiKeys = {};
        }
        this.globalSettings.apiKeys[provider] = key;
        this.saveGlobalSettings();
    }
    /**
     * Reset to defaults
     */
    reset() {
        this.globalSettings = {};
        this.saveGlobalSettings();
    }
    /**
     * Import settings from file
     */
    importFrom(filePath) {
        if (fs.existsSync(filePath)) {
            const imported = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            this.globalSettings = { ...this.globalSettings, ...imported };
            this.saveGlobalSettings();
        }
    }
    /**
     * Export settings to file
     */
    exportTo(filePath) {
        fs.writeFileSync(filePath, JSON.stringify(this.globalSettings, null, 2), "utf-8");
    }
}
/**
 * Default settings
 */
export const DEFAULT_SETTINGS = {
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
export function createSettingsManager() {
    return new SettingsManager();
}
//# sourceMappingURL=settings-manager.js.map