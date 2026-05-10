/**
 * Resource Loader - Load extensions, skills, prompts, and themes
 * Axiom Coding Agent
 */
/**
 * Extension definition
 */
export interface AxiomExtension {
    name: string;
    description?: string;
    version?: string;
    defaultExport?: (api: ExtensionAPI) => void;
}
/**
 * Extension API
 */
export interface ExtensionAPI {
    /** Register a custom tool */
    registerTool(tool: any): void;
    /** Register a slash command */
    registerCommand(name: string, handler: (args: string) => void | Promise<void>): void;
    /** Register keyboard shortcut */
    registerShortcut(keys: string, handler: () => void): void;
    /** Listen to events */
    on(event: string, handler: (data: any) => void): void;
    /** Get settings */
    getSetting(key: string): any;
    /** Add UI component */
    addComponent(component: any): void;
}
/**
 * Skill definition
 */
export interface Skill {
    name: string;
    description: string;
    trigger?: string;
    content: string;
}
/**
 * Prompt template
 */
export interface PromptTemplate {
    name: string;
    description?: string;
    content: string;
    variables: string[];
}
/**
 * Theme definition
 */
export interface Theme {
    name: string;
    colors: Record<string, string>;
}
/**
 * Resource loader - loads extensions, skills, prompts, themes
 */
export declare class ResourceLoader {
    private configDir;
    private extensions;
    private skills;
    private prompts;
    private themes;
    constructor(configDir?: string);
    /**
     * Load all resources
     */
    loadAll(projectDir?: string): Promise<void>;
    /**
     * Load extensions
     */
    loadExtensions(projectDir?: string): Promise<void>;
    /**
     * Load a single extension
     */
    private loadExtension;
    /**
     * Load skills
     */
    loadSkills(projectDir?: string): Promise<void>;
    /**
     * Load a single skill
     */
    private loadSkill;
    /**
     * Load prompt templates
     */
    loadPrompts(projectDir?: string): Promise<void>;
    /**
     * Load a single prompt template
     */
    private loadPrompt;
    /**
     * Load themes
     */
    loadThemes(projectDir?: string): Promise<void>;
    /**
     * Get all extensions
     */
    getExtensions(): AxiomExtension[];
    /**
     * Get all skills
     */
    getSkills(): Skill[];
    /**
     * Get all prompts
     */
    getPrompts(): PromptTemplate[];
    /**
     * Get all themes
     */
    getThemes(): Theme[];
    /**
     * Get theme by name
     */
    getTheme(name: string): Theme | undefined;
    /**
     * Expand prompt template variables
     */
    expandPrompt(name: string, variables: Record<string, string>): string;
}
/**
 * Create resource loader instance
 */
export declare function createResourceLoader(configDir?: string): ResourceLoader;
//# sourceMappingURL=resource-loader.d.ts.map