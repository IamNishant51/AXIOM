/**
 * Axiom CLI - Main interactive coding agent
 * Axiom Coding Agent
 */
/**
 * CLI options
 */
export interface CliOptions {
    model?: string;
    provider?: string;
    prompt?: string;
    session?: string;
    continue?: boolean;
    noSession?: boolean;
}
/**
 * Axiom CLI
 */
export declare class AxiomCli {
    private terminal;
    private tui;
    private settings;
    private sessionManager;
    private modelRegistry;
    private resourceLoader;
    private agent?;
    private editor;
    private running;
    constructor();
    /**
     * Create settings manager
     */
    private createSettingsManager;
    /**
     * Initialize the CLI
     */
    init(options: CliOptions): Promise<void>;
    /**
     * Build system prompt
     */
    private buildSystemPrompt;
    /**
     * Create new session
     */
    private createSession;
    /**
     * Resume existing session
     */
    private resumeSession;
    /**
     * Set up TUI
     */
    private setupTui;
    /**
     * Handle submit
     */
    private handleSubmit;
    /**
     * Handle slash commands
     */
    private handleCommand;
    /**
     * Show help
     */
    private showHelp;
    /**
     * Switch model
     */
    private switchModel;
    /**
     * Start new session
     */
    private newSession;
    /**
     * Handle agent events
     */
    private handleAgentEvent;
    /**
     * Run the CLI in interactive mode
     */
    run(): Promise<void>;
    /**
     * Run in non-interactive mode (command line prompt)
     */
    runNonInteractive(prompt: string): Promise<void>;
    /**
     * Interactive REPL - allows multiple prompts
     */
    runRepl(): Promise<void>;
    /**
     * Print the last assistant response
     */
    private printLastResponse;
    /**
     * Exit
     */
    private exit;
}
/**
 * Parse command line arguments
 */
export declare function parseArgs(args: string[]): CliOptions;
/**
 * Print help
 */
export declare function printHelp(): void;
/**
 * Main entry point
 */
export declare function main(): Promise<void>;
//# sourceMappingURL=cli.d.ts.map