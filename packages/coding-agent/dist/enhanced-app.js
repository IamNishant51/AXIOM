/**
 * EnhancedApp.tsx - Full Claude Code CLI Experience
 * Real-time streaming, collapsible thinking, tool display, status bar
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { setTheme, defaultTheme, useTheme } from "@axiom/tui-react";
import { StreamingResponse, StreamingThinking, ToolChain, MarkdownRenderer, StatusBar, VimInput } from "@axiom/tui-react";
import { createSettingsManager } from "./core/settings-manager.js";
import { createModelRegistry } from "./core/model-registry.js";
import { Agent } from "@axiom/agent-core";
import { defaultTools } from "./core/tools/index.js";
// Set theme
setTheme(defaultTheme);
// Main Enhanced App Component
export const EnhancedApp = ({ onMessage, onExit, initialPrompt }) => {
    const theme = useTheme();
    const { exit } = useApp();
    // Message state
    const [messages, setMessages] = useState([]);
    const [currentThinking, setCurrentThinking] = useState("");
    const [currentContent, setCurrentContent] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    // Thinking expansion state
    const [showAllThinking, setShowAllThinking] = useState(false);
    const [expandedThinking, setExpandedThinking] = useState(new Set());
    // Tool state
    const [toolCalls, setToolCalls] = useState([]);
    const [currentToolCall, setCurrentToolCall] = useState(null);
    // UI state
    const [aiState, setAiState] = useState("idle");
    const [connectionStatus, setConnectionStatus] = useState("connected");
    const [inputValue, setInputValue] = useState("");
    const [inputMode, setInputMode] = useState("normal");
    // Agent ref
    const agentRef = useRef(null);
    const inputRef = useRef(null);
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
                    setToolCalls(prev => [...prev, toolCall]);
                    break;
                case "tool_execution_end":
                    setToolCalls(prev => prev.map(tc => tc.id === currentToolCall?.id
                        ? { ...tc, status: "done", result: event.result }
                        : tc));
                    setCurrentToolCall(null);
                    setAiState("thinking");
                    break;
                case "text_delta":
                    setCurrentContent(prev => prev + event.text);
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
        setExpandedThinking(prev => {
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
    // Keyboard shortcuts - use ref to avoid closure issues
    const inputModeRef = useRef(inputMode);
    inputModeRef.current = inputMode;
    useInput((input, key) => {
        // Ctrl+C to interrupt - only if not typing
        if (input === "c" && key.ctrl) {
            agentRef.current?.cancel?.();
            setIsStreaming(false);
            setAiState("idle");
            return;
        }
        // Tab to toggle thinking - only when not in vim mode and not typing
        if (key.tab && inputModeRef.current !== "vim" && !isStreaming) {
            setShowAllThinking(prev => !prev);
            return;
        }
        // Ctrl+V for vim mode
        if (input === "v" && key.ctrl) {
            setInputMode(prev => prev === "vim" ? "normal" : "vim");
            return;
        }
        // Escape to exit vim mode only
        if (key.escape && inputModeRef.current === "vim") {
            setInputMode("normal");
            return;
        }
        // Don't intercept arrow keys, backspace, or other typing keys
        // Let them pass through to child components
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
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsStreaming(true);
        setCurrentContent("");
        setCurrentThinking("");
        setToolCalls([]);
        // Create assistant message placeholder
        const assistantMsgId = `assistant-${Date.now()}`;
        try {
            await agentRef.current.prompt(text);
            // Get the last assistant message
            const allMessages = agentRef.current.state.messages;
            const assistantMsgs = allMessages.filter((m) => m.role === "assistant");
            const lastMsg = assistantMsgs[assistantMsgs.length - 1];
            const textContent = lastMsg?.content?.find((c) => c.type === "text");
            const thinkingContent = lastMsg?.content?.find((c) => c.type === "thinking");
            // Update with final content
            setMessages(prev => {
                const updated = [...prev];
                const assistantIndex = updated.findIndex(m => m.id === assistantMsgId);
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
                React.createElement(Text, { color: theme.colors.textMuted }, " "),
                React.createElement(Text, { color: theme.colors.secondary, bold: true }, "Reasoning"),
                React.createElement(Text, { color: theme.colors.textMuted }, " "),
                React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "[Tab]")),
            isExpanded && (React.createElement(Box, { paddingLeft: 2, flexDirection: "column", marginTop: 1 },
                React.createElement(Text, { color: theme.colors.textDim, italic: true }, msg.thinking)))));
    }, [showAllThinking, expandedThinking, theme]);
    // Render a message
    const renderMessage = useCallback((msg) => {
        const isUser = msg.role === "user";
        return (React.createElement(Box, { key: msg.id, flexDirection: "column", marginBottom: 2 },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { bold: true, color: isUser ? theme.colors.primary : theme.colors.accent }, isUser ? "❯" : "○"),
                React.createElement(Text, { color: theme.colors.textMuted }, " "),
                React.createElement(Text, { bold: true, color: theme.colors.textDim }, isUser ? "You" : "Axiom")),
            React.createElement(Box, { paddingLeft: 2, flexDirection: "column" },
                !isUser && renderThinking(msg),
                React.createElement(MarkdownRenderer, { content: msg.content }))));
    }, [renderThinking, theme]);
    // Render history
    const renderHistory = () => {
        if (messages.length === 0) {
            return (React.createElement(Box, { flexDirection: "column", alignItems: "center", justifyContent: "center", paddingY: 4 },
                React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "Type a message to start...")));
        }
        return messages.map(msg => renderMessage(msg));
    };
    // Render current streaming content
    const renderStreamingContent = () => {
        if (!isStreaming && !currentContent)
            return null;
        return (React.createElement(Box, { flexDirection: "column", marginBottom: 2 },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { bold: true, color: theme.colors.accent }, "\u25CB"),
                React.createElement(Text, { color: theme.colors.textMuted }, " "),
                React.createElement(Text, { bold: true, color: theme.colors.textDim }, "Axiom"),
                React.createElement(Text, { color: theme.colors.textMuted }, " "),
                React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, isStreaming ? "Thinking..." : "")),
            React.createElement(Box, { paddingLeft: 2, flexDirection: "column" },
                currentThinking && (React.createElement(StreamingThinking, { thinking: currentThinking, isStreaming: true, isExpanded: true })),
                React.createElement(StreamingResponse, { initialContent: currentContent, isStreaming: isStreaming, showCursor: true }))));
    };
    // Render tool chain
    const renderToolChain = () => {
        if (toolCalls.length === 0)
            return null;
        return (React.createElement(Box, { marginTop: 1 },
            React.createElement(ToolChain, { tools: toolCalls })));
    };
    // Simple input handler for normal mode
    const SimpleInput = () => {
        const [value, setValue] = useState("");
        const valueRef = useRef("");
        // Keep ref in sync
        useEffect(() => {
            valueRef.current = value;
        }, [value]);
        useInput((input, key) => {
            // Handle backspace - comprehensive coverage
            if (key.backspace || key.delete || input === "\x7f" || input === "\b" || input === "⌫") {
                setValue(prev => {
                    if (prev.length > 0) {
                        return prev.slice(0, -1);
                    }
                    return prev;
                });
                return;
            }
            // Handle return/submit
            if (key.return) {
                if (valueRef.current.trim()) {
                    handleSubmit(valueRef.current);
                    setValue("");
                }
                return;
            }
            // Handle escape
            if (key.escape) {
                return;
            }
            // Regular character input - only printable characters
            if (input && input.length === 1 && !key.ctrl && !key.meta && !key.backspace && !key.delete) {
                const charCode = input.charCodeAt(0);
                // Only accept printable characters (space to tilde) and extended ASCII
                if ((charCode >= 32 && charCode <= 126) || charCode > 127) {
                    setValue(prev => prev + input);
                }
            }
        });
        return (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { bold: true, color: theme.colors.primary }, "\u276F"),
            React.createElement(Text, null, " "),
            React.createElement(Text, { color: theme.colors.text }, value),
            React.createElement(Text, { color: theme.colors.cursor }, "\u2588")));
    };
    return (React.createElement(Box, { flexDirection: "column", height: "100%" },
        React.createElement(Box, { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { bold: true, color: theme.colors.primary }, "\u25B2"),
                React.createElement(Text, null, " "),
                React.createElement(Text, { bold: true, color: theme.colors.text }, "Axiom")),
            React.createElement(Box, { flexDirection: "row", alignItems: "center", gap: 2 },
                React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "[Tab] reasoning"),
                React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "[Ctrl+V] vim"),
                React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "[Ctrl+C] stop"))),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true, color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")),
        React.createElement(Box, { flexDirection: "column", flexGrow: 1, overflow: "hidden" },
            renderHistory(),
            renderStreamingContent(),
            renderToolChain()),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true, color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")),
        React.createElement(StatusBar, { connectionStatus: connectionStatus, isProcessing: isStreaming, toolName: currentToolCall?.name }),
        React.createElement(Box, { marginTop: 1 }, inputMode === "vim" ? (React.createElement(VimInput, { onSubmit: handleSubmit, placeholder: "Message Axiom...", initialValue: inputValue })) : (React.createElement(SimpleInput, null)))));
};
export default EnhancedApp;
//# sourceMappingURL=enhanced-app.js.map