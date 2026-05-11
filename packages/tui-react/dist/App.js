/**
 * App.tsx - Main Layout Component
 * Claude Code CLI Style Implementation
 */
import React, { useCallback, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { useTheme } from "./theme/index.js";
import InputManager from "./components/InputManager.js";
import StatusIndicator from "./components/StatusIndicator.js";
// Enhanced markdown renderer - Claude Code style
function parseMarkdown(content) {
    const lines = content.split("\n");
    const elements = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Code block (```language)
        if (line.startsWith("```")) {
            const language = line.slice(3).trim();
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            // Claude Code style: code blocks with dark background feel
            elements.push(React.createElement(Box, { key: `code-${i}`, flexDirection: "column", marginY: 1, paddingLeft: 2 },
                language && (React.createElement(Text, { dimColor: true, color: "#60A5FA" }, language)),
                codeLines.map((l, j) => (React.createElement(Text, { key: j, color: "#34D399" }, l)))));
            continue;
        }
        // Heading (#, ##, ###)
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            const colors = ["#60A5FA", "#A78BFA", "#34D399"];
            elements.push(React.createElement(Text, { key: i, bold: true, color: colors[level - 1] }, text));
            continue;
        }
        // Horizontal rule
        if (line.match(/^[-*_]{3,}$/)) {
            elements.push(React.createElement(Text, { key: i, dimColor: true, color: "#404040" }, "\u2500\u2500\u2500"));
            continue;
        }
        // List item (-, *, or numbered)
        const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
        if (listMatch) {
            const indent = listMatch[1].length;
            const marker = listMatch[2];
            const text = listMatch[3];
            elements.push(React.createElement(Box, { key: i, paddingLeft: indent },
                React.createElement(Text, { color: "#A78BFA" },
                    marker,
                    " "),
                React.createElement(Text, { color: "#F5F5F5" }, parseInlineMarkdown(text))));
            continue;
        }
        // Regular line with inline markdown
        if (line.trim()) {
            elements.push(React.createElement(Text, { key: i, color: "#F5F5F5" }, parseInlineMarkdown(line)));
        }
        else {
            elements.push(React.createElement(Text, { key: i }, "\n"));
        }
    }
    return elements;
}
// Inline markdown parser
function parseInlineMarkdown(text) {
    const parts = [];
    let remaining = text;
    let keyIndex = 0;
    while (remaining.length > 0) {
        // Inline code: `code`
        const codeMatch = remaining.match(/`([^`]+)`/);
        if (codeMatch) {
            const before = remaining.slice(0, codeMatch.index);
            if (before)
                parts.push(React.createElement(Text, { key: keyIndex++ }, before));
            parts.push(React.createElement(Text, { key: keyIndex++, color: "#34D399" }, codeMatch[1]));
            remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
            continue;
        }
        // Bold: **text**
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
            const before = remaining.slice(0, boldMatch.index);
            if (before)
                parts.push(React.createElement(Text, { key: keyIndex++ }, before));
            parts.push(React.createElement(Text, { key: keyIndex++, bold: true }, boldMatch[1]));
            remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
            continue;
        }
        // Italic: *text* or _text_
        const italicMatch = remaining.match(/\*([^*]+)\*|_([^_]+)_/);
        if (italicMatch) {
            const before = remaining.slice(0, italicMatch.index);
            if (before)
                parts.push(React.createElement(Text, { key: keyIndex++ }, before));
            const italicText = italicMatch[1] || italicMatch[2];
            parts.push(React.createElement(Text, { key: keyIndex++, italic: true }, italicText));
            remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
            continue;
        }
        // Link: [text](url)
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
            const before = remaining.slice(0, linkMatch.index);
            if (before)
                parts.push(React.createElement(Text, { key: keyIndex++ }, before));
            parts.push(React.createElement(Text, { key: keyIndex++, color: "#60A5FA", underline: true }, linkMatch[1]));
            remaining = remaining.slice(linkMatch.index + linkMatch[0].length);
            continue;
        }
        parts.push(React.createElement(Text, { key: keyIndex++ }, remaining));
        break;
    }
    return parts.length > 0 ? React.createElement(React.Fragment, null, parts) : text;
}
// Tool call display - Claude Code style
function renderToolCalls(toolCalls, theme) {
    if (!toolCalls || toolCalls.length === 0)
        return null;
    return (React.createElement(Box, { flexDirection: "column", marginTop: 1 }, toolCalls.map((tc, i) => (React.createElement(Box, { key: i, flexDirection: "row", alignItems: "center" },
        React.createElement(Text, { color: theme.colors.primary }, "\u25CF"),
        React.createElement(Text, { color: theme.colors.textMuted }, " "),
        React.createElement(Text, { color: theme.colors.primary, bold: true }, tc.name),
        React.createElement(Text, { color: theme.colors.textMuted }, " - running..."))))));
}
// Thinking display - Claude Code style
function renderThinking(thinking, showAllThinking, expandedThinking, msgId, theme) {
    if (!thinking)
        return null;
    const isExpanded = showAllThinking || expandedThinking.has(msgId);
    return (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
        React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { color: theme.colors.secondary }, isExpanded ? "▼" : "▶"),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { color: theme.colors.secondary, bold: true }, "Reasoning"),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "[Tab]")),
        isExpanded && (React.createElement(Box, { paddingLeft: 2, flexDirection: "column", marginTop: 1 },
            React.createElement(Text, { color: theme.colors.textDim, italic: true }, thinking)))));
}
// Message bubble - Claude Code style
function renderMessage(msg, theme, showAllThinking, expandedThinking) {
    const isUser = msg.role === "user";
    return (React.createElement(Box, { key: msg.id, flexDirection: "column", marginBottom: 2 },
        React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { bold: true, color: isUser ? theme.colors.primary : theme.colors.accent }, isUser ? "❯" : "○"),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { bold: true, color: theme.colors.textDim }, isUser ? "You" : "Axiom")),
        React.createElement(Box, { paddingLeft: 2, flexDirection: "column" },
            !isUser && renderThinking(msg.thinking, showAllThinking, expandedThinking, msg.id, theme),
            !isUser && renderToolCalls(msg.toolCalls, theme),
            parseMarkdown(msg.content))));
}
export const App = ({ messages = [], onMessage, onCommand, aiState = "idle", aiMessage, aiToolName, isStreaming = false, disabled = false, commands, }) => {
    const theme = useTheme();
    const { exit } = useApp();
    const [expandedThinking, setExpandedThinking] = useState(new Set());
    const [showAllThinking, setShowAllThinking] = useState(false); // Default collapsed
    // Toggle thinking expansion for a specific message
    const toggleThinking = (msgId) => {
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
    };
    // Keyboard handler for toggling thinking (Tab key)
    useInput((input, key) => {
        if (disabled || isStreaming)
            return;
        if (key.tab) {
            setShowAllThinking((prev) => !prev);
        }
    });
    // Handle user submit
    const handleSubmit = useCallback((value) => {
        if (value.startsWith("/")) {
            if (value === "/clear") {
                onCommand?.("clear");
            }
            else if (value === "/exit") {
                exit();
            }
            else {
                onCommand?.(value);
            }
            return;
        }
        onMessage?.(value);
    }, [onMessage, onCommand, exit]);
    // Render history
    const renderHistory = () => {
        if (messages.length === 0) {
            return (React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "Type a message..."));
        }
        return messages.map((msg) => renderMessage(msg, theme, showAllThinking, expandedThinking));
    };
    return (React.createElement(Box, { flexDirection: "column", paddingX: 1 },
        React.createElement(Box, { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { bold: true, color: theme.colors.primary }, "\u25B2"),
                React.createElement(Text, null, " "),
                React.createElement(Text, { bold: true, color: theme.colors.text }, "Axiom"),
                React.createElement(Text, { color: theme.colors.textMuted }, " v0.1.0")),
            React.createElement(Text, { color: theme.colors.textMuted }, "minimax-m2.5-free")),
        React.createElement(Text, { dimColor: true, color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
        React.createElement(Box, { flexDirection: "column", minHeight: 10 }, renderHistory()),
        React.createElement(Text, { dimColor: true, color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
        React.createElement(StatusIndicator, { state: aiState, message: aiMessage, toolName: aiToolName, size: "small" }),
        React.createElement(InputManager, { onSubmit: handleSubmit, placeholder: "Message Axiom...", commands: commands, disabled: disabled || isStreaming })));
};
export default App;
