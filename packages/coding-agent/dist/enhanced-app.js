/**
 * EnhancedApp.tsx - Axiom CLI
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { useTheme, defaultTheme } from "@axiom/tui-react";
import { ToolOutput, MarkdownRenderer, StatusBar, ModeToggle, Canvas, } from "@axiom/tui-react";
import { createSettingsManager } from "./core/settings-manager.js";
import { createModelRegistry } from "./core/model-registry.js";
import { createExtensionRegistry, getExtensionRegistry, extensionTools } from "./core/extensions/index.js";
import { internetTools } from "./core/extensions/internet.js";
import { Agent } from "@axiom/agent-core";
import { defaultTools } from "./core/tools/index.js";
import { initDb } from "./storage/index.js";
import { getMemoryService } from "./memory/index.js";
import { getSessionManager } from "./session/index.js";
import { createBuildAgent } from "./agents/build-agent.js";
import { startPreviewServer } from "./workspace/server.js";
import { listTree, ensureWorkspace } from "./workspace/index.js";
import { buildSystemPrompt } from "./prompts/build-system.js";
// Initialize database
initDb();
import * as path from "node:path";
// Set theme
defaultTheme;
// Format duration
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0)
        return `${hours}h ${minutes % 60}m`;
    if (minutes > 0)
        return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
// Available providers
const PROVIDERS = [
    { id: "opencode", name: "OpenCode", envVar: "OPENCODE_API_KEY" },
    { id: "anthropic", name: "Anthropic", envVar: "ANTHROPIC_API_KEY" },
    { id: "openai", name: "OpenAI", envVar: "OPENAI_API_KEY" },
    { id: "google", name: "Google", envVar: "GEMINI_API_KEY" },
    { id: "groq", name: "Groq", envVar: "GROQ_API_KEY" },
    { id: "xai", name: "xAI", envVar: "XAI_API_KEY" },
    { id: "cerebras", name: "Cerebras", envVar: "CEREBRAS_API_KEY" },
];
// Available models per provider
const MODELS = {
    opencode: ["opencode"],
    anthropic: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5"],
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    google: ["gemini-2.5-pro", "gemini-2.5-flash"],
    groq: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
    xai: ["grok-2", "grok-2-mini"],
    cerebras: ["llama-3.3-70b"],
};
// Build commands list
function buildCommands(setMessages, setShowHelp, setCurrentModel, setReducedMotion, currentModel, reducedMotion) {
    return [
        {
            name: "/clear",
            description: "Clear conversation",
            action: () => setMessages(() => []),
        },
        {
            name: "/help",
            description: "Show all commands",
            action: () => setShowHelp(true),
        },
        {
            name: "/model",
            description: `Current: ${currentModel}`,
            action: () => { },
            subcommands: Object.entries(MODELS).flatMap(([provider, models]) => models.map((model) => ({
                name: `/model ${model}`,
                description: `${provider} - ${model}`,
                action: () => setCurrentModel(model),
            }))),
        },
        {
            name: "/provider",
            description: "Manage API providers",
            action: () => { },
            subcommands: PROVIDERS.map((p) => ({
                name: `/provider ${p.id}`,
                description: `${p.name} (${p.envVar})`,
                action: () => setCurrentModel(p.id),
            })),
        },
        {
            name: "/providers",
            description: "List all providers",
            action: () => { },
            subcommands: PROVIDERS.map((p) => ({
                name: `/providers ${p.id}`,
                description: `${p.name}: ${p.envVar}`,
                action: () => { },
            })),
        },
        {
            name: "/apikey",
            description: "Set API key for provider",
            action: () => { },
            subcommands: PROVIDERS.map((p) => ({
                name: `/apikey ${p.id} <key>`,
                description: `Set ${p.name} API key`,
                action: () => { },
            })),
        },
        {
            name: "/motion",
            description: reducedMotion ? "Enable animations" : "Reduce motion",
            action: () => setReducedMotion(!reducedMotion),
        },
        {
            name: "/exit",
            description: "Exit Axiom",
            action: () => process.exit(0),
        },
        {
            name: "/remember",
            description: "Save to memory: /remember <key> <value>",
            action: () => {
                // This will be handled in the input processing
            },
            subcommands: [
                { name: "/remember <key> <value>", description: "Save a memory", action: () => { } },
            ],
        },
        {
            name: "/recall",
            description: "Recall memory: /recall <key>",
            action: () => { },
        },
        {
            name: "/search",
            description: "Search memory: /search <query>",
            action: () => { },
        },
        {
            name: "/forget",
            description: "Delete memory: /forget <key>",
            action: () => { },
        },
        {
            name: "/memories",
            description: "List all memories",
            action: () => { },
        },
        {
            name: "/fork",
            description: "Fork current session",
            action: () => { },
        },
        {
            name: "/sessions",
            description: "List all sessions",
            action: () => { },
        },
        {
            name: "/snapshot",
            description: "Create session snapshot: /snapshot <desc>",
            action: () => { },
        },
        {
            name: "/snapshots",
            description: "List session snapshots",
            action: () => { },
        },
        {
            name: "/stats",
            description: "Show session statistics",
            action: () => { },
        },
    ];
}
// Memory command handler
function handleMemoryCommand(cmd, args, setMessages) {
    const memoryService = getMemoryService();
    if (cmd === "/memories") {
        // List all memories
        const memories = memoryService.search("", 50);
        const content = memories.length > 0
            ? memories.map(m => `• ${m.key}: ${m.value.substring(0, 100)}${m.value.length > 100 ? '...' : ''}`).join('\n')
            : "No memories stored.";
        const msg = {
            id: `system-${Date.now()}`,
            role: "assistant",
            content: `📝 Memory Bank\n${content}`,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, msg]);
        return true;
    }
    if (cmd === "/remember") {
        if (args.length < 2) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: "Usage: /remember <key> <value>",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
            return true;
        }
        const [key, ...valueParts] = args;
        const value = valueParts.join(" ");
        memoryService.autoSave(key, value);
        const msg = {
            id: `system-${Date.now()}`,
            role: "assistant",
            content: `✓ Saved to memory: ${key}`,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, msg]);
        return true;
    }
    if (cmd === "/recall") {
        if (args.length < 1) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: "Usage: /recall <key>",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
            return true;
        }
        const key = args[0];
        const value = memoryService.autoGet(key);
        if (value !== undefined) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: `🔑 ${key}: ${value}`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
        }
        else {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: `No memory found for key: ${key}`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
        }
        return true;
    }
    if (cmd === "/search") {
        if (args.length < 1) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: "Usage: /search <query>",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
            return true;
        }
        const query = args.join(" ");
        const results = memoryService.search(query, 10);
        const content = results.length > 0
            ? results.map(m => `• ${m.key}: ${m.value.substring(0, 100)}${m.value.length > 100 ? '...' : ''}`).join('\n')
            : `No memories found matching: "${query}"`;
        const msg = {
            id: `system-${Date.now()}`,
            role: "assistant",
            content: `🔍 Search results for "${query}":\n${content}`,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, msg]);
        return true;
    }
    if (cmd === "/forget") {
        if (args.length < 1) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: "Usage: /forget <key>",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
            return true;
        }
        const key = args[0];
        memoryService.forget(`auto_${key}`);
        const msg = {
            id: `system-${Date.now()}`,
            role: "assistant",
            content: `✓ Deleted memory: ${key}`,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, msg]);
        return true;
    }
    return false;
}
// Session command handler
function handleSessionCommand(cmd, args, setMessages) {
    const sessionManager = getSessionManager();
    if (cmd === "/sessions") {
        const sessions = sessionManager.listAllSessions();
        const content = sessions.length > 0
            ? sessions.map(s => `• ${s.title} (${s.model}) - ${new Date(s.createdAt).toLocaleDateString()}`).join('\n')
            : "No sessions found.";
        const msg = {
            id: `system-${Date.now()}`,
            role: "assistant",
            content: `📁 Sessions\n${content}`,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, msg]);
        return true;
    }
    if (cmd === "/fork") {
        const newSession = sessionManager.forkCurrentSession();
        sessionManager.setCurrentSession(newSession.id);
        const msg = {
            id: `system-${Date.now()}`,
            role: "assistant",
            content: `⑂ Forked session: ${newSession.title}`,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, msg]);
        return true;
    }
    if (cmd === "/snapshot") {
        const currentSession = sessionManager.getCurrentSession();
        if (!currentSession) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: "No active session to snapshot",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
            return true;
        }
        const description = args.join(" ") || undefined;
        try {
            const { createSnapshot } = require("./snapshot/index.js");
            const snapshot = createSnapshot(currentSession.id, description);
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: `📸 Snapshot created: ${snapshot.title}\nMessages: ${snapshot.messageCount}, Tokens: ${snapshot.tokenCount}`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
        }
        catch (e) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: `Failed to create snapshot: ${e}`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
        }
        return true;
    }
    if (cmd === "/snapshots") {
        const currentSession = sessionManager.getCurrentSession();
        if (!currentSession) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: "No active session",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
            return true;
        }
        try {
            const { listSnapshots } = require("./snapshot/index.js");
            const snapshots = listSnapshots(currentSession.id);
            const content = snapshots.length > 0
                ? snapshots.map((s) => `• ${s.title} - ${s.messageCount} msgs, ${s.tokenCount} tokens`).join('\n')
                : "No snapshots for this session.";
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: `📸 Snapshots\n${content}`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
        }
        catch (e) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: `Failed to list snapshots: ${e}`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
        }
        return true;
    }
    if (cmd === "/stats") {
        const currentSession = sessionManager.getCurrentSession();
        if (!currentSession) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: "No active session",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
            return true;
        }
        try {
            const { getToolStats } = require("./core/tool-invocations.js");
            const stats = getToolStats(currentSession.id);
            const content = `📊 Session Statistics\n\nTotal invocations: ${stats.totalInvocations}\nSuccessful: ${stats.successful}\nFailed: ${stats.failed}\nTotal duration: ${Math.round(stats.totalDuration / 1000)}s`;
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
        }
        catch (e) {
            const msg = {
                id: `system-${Date.now()}`,
                role: "assistant",
                content: `Failed to get stats: ${e}`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, msg]);
        }
        return true;
    }
    return false;
}
// Main Enhanced App Component
export const EnhancedApp = ({ onMessage, onExit, initialPrompt }) => {
    const theme = useTheme();
    const { exit } = useApp();
    // Settings
    const [reducedMotion, setReducedMotion] = useState(false);
    const [currentModel, setCurrentModel] = useState("opencode");
    // Message state
    const [messages, setMessages] = useState([]);
    const [currentThinking, setCurrentThinking] = useState("");
    const [currentContent, setCurrentContent] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    // Tool state
    const [toolCalls, setToolCalls] = useState([]);
    const [currentToolCall, setCurrentToolCall] = useState(null);
    // Command palette state
    const [showPalette, setShowPalette] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [paletteSearch, setPaletteSearch] = useState("");
    // Help dialog state
    const [showHelp, setShowHelp] = useState(false);
    // Simple timing state
    const [totalTokens, setTotalTokens] = useState(0);
    const [elapsedMs, setElapsedMs] = useState(0);
    // UI state
    const [aiState, setAiState] = useState("idle");
    const [connectionStatus, setConnectionStatus] = useState("connected");
    const [inputValue, setInputValue] = useState("");
    const [inputMode, setInputMode] = useState("normal");
    // Build mode state
    const [agentMode, setAgentMode] = useState("chat");
    const [previewPort, setPreviewPort] = useState(0);
    const [workspaceFiles, setWorkspaceFiles] = useState([]);
    const [isStreamingFile, setIsStreamingFile] = useState(false);
    const [currentStreamingFile, setCurrentStreamingFile] = useState(null);
    // Refs
    const agentRef = useRef(null);
    const buildAgentRef = useRef(null);
    const streamManagerRef = useRef(null);
    const processingStartRef = useRef(null);
    const lastTokenRef = useRef(0);
    const contentRef = useRef("");
    // Elapsed time tracking
    useEffect(() => {
        if (isStreaming && !processingStartRef.current) {
            processingStartRef.current = Date.now();
        }
        else if (!isStreaming) {
            processingStartRef.current = null;
        }
        const interval = setInterval(() => {
            if (processingStartRef.current) {
                setElapsedMs(Date.now() - processingStartRef.current);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isStreaming]);
    // Initialize agent
    useEffect(() => {
        const settings = createSettingsManager();
        const modelRegistry = createModelRegistry(settings);
        const model = modelRegistry.getDefaultModel();
        const apiKey = modelRegistry.getApiKey(model?.provider || "opencode");
        if (!apiKey) {
            console.error("No API key found. Set OPENCODE_API_KEY.");
            process.exit(1);
        }
        // Initialize extension registry
        const extensionsDir = path.join(settings.getConfigDir().replace("/agent", ""), "extensions");
        createExtensionRegistry(extensionsDir);
        const registry = getExtensionRegistry();
        registry.loadAllExtensions().catch(console.error);
        // Combine all tools
        const allTools = [...defaultTools, ...extensionTools, ...internetTools, ...registry.getAllTools()];
        agentRef.current = new Agent({
            initialState: {
                systemPrompt: "You are Axiom, a powerful coding assistant with tools.\n\nBuilt-in: read, write, edit, bash, grep, find, ls, mkdir\nInternet: web_search, fetch_url\nExtensions: add_extension, list_extensions, remove_extension, reload_extensions",
                model,
                tools: allTools,
                messages: [],
            },
            getApiKey: async () => apiKey,
            toolExecution: "sequential",
        });
        // Subscribe to extension changes
        registry.onToolsChange((newTools) => {
            if (agentRef.current) {
                agentRef.current.state.tools = [...defaultTools, ...extensionTools, ...internetTools, ...newTools];
            }
        });
        // Event batching for smooth updates
        let pendingState = null;
        let batchTimeout = null;
        const flushBatch = () => {
            if (!pendingState)
                return;
            if (pendingState.aiState !== undefined)
                setAiState(pendingState.aiState);
            if (pendingState.currentThinking !== undefined)
                setCurrentThinking(pendingState.currentThinking);
            if (pendingState.toolCallAdded)
                setToolCalls(prev => [...prev, pendingState.toolCallAdded]);
            if (pendingState.currentToolCall !== undefined)
                setCurrentToolCall(pendingState.currentToolCall);
            if (pendingState.currentContent !== undefined) {
                setCurrentContent(pendingState.currentContent);
                contentRef.current = pendingState.currentContent;
            }
            if (pendingState.totalTokens !== undefined)
                setTotalTokens(pendingState.totalTokens);
            pendingState = null;
            batchTimeout = null;
        };
        const scheduleBatch = (updates) => {
            // Merge updates
            pendingState = { ...pendingState, ...updates };
            // Schedule flush at end of event loop
            if (!batchTimeout) {
                batchTimeout = setTimeout(flushBatch, 0);
            }
        };
        // Subscribe to agent events
        agentRef.current.subscribe((event) => {
            switch (event.type) {
                case "thinking_start":
                    scheduleBatch({ aiState: "thinking", currentThinking: event.thinking || "" });
                    break;
                case "thinking_update":
                    scheduleBatch({ currentThinking: event.thinking || "" });
                    break;
                case "thinking_end":
                    scheduleBatch({ currentThinking: "" });
                    break;
                case "tool_execution_start":
                    const toolCall = {
                        id: `tool-${Date.now()}`,
                        name: event.toolName,
                        args: event.args || {},
                        status: "running",
                    };
                    scheduleBatch({ aiState: "working", currentToolCall: toolCall, toolCallAdded: toolCall });
                    break;
                case "tool_execution_end":
                    // Get the result directly to avoid stale closure
                    const result = event.result || "";
                    setToolCalls(prev => prev.map(tc => tc.id === pendingState?.toolCallAdded?.id
                        ? { ...tc, status: "done", result }
                        : tc));
                    scheduleBatch({ aiState: "thinking", currentToolCall: null });
                    break;
                case "text_delta":
                    // Batch text updates - only update every few characters
                    const newContent = contentRef.current + event.text;
                    if (newContent.length - contentRef.current.length >= 20 || event.text.length < 5) {
                        scheduleBatch({ currentContent: newContent, totalTokens: totalTokens + 1 });
                    }
                    contentRef.current = newContent;
                    break;
                case "message_complete":
                    flushBatch(); // Flush any pending updates
                    setAiState("success");
                    setTimeout(() => setAiState("idle"), 1500);
                    break;
                case "error":
                    flushBatch();
                    setAiState("error");
                    setTimeout(() => setAiState("idle"), 2000);
                    break;
            }
        });
        // Initialize build agent
        const conversationId = `conv-${Date.now()}`;
        const buildCallbacks = {
            onToolCall: (tc) => {
                const toolCall = {
                    id: tc.id,
                    name: tc.name,
                    args: tc.args,
                    status: "running",
                };
                setToolCalls(prev => [...prev, toolCall]);
            },
            onToolResult: (id, result, error) => {
                setToolCalls(prev => prev.map(tc => tc.id === id ? { ...tc, status: error ? "error" : "done", result } : tc));
            },
            onToken: (text) => {
                contentRef.current += text;
                setCurrentContent(contentRef.current);
            },
            onDone: () => {
                setAiState("success");
                setTimeout(() => setAiState("idle"), 1500);
                setIsStreaming(false);
            },
            onError: (err) => {
                setAiState("error");
                setIsStreaming(false);
            },
            onWorkspaceChanged: async () => {
                try {
                    const base = await ensureWorkspace(conversationId);
                    const files = await listTree(base);
                    setWorkspaceFiles(files);
                }
                catch { /* ignore */ }
            },
            onActivityUpdate: (activity) => {
                if (activity.kind === "tool") {
                    setAiState("working");
                }
                else if (activity.kind === "thinking") {
                    setAiState("thinking");
                }
                else if (activity.kind === "idle") {
                    setAiState("idle");
                }
            },
        };
        buildAgentRef.current = createBuildAgent(conversationId, buildCallbacks);
        // Start preview server for build mode
        startPreviewServer().then((port) => {
            setPreviewPort(port);
        }).catch(console.error);
        // Initial prompt
        if (initialPrompt) {
            handleSubmit(initialPrompt);
        }
    }, []);
    // Keyboard shortcuts
    const inputModeRef = useRef(inputMode);
    inputModeRef.current = inputMode;
    useInput((input, key) => {
        // Ctrl+C to interrupt
        if (input === "c" && key.ctrl) {
            agentRef.current?.cancel?.();
            setIsStreaming(false);
            setAiState("idle");
            return;
        }
        // Ctrl+V for vim mode
        if (input === "v" && key.ctrl) {
            setInputMode((prev) => (prev === "vim" ? "normal" : "vim"));
            return;
        }
        // Escape to exit vim mode
        if (key.escape && inputModeRef.current === "vim") {
            setInputMode("normal");
            return;
        }
        // Ctrl+R for reduced motion toggle
        if (input === "r" && key.ctrl) {
            setReducedMotion((prev) => !prev);
            return;
        }
    });
    // Handle message submit
    const handleSubmit = useCallback(async (text) => {
        if (!text.trim())
            return;
        // Add user message
        const userMsg = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setIsStreaming(true);
        setCurrentContent("");
        setCurrentThinking("");
        setToolCalls([]);
        setTotalTokens(0);
        setElapsedMs(0);
        contentRef.current = "";
        const assistantMsgId = `assistant-${Date.now()}`;
        try {
            if (agentMode === "chat") {
                // Chat mode - use regular agent
                if (!agentRef.current)
                    return;
                await agentRef.current.prompt(text);
                const allMessages = agentRef.current.state.messages;
                const assistantMsgs = allMessages.filter((m) => m.role === "assistant");
                const lastMsg = assistantMsgs[assistantMsgs.length - 1];
                const textContent = lastMsg?.content?.find((c) => c.type === "text");
                const thinkingContent = lastMsg?.content?.find((c) => c.type === "thinking");
                setMessages((prev) => {
                    const updated = [...prev];
                    const assistantIndex = updated.findIndex((m) => m.id === assistantMsgId);
                    const completedTools = toolCalls.filter(tc => tc.status === "done").map(tc => ({
                        name: tc.name,
                        args: tc.args,
                        result: tc.result
                    }));
                    if (assistantIndex >= 0) {
                        updated[assistantIndex] = {
                            ...updated[assistantIndex],
                            content: textContent?.text || currentContent || "Completed",
                            timestamp: Date.now(),
                            toolCalls: completedTools,
                        };
                    }
                    else {
                        updated.push({
                            id: assistantMsgId,
                            role: "assistant",
                            content: textContent?.text || currentContent || "Completed",
                            timestamp: Date.now(),
                            thinking: thinkingContent?.thinking,
                            toolCalls: completedTools,
                        });
                    }
                    return updated;
                });
            }
            else {
                // Build mode - use build agent
                if (!buildAgentRef.current)
                    return;
                const settings = createSettingsManager();
                const modelRegistry = createModelRegistry(settings);
                const model = modelRegistry.getDefaultModel();
                const apiKey = modelRegistry.getApiKey(model?.provider || "opencode");
                if (!apiKey) {
                    throw new Error("No API key configured");
                }
                // Build the request with system prompt
                const workspacePath = `~/.axiom/workspaces/build`;
                const previewHref = `http://127.0.0.1:${previewPort}/`;
                const systemPrompt = buildSystemPrompt(workspacePath, previewHref);
                const baseMessages = [{ role: "user", content: text }];
                const response = await fetch("https://api.opencode.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: model || "opencode",
                        messages: [
                            { role: "system", content: systemPrompt },
                            ...baseMessages
                        ],
                        stream: true,
                        max_tokens: 4000,
                    }),
                });
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                const reader = response.body?.getReader();
                if (!reader)
                    throw new Error("No response body");
                let buffer = "";
                const decoder = new TextDecoder();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;
                    // Process the buffer
                    await buildAgentRef.current.handleResponse(buffer, baseMessages);
                    // Check if done
                    if (!buffer.includes("<action") && !isStreamingFile) {
                        break;
                    }
                }
            }
        }
        catch (error) {
            console.error("Error:", error);
            setAiState("error");
        }
        setIsStreaming(false);
    }, [currentContent]);
    // Render thinking for a message (simplified - always visible)
    const renderThinking = useCallback((msg) => {
        if (!msg.thinking)
            return null;
        return (React.createElement(Box, { paddingLeft: 2, flexDirection: "column", marginTop: 1, borderStyle: "round", borderColor: theme.colors.inactive },
            React.createElement(Text, { dimColor: true, color: theme.colors.secondary }, "Reasoning:"),
            React.createElement(Text, { color: theme.colors.inactive, italic: true }, msg.thinking)));
    }, [theme]);
    // Render a message
    const renderMessage = useCallback((msg) => {
        const isUser = msg.role === "user";
        return (React.createElement(Box, { key: msg.id, flexDirection: "column", marginBottom: 2 },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { bold: true, color: isUser ? theme.colors.primary : theme.colors.claude }, isUser ? "❯" : "○"),
                React.createElement(Text, { color: theme.colors.inactive }, " "),
                React.createElement(Text, { bold: true, color: theme.colors.inactive }, isUser ? "You" : "Axiom")),
            React.createElement(Box, { paddingLeft: 2, flexDirection: "column" },
                !isUser && renderThinking(msg),
                React.createElement(MarkdownRenderer, { content: msg.content }),
                !isUser && msg.toolCalls && msg.toolCalls.length > 0 && (React.createElement(Box, { flexDirection: "column", marginTop: 1 }, msg.toolCalls.map((tool, idx) => (React.createElement(ToolOutput, { key: idx, toolName: tool.name, output: tool.result || "" }))))))));
    }, [renderThinking, theme]);
    // Render history
    const renderHistory = () => {
        if (messages.length === 0) {
            return (React.createElement(Box, { flexDirection: "column", alignItems: "center", justifyContent: "center", paddingY: 4 },
                React.createElement(Text, { dimColor: true, color: theme.colors.inactive }, "Type a message to start...")));
        }
        return messages.map((msg) => renderMessage(msg));
    };
    // Render current streaming content
    const renderStreamingContent = () => {
        if (!isStreaming && !currentContent)
            return null;
        return (React.createElement(Box, { flexDirection: "column", marginBottom: 2 },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { bold: true, color: theme.colors.claude }, "\u25CB"),
                React.createElement(Text, { color: theme.colors.inactive }, " "),
                React.createElement(Text, { bold: true, color: theme.colors.inactive }, "Axiom")),
            React.createElement(Box, { paddingLeft: 2, flexDirection: "column" },
                React.createElement(Box, { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
                    React.createElement(Text, { color: theme.colors.text }, currentContent),
                    isStreaming && (React.createElement(Text, { color: theme.colors.claude }, "\u258C"))),
                currentToolCall && (React.createElement(Box, { marginTop: 1 },
                    React.createElement(ToolOutput, { toolName: currentToolCall.name, command: currentToolCall.args?.command || currentToolCall.args?.path || JSON.stringify(currentToolCall.args), output: currentToolCall.result || "", isRunning: currentToolCall.status === "running" }))))));
    };
    // Render single spinner row
    const renderSpinnerRow = () => {
        if (!isStreaming)
            return null;
        const elapsed = formatDuration(elapsedMs);
        const message = currentThinking
            ? `thinking (${Math.round(elapsedMs / 1000)}s)`
            : "Thinking...";
        return (React.createElement(Box, null,
            React.createElement(Text, { dimColor: true, color: theme.colors.inactive }, message)));
    };
    // Render tool chain - now shown inline in streaming content
    const renderToolChain = () => {
        // Tool outputs are now shown inline in renderStreamingContent
        // This function kept for compatibility but returns null
        return null;
    };
    // Get all commands with subcommands flattened
    const getAllCommands = () => {
        const baseCommands = buildCommands(setMessages, setShowHelp, setCurrentModel, setReducedMotion, currentModel, reducedMotion);
        const allCommands = [];
        for (const cmd of baseCommands) {
            allCommands.push(cmd);
            if (cmd.subcommands) {
                allCommands.push(...cmd.subcommands);
            }
        }
        return allCommands;
    };
    // Filter commands by search
    const filteredCommands = showPalette
        ? getAllCommands().filter((cmd) => cmd.name.toLowerCase().includes(paletteSearch.toLowerCase()))
        : [];
    // Command palette component
    const CommandPalette = () => {
        if (!showPalette)
            return null;
        return (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.inactive, paddingX: 1, paddingY: 0 }, filteredCommands.length === 0 ? (React.createElement(Text, { color: theme.colors.inactive }, "No commands found")) : (filteredCommands.slice(0, 8).map((cmd, index) => (React.createElement(Box, { key: cmd.name, flexDirection: "row", paddingY: 0, ...(index === selectedIndex ? { backgroundColor: theme.colors.surface } : {}) },
                React.createElement(Text, { bold: index === selectedIndex, color: index === selectedIndex ? theme.colors.text : theme.colors.primary }, cmd.name),
                React.createElement(Text, { color: theme.colors.inactive }, " "),
                React.createElement(Text, { color: theme.colors.inactive, dimColor: index !== selectedIndex }, cmd.description)))))),
            React.createElement(Text, { dimColor: true, color: theme.colors.subtle }, "\u2191\u2193 navigate \u00B7 Enter select \u00B7 Esc close")));
    };
    // Help dialog component
    const HelpDialog = () => {
        if (!showHelp)
            return null;
        const commands = buildCommands(setMessages, setShowHelp, setCurrentModel, setReducedMotion, currentModel, reducedMotion);
        return (React.createElement(Box, { flexDirection: "column", marginBottom: 2, borderStyle: "round", borderColor: theme.colors.primary, paddingX: 2, paddingY: 1 },
            React.createElement(Text, { bold: true, color: theme.colors.primary }, "Axiom Commands"),
            React.createElement(Box, { marginTop: 1 }, commands.map((cmd) => (React.createElement(Box, { key: cmd.name, flexDirection: "row", marginY: 0 },
                React.createElement(Text, { bold: true, color: theme.colors.secondary }, cmd.name.padEnd(15)),
                React.createElement(Text, { color: theme.colors.text }, cmd.description))))),
            React.createElement(Box, { marginTop: 1, flexDirection: "column" },
                React.createElement(Text, { bold: true, color: theme.colors.inactive }, "Providers:"),
                PROVIDERS.map((p) => (React.createElement(Text, { key: p.id, color: theme.colors.textDim },
                    "\u2022 ",
                    p.name,
                    ": ",
                    p.envVar)))),
            React.createElement(Box, { marginTop: 1 },
                React.createElement(Text, { dimColor: true, color: theme.colors.subtle }, "[Esc] close"))));
    };
    // Simple input handler with command palette
    const SimpleInput = () => {
        const [value, setValue] = useState("");
        const valueRef = useRef("");
        useEffect(() => {
            valueRef.current = value;
        }, [value]);
        // Reset palette when not typing
        useEffect(() => {
            if (!value.startsWith("/")) {
                setShowPalette(false);
                setPaletteSearch("");
            }
        }, [value]);
        useInput((input, key) => {
            // Handle palette navigation
            if (showPalette) {
                if (key.upArrow || input === "k") {
                    setSelectedIndex((prev) => prev > 0 ? prev - 1 : filteredCommands.length - 1);
                    return;
                }
                if (key.downArrow || input === "j") {
                    setSelectedIndex((prev) => prev < filteredCommands.length - 1 ? prev + 1 : 0);
                    return;
                }
                if (key.return) {
                    const selected = filteredCommands[selectedIndex];
                    if (selected) {
                        selected.action();
                        setShowPalette(false);
                        setValue("");
                        setPaletteSearch("");
                        setSelectedIndex(0);
                    }
                    return;
                }
                if (key.escape) {
                    setShowPalette(false);
                    setValue("");
                    setPaletteSearch("");
                    setSelectedIndex(0);
                    return;
                }
            }
            // Handle backspace - delete last character only
            if (key.backspace || key.delete || input === "\x7f" || input === "\b") {
                setValue((prev) => {
                    // Only delete if there's something to delete and it's not empty
                    if (prev.length > 0) {
                        return prev.slice(0, -1); // Remove exactly one character
                    }
                    return prev;
                });
                return;
            }
            // Handle return/submit
            if (key.return) {
                if (valueRef.current.trim()) {
                    // Check if it's a command
                    if (valueRef.current.startsWith("/")) {
                        // Parse command and args
                        const parts = valueRef.current.trim().split(/\s+/);
                        const cmd = parts[0].toLowerCase();
                        const args = parts.slice(1);
                        // Check for session commands first
                        if (handleSessionCommand(cmd, args, setMessages)) {
                            setValue("");
                            setPaletteSearch("");
                            return;
                        }
                        // Check for memory commands
                        if (handleMemoryCommand(cmd, args, setMessages)) {
                            setValue("");
                            setPaletteSearch("");
                            return;
                        }
                        // Then check palette commands
                        const allCmds = getAllCommands();
                        const matchedCmd = allCmds.find((c) => c.name.toLowerCase() === valueRef.current.toLowerCase());
                        if (matchedCmd) {
                            matchedCmd.action();
                            setValue("");
                            setPaletteSearch("");
                            return;
                        }
                    }
                    handleSubmit(valueRef.current);
                    setValue("");
                    setPaletteSearch("");
                }
                return;
            }
            // Handle escape
            if (key.escape) {
                if (showHelp) {
                    setShowHelp(false);
                    return;
                }
                if (showPalette) {
                    setShowPalette(false);
                    setValue("");
                    setPaletteSearch("");
                    return;
                }
                return;
            }
            // Regular character input
            if (input && input.length === 1 && !key.ctrl && !key.meta && !key.backspace && !key.delete) {
                const charCode = input.charCodeAt(0);
                if ((charCode >= 32 && charCode <= 126) || charCode > 127) {
                    const newValue = value + input;
                    setValue(newValue);
                    // Show palette when typing /
                    if (newValue === "/") {
                        setShowPalette(true);
                        setSelectedIndex(0);
                        setPaletteSearch("");
                    }
                    else if (newValue.startsWith("/")) {
                        setPaletteSearch(newValue.slice(1));
                        // Auto-select first match
                        if (filteredCommands.length > 0) {
                            setSelectedIndex(0);
                        }
                    }
                }
            }
        });
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { bold: true, color: theme.colors.claude }, "\u276F"),
                React.createElement(Text, null, " "),
                React.createElement(Text, { color: theme.colors.text }, value),
                React.createElement(Text, { color: theme.colors.cursor }, "\u2588"))));
    };
    return (React.createElement(Box, { flexDirection: "column", height: "100%" },
        React.createElement(Box, { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { bold: true, color: theme.colors.primary }, "\u25B2"),
                React.createElement(Text, null, " "),
                React.createElement(Text, { bold: true, color: theme.colors.text }, "Axiom"),
                React.createElement(Text, { dimColor: true, color: theme.colors.subtle }, " \u00B7 "),
                React.createElement(Text, { dimColor: true, color: theme.colors.inactive }, currentModel),
                React.createElement(Text, null, "  "),
                React.createElement(ModeToggle, { activeMode: agentMode, onModeChange: setAgentMode })),
            React.createElement(Box, { flexDirection: "row", alignItems: "center", gap: 2 },
                React.createElement(Text, { dimColor: true, color: theme.colors.subtle }, "[/] commands"))),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true, color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")),
        React.createElement(Box, { flexDirection: "column", flexGrow: 1, overflow: "hidden" },
            React.createElement(HelpDialog, null),
            renderHistory(),
            renderStreamingContent(),
            renderSpinnerRow(),
            renderToolChain(),
            React.createElement(CommandPalette, null)),
        agentMode === "code" && previewPort > 0 && (React.createElement(Box, { marginTop: 1 },
            React.createElement(Canvas, { conversationId: "build", isStreaming: isStreaming, onClose: () => { }, previewPort: previewPort, onRefreshFiles: async () => {
                    const base = await ensureWorkspace("build");
                    return listTree(base);
                } }))),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true, color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")),
        React.createElement(StatusBar, { connectionStatus: connectionStatus, isProcessing: isStreaming, toolName: currentToolCall?.name, reducedMotion: reducedMotion, totalTokens: totalTokens }),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(SimpleInput, null))));
};
export default EnhancedApp;
//# sourceMappingURL=enhanced-app.js.map