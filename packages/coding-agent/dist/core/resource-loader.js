/**
 * Resource Loader - Load extensions, skills, prompts, and themes
 * Axiom Coding Agent
 */
import * as fs from "node:fs";
import * as path from "node:path";
/**
 * Resource loader - loads extensions, skills, prompts, themes
 */
export class ResourceLoader {
    configDir;
    extensions = new Map();
    skills = new Map();
    prompts = new Map();
    themes = new Map();
    constructor(configDir) {
        this.configDir = configDir || path.join(process.env.HOME || "", ".axiom", "agent");
    }
    /**
     * Load all resources
     */
    async loadAll(projectDir) {
        await Promise.all([
            this.loadExtensions(projectDir),
            this.loadSkills(projectDir),
            this.loadPrompts(projectDir),
            this.loadThemes(projectDir),
        ]);
    }
    /**
     * Load extensions
     */
    async loadExtensions(projectDir) {
        const extensionDirs = [
            path.join(this.configDir, "extensions"),
            projectDir ? path.join(projectDir, ".axiom", "extensions") : null,
        ].filter(Boolean);
        for (const dir of extensionDirs) {
            if (!fs.existsSync(dir))
                continue;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (!file.endsWith(".js") && !file.endsWith(".ts"))
                    continue;
                try {
                    const ext = await this.loadExtension(path.join(dir, file));
                    if (ext) {
                        this.extensions.set(ext.name, ext);
                    }
                }
                catch (e) {
                    console.error(`Failed to load extension ${file}:`, e);
                }
            }
        }
    }
    /**
     * Load a single extension
     */
    async loadExtension(filePath) {
        // Dynamic import - simplified for now
        const code = fs.readFileSync(filePath, "utf-8");
        // Extract name from filename
        const name = path.basename(filePath, path.extname(filePath));
        return {
            name,
            description: `Extension from ${filePath}`,
            defaultExport: undefined, // Would need proper dynamic import
        };
    }
    /**
     * Load skills
     */
    async loadSkills(projectDir) {
        const skillDirs = [
            path.join(this.configDir, "skills"),
            path.join(process.env.HOME || "", ".agents", "skills"),
            projectDir ? path.join(projectDir, ".axiom", "skills") : null,
            projectDir ? path.join(projectDir, ".agents", "skills") : null,
        ].filter(Boolean);
        for (const dir of skillDirs) {
            if (!fs.existsSync(dir))
                continue;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory())
                    continue;
                const skillPath = path.join(dir, entry.name, "SKILL.md");
                if (fs.existsSync(skillPath)) {
                    try {
                        const skill = await this.loadSkill(skillPath, entry.name);
                        this.skills.set(skill.name, skill);
                    }
                    catch (e) {
                        console.error(`Failed to load skill ${entry.name}:`, e);
                    }
                }
            }
        }
    }
    /**
     * Load a single skill
     */
    async loadSkill(filePath, name) {
        const content = fs.readFileSync(filePath, "utf-8");
        // Parse YAML frontmatter
        const match = content.match(/^---\n([\s\S]*?)\n---\n/);
        let description = "";
        let trigger = "";
        if (match) {
            const frontmatter = match[1];
            const descMatch = frontmatter.match(/description:\s*(.*)/);
            const triggerMatch = frontmatter.match(/trigger:\s*(.*)/);
            if (descMatch)
                description = descMatch[1].trim();
            if (triggerMatch)
                trigger = triggerMatch[1].trim();
        }
        return {
            name,
            description,
            trigger,
            content,
        };
    }
    /**
     * Load prompt templates
     */
    async loadPrompts(projectDir) {
        const promptDirs = [
            path.join(this.configDir, "prompts"),
            projectDir ? path.join(projectDir, ".axiom", "prompts") : null,
        ].filter(Boolean);
        for (const dir of promptDirs) {
            if (!fs.existsSync(dir))
                continue;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (!file.endsWith(".md"))
                    continue;
                try {
                    const prompt = await this.loadPrompt(path.join(dir, file));
                    this.prompts.set(prompt.name, prompt);
                }
                catch (e) {
                    console.error(`Failed to load prompt ${file}:`, e);
                }
            }
        }
    }
    /**
     * Load a single prompt template
     */
    async loadPrompt(filePath) {
        const content = fs.readFileSync(filePath, "utf-8");
        const name = path.basename(filePath, ".md");
        // Extract variables
        const variableMatches = content.match(/\{\{(\w+)\}\}/g) || [];
        const variables = [...new Set(variableMatches.map((m) => m.slice(2, -2)))];
        return {
            name,
            content,
            variables,
        };
    }
    /**
     * Load themes
     */
    async loadThemes(projectDir) {
        const themeDirs = [
            path.join(this.configDir, "themes"),
            projectDir ? path.join(projectDir, ".axiom", "themes") : null,
        ].filter(Boolean);
        // Add built-in themes
        this.themes.set("dark", {
            name: "dark",
            colors: {
                background: "#1e1e1e",
                foreground: "#d4d4d4",
                accent: "#569cd6",
                error: "#f44747",
                success: "#4ec9b0",
            },
        });
        this.themes.set("light", {
            name: "light",
            colors: {
                background: "#ffffff",
                foreground: "#000000",
                accent: "#0066cc",
                error: "#d32f2f",
                success: "#388e3c",
            },
        });
        for (const dir of themeDirs) {
            if (!fs.existsSync(dir))
                continue;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (!file.endsWith(".json"))
                    continue;
                try {
                    const theme = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
                    this.themes.set(theme.name || file.replace(".json", ""), theme);
                }
                catch (e) {
                    console.error(`Failed to load theme ${file}:`, e);
                }
            }
        }
    }
    /**
     * Get all extensions
     */
    getExtensions() {
        return Array.from(this.extensions.values());
    }
    /**
     * Get all skills
     */
    getSkills() {
        return Array.from(this.skills.values());
    }
    /**
     * Get all prompts
     */
    getPrompts() {
        return Array.from(this.prompts.values());
    }
    /**
     * Get all themes
     */
    getThemes() {
        return Array.from(this.themes.values());
    }
    /**
     * Get theme by name
     */
    getTheme(name) {
        return this.themes.get(name);
    }
    /**
     * Expand prompt template variables
     */
    expandPrompt(name, variables) {
        const prompt = this.prompts.get(name);
        if (!prompt)
            return "";
        let result = prompt.content;
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
        }
        return result;
    }
}
/**
 * Create resource loader instance
 */
export function createResourceLoader(configDir) {
    return new ResourceLoader(configDir);
}
//# sourceMappingURL=resource-loader.js.map