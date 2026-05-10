/**
 * Premium CLI - Using new tui-react App component
 * Matches Claude Code CLI look and feel
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { render } from "ink";
import { Agent } from "@axiom/agent-core";
import { setTheme, defaultTheme, App } from "@axiom/tui-react";
import { createSettingsManager } from "./core/settings-manager.js";
import { createModelRegistry } from "./core/model-registry.js";
import { SessionManager } from "./core/session-manager.js";
import { defaultTools } from "./core/tools/index.js";
// Use premium dark theme
setTheme(defaultTheme);
const MINIMAL_SYSTEM_PROMPT = `You are Axiom. Be concise. Complete tasks in one response when possible.`;
const COMMANDS = [
    { name: "/clear", description: "Clear conversation", action: "clear" },
    { name: "/help", description: "Show commands", action: "help" },
    { name: "/exit", description: "Exit", action: "exit" },
];
// Main App component that wraps everything
const AxiomApp = () => {
    const [messages, setMessages] = useState([]);
    const [aiState, setAiState] = useState("idle");
    const [aiMessage, setAiMessage] = useState("");
    const [aiToolName, setAiToolName] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const agentRef = useRef(null);
    const sessionManagerRef = useRef(null);
    // Initialize once
    useEffect(() => {
        const settings = createSettingsManager();
        const modelRegistry = createModelRegistry(settings);
        const model = modelRegistry.getDefaultModel();
        const apiKey = modelRegistry.getApiKey(model?.provider || "opencode");
        if (!apiKey) {
            console.error("No API key found. Set OPENCODE_API_KEY.");
            process.exit(1);
        }
        sessionManagerRef.current = new SessionManager();
        agentRef.current = createAgent(apiKey, model);
    }, []);
    const createAgent = (apiKey, model) => {
        const agent = new Agent({
            initialState: {
                systemPrompt: MINIMAL_SYSTEM_PROMPT,
                model,
                tools: defaultTools,
                messages: [],
            },
            getApiKey: async () => apiKey,
            toolExecution: "sequential",
        });
        agent.subscribe((event) => {
            if (event.type === "tool_execution_start") {
                setAiState("working");
                setAiMessage("Running");
                setAiToolName(event.toolName);
            }
            if (event.type === "tool_execution_end") {
                setAiState("thinking");
                setAiMessage("Thinking");
                setAiToolName("");
            }
        });
        return agent;
    };
    const handleMessage = useCallback(async (text) => {
        if (!agentRef.current)
            return;
        // Add user message
        const userMsg = {
            id: `msg-${Date.now()}`,
            role: "user",
            content: text,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        // Set thinking state
        setAiState("thinking");
        setAiMessage("Thinking");
        setIsStreaming(true);
        try {
            await agentRef.current.prompt(text);
            // Get response
            const allMessages = agentRef.current.state.messages;
            const assistantMsgs = allMessages.filter((m) => m.role === "assistant");
            const lastMsg = assistantMsgs[assistantMsgs.length - 1];
            const textContent = lastMsg?.content?.find((c) => c.type === "text");
            const thinkingContent = lastMsg?.content?.find((c) => c.type === "thinking");
            const assistantMsg = {
                id: `msg-${Date.now()}`,
                role: "assistant",
                content: textContent?.text || "",
                timestamp: Date.now(),
                thinking: thinkingContent?.thinking,
            };
            setMessages(prev => [...prev, assistantMsg]);
            setAiState("success");
            setAiMessage("Done");
            setTimeout(() => {
                setAiState("idle");
                setAiMessage("");
            }, 1500);
        }
        catch (error) {
            setAiState("error");
            setAiMessage("Error");
            setTimeout(() => setAiState("idle"), 2000);
        }
        setIsStreaming(false);
    }, []);
    const handleCommand = useCallback((cmd) => {
        switch (cmd) {
            case "clear":
                setMessages([]);
                break;
            case "exit":
                process.exit(0);
        }
    }, []);
    return (React.createElement(App, { messages: messages, onMessage: handleMessage, onCommand: handleCommand, aiState: aiState, aiMessage: aiMessage, aiToolName: aiToolName, isStreaming: isStreaming, commands: COMMANDS }));
};
// Non-TTY simple version
async function runSimple(prompt) {
    console.log("╭────────────────────────────────────────────────────────────╮");
    console.log("│  🤖 Axiom v0.1.0                                         │");
    console.log("╰────────────────────────────────────────────────────────────╯\n");
    const settings = createSettingsManager();
    const modelRegistry = createModelRegistry(settings);
    const model = modelRegistry.getDefaultModel();
    const apiKey = modelRegistry.getApiKey(model?.provider || "opencode");
    if (!apiKey) {
        console.error("Error: No API key. Set OPENCODE_API_KEY.");
        process.exit(1);
    }
    const toolEvents = [];
    const agent = new Agent({
        initialState: {
            systemPrompt: MINIMAL_SYSTEM_PROMPT,
            model,
            tools: defaultTools,
            messages: [],
        },
        getApiKey: async () => apiKey,
        toolExecution: "sequential",
    });
    agent.subscribe((event) => {
        if (event.type === "tool_execution_start")
            toolEvents.push(`[Running ${event.toolName}...]`);
        if (event.type === "tool_execution_end")
            toolEvents.push(`[${event.toolName} done]`);
    });
    console.log("🤖 Thinking...\n");
    const startTime = Date.now();
    await agent.prompt(prompt);
    const elapsed = Date.now() - startTime;
    if (toolEvents.length > 0) {
        console.log(toolEvents.join("\n"), "\n");
    }
    const allMessages = agent.state.messages;
    const assistantMsgs = allMessages.filter((m) => m.role === "assistant");
    const lastMsg = assistantMsgs[assistantMsgs.length - 1];
    const text = lastMsg?.content?.find((c) => c.type === "text");
    console.log(text?.text || "");
    let totalTokens = 0;
    for (const m of allMessages) {
        if (m.usage?.totalTokens)
            totalTokens += m.usage.totalTokens;
    }
    console.log(`\n⏱ ${elapsed}ms | 💰 ${totalTokens} tokens`);
}
export async function runPremiumCli(prompt) {
    const isTTY = process.stdin.isTTY;
    if (!isTTY) {
        if (!prompt) {
            console.log("Usage: axiom \"prompt\"");
            process.exit(1);
        }
        await runSimple(prompt);
        return;
    }
    render(React.createElement(AxiomApp, null));
}
//# sourceMappingURL=premium-cli.js.map