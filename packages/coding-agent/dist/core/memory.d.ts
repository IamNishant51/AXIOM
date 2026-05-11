/**
 * Memory System - CLAUDE.md file detection and context loading
 * Similar to Claude Code's memory system
 */
export interface MemoryFile {
    path: string;
    name: string;
    content: string;
    loaded: boolean;
    size: number;
}
export interface MemoryContext {
    files: MemoryFile[];
    totalSize: number;
    projectRoot: string;
}
/**
 * Find CLAUDE.md files in the project
 */
export declare function findMemoryFiles(projectRoot: string): Promise<MemoryFile[]>;
/**
 * Load memory files and create context
 */
export declare function loadMemoryContext(projectRoot: string): Promise<MemoryContext>;
/**
 * Parse memory file content and extract instructions
 */
export declare function parseMemoryContent(content: string): {
    instructions: string;
    tags: string[];
    priority: "low" | "normal" | "high";
};
/**
 * Create system prompt addition from memory
 */
export declare function createMemorySystemPrompt(projectRoot: string, maxLength?: number): Promise<string | null>;
/**
 * Memory indicator for UI
 */
export declare function getMemoryIndicator(context: MemoryContext): {
    loaded: boolean;
    count: number;
    totalSize: number;
    files: string[];
};
//# sourceMappingURL=memory.d.ts.map