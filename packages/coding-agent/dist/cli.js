/**
 * Axiom CLI - Main interactive coding agent
 * Axiom Coding Agent
 */
import { Agent } from "@axiom/agent-core";
import { TUI, Text, Editor, Box, Spacer, ProcessTerminal } from "@axiom/tui";
import { createSettingsManager } from "./core/settings-manager.js";
import { SessionManager } from "./core/session-manager.js";
import { createModelRegistry } from "./core/model-registry.js";
import { createResourceLoader } from "./core/resource-loader.js";
import { defaultTools } from "./core/tools/index.js";
/**
 * Axiom CLI
 */
export class AxiomCli {
    terminal;
    tui;
    settings;
    sessionManager;
    modelRegistry;
    resourceLoader;
    agent;
    editor;
    running = false;
    constructor() {
        this.terminal = new ProcessTerminal();
        this.tui = new TUI(this.terminal);
        this.settings = this.createSettingsManager();
        this.sessionManager = new SessionManager();
        this.modelRegistry = createModelRegistry(this.settings);
        this.resourceLoader = createResourceLoader(this.settings.getConfigDir());
    }
    /**
     * Create settings manager
     */
    createSettingsManager() {
        // Use createSettingsManager factory
        return createSettingsManager();
    }
    /**
     * Initialize the CLI
     */
    async init(options) {
        // Load resources
        await this.resourceLoader.loadAll();
        // Set up model
        const model = options.model
            ? this.modelRegistry.resolveModel(options.model)
            : this.modelRegistry.getDefaultModel();
        if (!model) {
            console.error("Could not resolve model");
            process.exit(1);
        }
        // Check API key
        const apiKey = this.modelRegistry.getApiKey(model.provider);
        if (!apiKey) {
            console.error(`No API key found for ${model.provider}. Set ${model.provider.toUpperCase()}_API_KEY environment variable.`);
            process.exit(1);
        }
        // Create agent
        const tools = defaultTools;
        this.agent = new Agent({
            initialState: {
                systemPrompt: this.buildSystemPrompt(),
                model,
                thinkingLevel: "medium",
                tools,
                messages: [],
            },
            getApiKey: async (provider) => this.modelRegistry.getApiKey(provider),
        });
        // Subscribe to events
        this.agent.subscribe((event) => this.handleAgentEvent(event));
        // Create session if needed
        if (!options.noSession) {
            const sessionId = options.session || options.continue
                ? await this.resumeSession(options.session)
                : await this.createSession(options.prompt);
            if (sessionId) {
                console.log(`Session: ${sessionId}`);
            }
        }
        // Set up TUI
        this.setupTui();
    }
    /**
     * Build system prompt
     */
    buildSystemPrompt() {
        return `You are Axiom, a powerful coding assistant.

You have access to tools to help you:
- Read files (read)
- Write files (write)
- Execute shell commands (bash)
- Edit files (edit)
- Search files (grep)
- Find files (find)
- List directories (ls)

Be helpful, concise, and proactive. When the user asks for code, provide working solutions.`;
    }
    /**
     * Create new session
     */
    async createSession(initialPrompt) {
        const cwd = process.cwd();
        return await this.sessionManager.create(cwd, initialPrompt);
    }
    /**
     * Resume existing session
     */
    async resumeSession(sessionId) {
        if (sessionId) {
            await this.sessionManager.load(sessionId);
            const messages = this.sessionManager.getMessages();
            // Restore messages to agent
            if (this.agent && messages.length > 0) {
                this.agent.state.messages = messages;
            }
        }
        return this.sessionManager.getMetadata()?.id || "";
    }
    /**
     * Set up TUI
     */
    setupTui() {
        const theme = {
            borderColor: (s) => s, // Simple for now
        };
        // Header
        this.tui.addChild(new Text("🤖 Axiom - Terminal Coding Agent", { paddingY: 1 }));
        // Model info
        if (this.agent) {
            const modelInfo = `Model: ${this.agent.state.model.name} | Provider: ${this.agent.state.model.provider}`;
            this.tui.addChild(new Text(modelInfo, { paddingY: 0 }));
        }
        this.tui.addChild(new Spacer(1));
        // Editor
        this.editor = new Editor(theme);
        this.editor.setTerminal(this.terminal);
        // Auto-complete provider
        this.editor.setAutocompleteProvider({
            getSuggestions: (input) => {
                const commands = [
                    { value: "/help", label: "help", description: "Show help" },
                    { value: "/settings", label: "settings", description: "Open settings" },
                    { value: "/model", label: "model", description: "Switch model" },
                    { value: "/new", label: "new", description: "Start new session" },
                    { value: "/quit", label: "quit", description: "Exit Axiom" },
                ];
                return commands.filter((c) => c.label.startsWith(input.toLowerCase()));
            },
        });
        this.editor.onSubmit = (text) => this.handleSubmit(text);
        const editorBox = new Box(1, 0);
        editorBox.addChild(this.editor);
        this.tui.addChild(editorBox);
    }
    /**
     * Handle submit
     */
    async handleSubmit(text) {
        if (!text.trim())
            return;
        // Check for commands
        if (text.startsWith("/")) {
            this.handleCommand(text);
            return;
        }
        // Send to agent
        if (this.agent) {
            // Show thinking indicator
            this.tui.addChild(new Spacer(1));
            this.tui.addChild(new Text("🤖 Axiom is thinking...", { paddingY: 0 }));
            this.tui.requestRender();
            try {
                await this.agent.prompt(text);
                // Add response to UI
                const lastMessage = this.agent.state.messages[this.agent.state.messages.length - 1];
                if (lastMessage && lastMessage.role === "assistant") {
                    const textContent = lastMessage.content.find((c) => c.type === "text");
                    if (textContent?.text) {
                        this.tui.addChild(new Spacer(1));
                        this.tui.addChild(new Text(textContent.text, { paddingY: 1 }));
                    }
                }
            }
            catch (error) {
                this.tui.addChild(new Spacer(1));
                this.tui.addChild(new Text(`Error: ${error}`, { paddingY: 0 }));
            }
            // Clear editor
            this.editor.clear();
        }
        this.tui.requestRender();
    }
    /**
     * Handle slash commands
     */
    handleCommand(command) {
        const parts = command.split(" ");
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(" ");
        switch (cmd) {
            case "/help":
                this.showHelp();
                break;
            case "/quit":
            case "/exit":
                this.exit();
                break;
            case "/model":
                this.switchModel(args);
                break;
            case "/new":
                this.newSession();
                break;
            default:
                this.tui.addChild(new Text(`Unknown command: ${cmd}`, { paddingY: 0 }));
        }
        this.editor.clear();
        this.tui.requestRender();
    }
    /**
     * Show help
     */
    showHelp() {
        const helpText = `
Commands:
  /help          - Show this help
  /model [name]  - Switch model (use without args to list)
  /new           - Start new session
  /quit          - Exit Axiom

Keyboard shortcuts:
  Ctrl+C         - Clear editor
  Escape         - Cancel current operation
  Tab            - Autocomplete
  Enter          - Submit
  Shift+Enter   - New line
`;
        this.tui.addChild(new Text(helpText, { paddingY: 1 }));
    }
    /**
     * Switch model
     */
    switchModel(modelName) {
        if (!modelName) {
            const models = this.modelRegistry.getAllModels().slice(0, 10);
            this.tui.addChild(new Text("Available models:", { paddingY: 0 }));
            for (const m of models) {
                this.tui.addChild(new Text(`  ${m.provider}/${m.id} - ${m.name}`, { paddingY: 0 }));
            }
            return;
        }
        const model = this.modelRegistry.resolveModel(modelName);
        if (model && this.agent) {
            this.agent.state.model = model;
            this.tui.addChild(new Text(`Switched to ${model.name}`, { paddingY: 0 }));
        }
        else {
            this.tui.addChild(new Text(`Unknown model: ${modelName}`, { paddingY: 0 }));
        }
    }
    /**
     * Start new session
     */
    async newSession() {
        const sessionId = await this.createSession();
        if (this.agent) {
            this.agent.reset();
        }
        this.tui.addChild(new Text(`New session: ${sessionId}`, { paddingY: 0 }));
    }
    /**
     * Handle agent events
     */
    handleAgentEvent(event) {
        switch (event.type) {
            case "agent_start":
                // Started thinking
                break;
            case "tool_execution_start":
                // Running a tool
                break;
            case "tool_execution_end":
                // Tool finished
                break;
            case "message_update":
                // Streaming response
                break;
            case "agent_end":
                // Done
                break;
        }
    }
    /**
     * Run the CLI in interactive mode
     */
    async run() {
        this.running = true;
        this.tui.start();
        // Handle input directly
        process.stdin.setRawMode(true);
        process.stdin.on("data", (data) => {
            const input = data.toString("utf-8");
            this.editor.handleInput(input);
            this.tui.requestRender();
        });
    }
    /**
     * Run in non-interactive mode (command line prompt)
     */
    async runNonInteractive(prompt) {
        if (!this.agent) {
            console.error("Agent not initialized");
            return;
        }
        // Interactive REPL mode - allows multiple prompts
        if (!prompt) {
            await this.runRepl();
            return;
        }
        console.log("\n🤖 Processing...\n");
        // Subscribe to agent events for debugging
        this.agent.subscribe((event) => {
            if (event.type === "tool_execution_start") {
                console.error(`[Tool] ${event.toolName} running...`);
            }
            if (event.type === "tool_execution_end") {
                console.error(`[Tool] ${event.toolName} done`);
            }
        });
        try {
            await this.agent.prompt(prompt);
            this.printLastResponse();
        }
        catch (error) {
            console.error(`Error: ${error}`);
        }
    }
    /**
     * Interactive REPL - allows multiple prompts
     */
    async runRepl() {
        if (!this.agent) {
            console.error("Agent not initialized");
            return;
        }
        const readline = await import("node:readline");
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: "🤖 Axiom > ",
        });
        console.log("\n╔═══════════════════════════════════════════════════╗");
        console.log("║     Axiom Interactive Mode - Type your prompt     ║");
        console.log("║     Type 'exit' or 'quit' to leave                ║");
        console.log("╚═══════════════════════════════════════════════════╝\n");
        rl.prompt();
        rl.on("line", async (line) => {
            const input = line.trim();
            if (!input) {
                rl.prompt();
                return;
            }
            if (input === "exit" || input === "quit") {
                console.log("Goodbye! 👋");
                rl.close();
                return;
            }
            if (input === "clear") {
                console.clear();
                rl.prompt();
                return;
            }
            console.log("\n🤖 Processing...\n");
            try {
                await this.agent.prompt(input);
                this.printLastResponse();
            }
            catch (error) {
                console.error(`Error: ${error}`);
            }
            rl.prompt();
        });
        rl.on("close", () => {
            process.exit(0);
        });
    }
    /**
     * Print the last assistant response
     */
    printLastResponse() {
        const lastMessage = this.agent.state.messages[this.agent.state.messages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
            for (const content of lastMessage.content) {
                if (content.type === "text") {
                    console.log(content.text);
                }
                if (content.type === "thinking") {
                    // Optionally show thinking
                }
                if (content.type === "toolCall") {
                    console.log(`\n[Tool: ${content.name}]`);
                }
            }
            // Print usage stats
            const lastMsg = lastMessage;
            if (lastMsg?.usage) {
                console.log(`\n📊 Usage: ${lastMsg.usage.totalTokens} tokens`);
            }
        }
    }
    /**
     * Exit
     */
    exit() {
        this.running = false;
        this.tui.stop();
        process.exit(0);
    }
}
/**
 * Parse command line arguments
 */
export function parseArgs(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "-h" || arg === "--help") {
            printHelp();
            process.exit(0);
        }
        else if (arg === "-m" || arg === "--model") {
            options.model = args[++i];
        }
        else if (arg === "-p" || arg === "--provider") {
            options.provider = args[++i];
        }
        else if (arg === "-c" || arg === "--continue") {
            options.continue = true;
        }
        else if (arg === "-r" || arg === "--resume") {
            options.session = args[++i];
        }
        else if (arg === "--no-session") {
            options.noSession = true;
        }
        else if (!arg.startsWith("-")) {
            options.prompt = arg;
        }
    }
    // If no prompt provided, run in interactive REPL mode
    return options;
}
/**
 * Print help
 */
export function printHelp() {
    console.log(`
Axiom - Terminal Coding Agent

Usage:
  axiom                    # Interactive REPL mode
  axiom "prompt"           # Single prompt (non-interactive)
  axiom -c                 # Continue last session
  axiom -r <id>            # Resume specific session

Options:
  -h, --help           Show this help
  -m, --model <model> Model to use (e.g., minimax-m2.5-free)
  -p, --provider <provider> Provider (e.g., opencode, anthropic)
  -c, --continue       Continue most recent session
  -r, --resume <id>    Resume specific session
  --no-session         Ephemeral mode (don't save)

Environment Variables:
  ANTHROPIC_API_KEY    Anthropic Claude API key
  OPENAI_API_KEY       OpenAI API key
  GEMINI_API_KEY      Google Gemini API key

Examples:
  axiom "List files in current directory"
  axiom -m gpt-4o "Write a hello world program"
  axiom -c "Continue working on my project"
`);
}
/**
 * Main entry point
 */
export async function main() {
    const args = process.argv.slice(2);
    const options = parseArgs(args);
    // Show banner
    console.log(`
╔═══════════════════════════════════════════════════╗
║               🤖 Axiom v0.1.0                     ║
║         Terminal Coding Agent                    ║
╚═══════════════════════════════════════════════════╝
`);
    const cli = new AxiomCli();
    await cli.init(options);
    // If a prompt was provided on command line, run once
    // Otherwise, start interactive REPL
    if (options.prompt) {
        await cli.runNonInteractive(options.prompt);
    }
    else {
        // Interactive REPL mode
        await cli.runRepl();
    }
}
//# sourceMappingURL=cli.js.map