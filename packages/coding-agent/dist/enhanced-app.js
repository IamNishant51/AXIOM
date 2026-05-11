/**
 * EnhancedApp.tsx - Full Claude Code CLI Experience
 * Enhanced with OpenClaude-style animations, glimmer effects, and premium UI
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { useTheme, defaultTheme, interpolateColor, toRGBColor } from "@axiom/tui-react";
import { EnhancedSpinnerRow, ToolChain, MarkdownRenderer, StatusBar, VimInput, } from "@axiom/tui-react";
import { createSettingsManager } from "./core/settings-manager.js";
import { createModelRegistry } from "./core/model-registry.js";
import { Agent } from "@axiom/agent-core";
import { defaultTools } from "./core/tools/index.js";
// Set theme
defaultTheme;
// Calculate string width
function stringWidth(str) {
    let width = 0;
    for (const char of str) {
        if (char >= "一" && char <= "鿿")
            width += 2;
        else if (char >= "０" && char <= "ｚ")
            width += 2;
        else
            width += 1;
    }
    return width;
}
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
    ];
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
    const [currentThinkingIntensity, setCurrentThinkingIntensity] = useState(0);
    const [currentContent, setCurrentContent] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    // Thinking expansion state
    const [showAllThinking, setShowAllThinking] = useState(false);
    const [expandedThinking, setExpandedThinking] = useState(new Set());
    // Tool state
    const [toolCalls, setToolCalls] = useState([]);
    const [currentToolCall, setCurrentToolCall] = useState(null);
    // Command palette state
    const [showPalette, setShowPalette] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [paletteSearch, setPaletteSearch] = useState("");
    // Help dialog state
    const [showHelp, setShowHelp] = useState(false);
    // Animation state
    const [time, setTime] = useState(0);
    const [frame, setFrame] = useState(0);
    const [glimmerIndex, setGlimmerIndex] = useState(-100);
    const [stalledIntensity, setStalledIntensity] = useState(0);
    const [totalTokens, setTotalTokens] = useState(0);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [lastTokenTime, setLastTokenTime] = useState(Date.now());
    // UI state
    const [aiState, setAiState] = useState("idle");
    const [connectionStatus, setConnectionStatus] = useState("connected");
    const [inputValue, setInputValue] = useState("");
    const [inputMode, setInputMode] = useState("normal");
    // Refs
    const agentRef = useRef(null);
    const processingStartRef = useRef(null);
    const lastTokenRef = useRef(0);
    const contentRef = useRef("");
    // Animation frame effect (50ms for smooth animations)
    useEffect(() => {
        if (isStreaming) {
            const interval = setInterval(() => {
                setTime((prev) => prev + 50);
                setFrame((prev) => prev + 1);
                // Update glimmer
                const messageWidth = stringWidth(currentContent);
                const cycleLength = messageWidth + 20;
                const position = Math.floor(time / 200);
                const index = messageWidth + 10 - (position % cycleLength);
                setGlimmerIndex(index);
            }, 50);
            return () => clearInterval(interval);
        }
        else {
            setGlimmerIndex(-100);
        }
    }, [isStreaming, currentContent, time]);
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
    // Stalled detection
    useEffect(() => {
        if (totalTokens > lastTokenRef.current) {
            lastTokenRef.current = totalTokens;
            setLastTokenTime(Date.now());
            setStalledIntensity(0);
        }
        const checkStalled = () => {
            const timeSinceLastToken = Date.now() - lastTokenTime;
            if (timeSinceLastToken > 3000 && isStreaming) {
                const intensity = Math.min((timeSinceLastToken - 3000) / 2000, 1);
                setStalledIntensity(intensity);
            }
        };
        const interval = setInterval(checkStalled, 500);
        return () => clearInterval(interval);
    }, [totalTokens, lastTokenTime, isStreaming]);
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
        agentRef.current = new Agent({
            initialState: {
                systemPrompt: "You are Axiom. Be concise. Complete tasks efficiently.",
                model,
                tools: defaultTools,
                messages: [],
            },
            getApiKey: async () => apiKey,
            toolExecution: "sequential",
        });
        // Subscribe to agent events
        agentRef.current.subscribe((event) => {
            switch (event.type) {
                case "thinking_start":
                    setAiState("thinking");
                    setCurrentThinking(event.thinking || "");
                    break;
                case "thinking_update":
                    setCurrentThinking(event.thinking || "");
                    break;
                case "thinking_end":
                    setCurrentThinking("");
                    break;
                case "tool_execution_start":
                    setAiState("working");
                    const toolCall = {
                        id: `tool-${Date.now()}`,
                        name: event.toolName,
                        args: event.args || {},
                        status: "running",
                    };
                    setCurrentToolCall(toolCall);
                    setToolCalls((prev) => [...prev, toolCall]);
                    break;
                case "tool_execution_end":
                    setToolCalls((prev) => prev.map((tc) => tc.id === currentToolCall?.id
                        ? { ...tc, status: "done", result: event.result }
                        : tc));
                    setCurrentToolCall(null);
                    setAiState("thinking");
                    break;
                case "text_delta":
                    setCurrentContent((prev) => prev + event.text);
                    contentRef.current += event.text;
                    setTotalTokens((prev) => prev + 1);
                    break;
                case "message_complete":
                    setAiState("success");
                    setTimeout(() => setAiState("idle"), 1500);
                    break;
                case "error":
                    setAiState("error");
                    setTimeout(() => setAiState("idle"), 2000);
                    break;
            }
        });
        // Initial prompt
        if (initialPrompt) {
            handleSubmit(initialPrompt);
        }
    }, []);
    // Toggle thinking expansion
    const toggleThinking = useCallback((msgId) => {
        setExpandedThinking((prev) => {
            const next = new Set(prev);
            if (next.has(msgId)) {
                next.delete(msgId);
            }
            else {
                next.add(msgId);
            }
            return next;
        });
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
        // Tab to toggle thinking
        if (key.tab && inputModeRef.current !== "vim" && !isStreaming) {
            setShowAllThinking((prev) => !prev);
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
        if (!text.trim() || !agentRef.current)
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
            await agentRef.current.prompt(text);
            const allMessages = agentRef.current.state.messages;
            const assistantMsgs = allMessages.filter((m) => m.role === "assistant");
            const lastMsg = assistantMsgs[assistantMsgs.length - 1];
            const textContent = lastMsg?.content?.find((c) => c.type === "text");
            const thinkingContent = lastMsg?.content?.find((c) => c.type === "thinking");
            setMessages((prev) => {
                const updated = [...prev];
                const assistantIndex = updated.findIndex((m) => m.id === assistantMsgId);
                if (assistantIndex >= 0) {
                    updated[assistantIndex] = {
                        ...updated[assistantIndex],
                        content: textContent?.text || currentContent || "Completed",
                        timestamp: Date.now(),
                    };
                }
                else {
                    updated.push({
                        id: assistantMsgId,
                        role: "assistant",
                        content: textContent?.text || currentContent || "Completed",
                        timestamp: Date.now(),
                        thinking: thinkingContent?.thinking,
                    });
                }
                return updated;
            });
        }
        catch (error) {
            console.error("Error:", error);
            setAiState("error");
        }
        setIsStreaming(false);
    }, [currentContent]);
    // Render thinking for a message
    const renderThinking = useCallback((msg) => {
        if (!msg.thinking)
            return null;
        const isExpanded = showAllThinking || expandedThinking.has(msg.id);
        return (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { color: theme.colors.secondary }, isExpanded ? "▼" : "▶"),
                React.createElement(Text, { color: theme.colors.inactive }, " "),
                React.createElement(Text, { bold: true, color: theme.colors.secondary }, "Reasoning"),
                React.createElement(Text, { color: theme.colors.inactive }, " "),
                React.createElement(Text, { dimColor: true, color: theme.colors.subtle }, "[Tab]")),
            isExpanded && (React.createElement(Box, { paddingLeft: 2, flexDirection: "column", marginTop: 1, borderStyle: "round", borderColor: theme.colors.inactive },
                React.createElement(Text, { color: theme.colors.inactive, italic: true }, msg.thinking)))));
    }, [showAllThinking, expandedThinking, theme]);
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
                React.createElement(MarkdownRenderer, { content: msg.content }))));
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
        // Calculate thinking shimmer
        const thinkingOpacity = currentThinkingIntensity > 0
            ? (Math.sin(time / 2000) + 1) / 2
            : 0;
        let thinkingColor = theme.colors.inactive;
        if (thinkingOpacity > 0) {
            const fromRGB = { r: 153, g: 153, b: 153 };
            const toRGB = { r: 193, g: 193, b: 193 };
            const interpolated = interpolateColor(fromRGB, toRGB, thinkingOpacity);
            thinkingColor = toRGBColor(interpolated);
        }
        return (React.createElement(Box, { flexDirection: "column", marginBottom: 2 },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { bold: true, color: theme.colors.claude }, "\u25CB"),
                React.createElement(Text, { color: theme.colors.inactive }, " "),
                React.createElement(Text, { bold: true, color: theme.colors.inactive }, "Axiom"),
                React.createElement(Text, { color: theme.colors.inactive }, " "),
                isStreaming ? (React.createElement(Text, { dimColor: true, color: theme.colors.inactive }, currentToolCall ? "Using tools..." : "Thinking...")) : ("")),
            React.createElement(Box, { paddingLeft: 2, flexDirection: "column" },
                currentThinking && (React.createElement(Box, { flexDirection: "column", marginBottom: 1, borderStyle: "round", borderColor: theme.colors.inactive, paddingX: 1 },
                    React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                        React.createElement(Text, { color: theme.colors.secondary }, "\u25C9"),
                        React.createElement(Text, { color: theme.colors.inactive }, " Reasoning"),
                        React.createElement(Text, { color: thinkingColor }, " \u25CF")),
                    React.createElement(Box, { paddingLeft: 2, marginTop: 1 },
                        React.createElement(Text, { color: theme.colors.inactive, italic: true }, currentThinking)))),
                React.createElement(Box, { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
                    React.createElement(Text, { color: theme.colors.text }, currentContent),
                    isStreaming && (React.createElement(Text, { color: theme.colors.claude }, " \u2588"))))));
    };
    // Render spinner row (OpenClaude style)
    const renderSpinnerRow = () => {
        if (!isStreaming)
            return null;
        const verb = currentToolCall ? "Using tools" : "Thinking";
        const elapsed = formatDuration(elapsedMs);
        const tokens = Math.round(totalTokens / 4);
        return (React.createElement(Box, { marginTop: 1 },
            React.createElement(EnhancedSpinnerRow, { message: verb, mode: currentToolCall ? "tool-use" : "thinking", isStreaming: true, tokens: totalTokens, elapsed: elapsed, thinkingText: currentThinking ? `thinking (${Math.round(time / 1000)}s)` : undefined, thinkingIntensity: thinkingOpacity, stalledIntensity: stalledIntensity, reducedMotion: reducedMotion })));
    };
    // Render tool chain
    const renderToolChain = () => {
        if (toolCalls.length === 0)
            return null;
        return (React.createElement(Box, { marginTop: 1 },
            React.createElement(ToolChain, { tools: toolCalls })));
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
                        const cmd = filteredCommands.find((c) => c.name === valueRef.current);
                        if (cmd) {
                            cmd.action();
                            setValue("");
                            setPaletteSearch("");
                            setShowPalette(false);
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
    // Thinking shimmer opacity calculation
    const thinkingOpacity = currentThinking ? (Math.sin(time / 2000) + 1) / 2 : 0;
    return (React.createElement(Box, { flexDirection: "column", height: "100%" },
        React.createElement(Box, { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { bold: true, color: theme.colors.primary }, "\u25B2"),
                React.createElement(Text, null, " "),
                React.createElement(Text, { bold: true, color: theme.colors.text }, "Axiom"),
                React.createElement(Text, { dimColor: true, color: theme.colors.subtle }, " \u00B7 "),
                React.createElement(Text, { dimColor: true, color: theme.colors.inactive }, currentModel)),
            React.createElement(Box, { flexDirection: "row", alignItems: "center", gap: 2 },
                React.createElement(Text, { dimColor: true, color: theme.colors.subtle }, "[/] commands"),
                React.createElement(Text, { dimColor: true, color: theme.colors.subtle }, "[Tab] reasoning"),
                React.createElement(Text, { dimColor: true, color: theme.colors.subtle }, "[Ctrl+V] vim"),
                reducedMotion && (React.createElement(Text, { dimColor: true, color: theme.colors.warning }, "[motion]")))),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true, color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")),
        React.createElement(Box, { flexDirection: "column", flexGrow: 1, overflow: "hidden" },
            React.createElement(HelpDialog, null),
            renderHistory(),
            renderStreamingContent(),
            renderSpinnerRow(),
            renderToolChain(),
            React.createElement(CommandPalette, null)),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true, color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")),
        React.createElement(StatusBar, { connectionStatus: connectionStatus, isProcessing: isStreaming, toolName: currentToolCall?.name, reducedMotion: reducedMotion, totalTokens: totalTokens }),
        React.createElement(Box, { marginTop: 1 }, inputMode === "vim" ? (React.createElement(VimInput, { onSubmit: handleSubmit, placeholder: "Message Axiom...", initialValue: inputValue })) : (React.createElement(SimpleInput, null)))));
};
export default EnhancedApp;
//# sourceMappingURL=enhanced-app.js.map