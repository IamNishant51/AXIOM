/**
 * App.tsx - Main Layout Component
 * Premium Terminal UI - Claude Code Style
 */
import React, { useCallback, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { useTheme } from "./theme/index.js";
import InputManager from "./components/InputManager.js";
import StatusIndicator from "./components/StatusIndicator.js";
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
            elements.push(React.createElement(Box, { key: i, flexDirection: "column", marginY: 1 },
                language && (React.createElement(Text, { color: "#60A5FA" }, language)),
                React.createElement(Text, { color: "#34D399" }, codeLines.map((l, j) => (React.createElement(Text, { key: j },
                    l,
                    "\n"))))));
            continue;
        }
        // Heading (#, ##, ###)
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            elements.push(React.createElement(Text, { key: i, bold: true, color: level === 1 ? "#60A5FA" : level === 2 ? "#A78BFA" : "#34D399" }, text));
            continue;
        }
        // List item (- or * or 1.)
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
        // Horizontal rule
        if (line.match(/^[-*_]{3,}$/)) {
            elements.push(React.createElement(Text, { key: i, color: "#404040" }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
            continue;
        }
        // Regular line with inline markdown
        if (line.trim()) {
            elements.push(React.createElement(Text, { key: i, color: "#F5F5F5" }, parseInlineMarkdown(line)));
        }
        else {
            // Empty line
            elements.push(React.createElement(Text, { key: i }, "\n"));
        }
    }
    return elements;
}
function parseInlineMarkdown(text) {
    // Handle inline code (`code`)
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
        // No more matches, add rest
        parts.push(React.createElement(Text, { key: keyIndex++ }, remaining));
        break;
    }
    return parts.length > 0 ? React.createElement(React.Fragment, null, parts) : text;
}
export const App = ({ messages = [], onMessage, onCommand, aiState = "idle", aiMessage, aiToolName, isStreaming = false, disabled = false, commands, }) => {
    const theme = useTheme();
    const { exit } = useApp();
    const [expandedThinking, setExpandedThinking] = useState(new Set());
    const [showAllThinking, setShowAllThinking] = useState(true);
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
    // Keyboard handler for toggling thinking display
    useInput((input, key) => {
        // Press 't' to toggle all thinking visibility when input is empty
        if (input === "t" && !disabled && !isStreaming) {
            setShowAllThinking((prev) => !prev);
        }
    });
    // Handle user submit
    const handleSubmit = useCallback((value) => {
        if (value.startsWith("/")) {
            if (value === "/clear") {
                // Parent handles clear via messages prop update
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
            return (React.createElement(Text, { color: theme.colors.textMuted }, "Type a message to start..."));
        }
        return messages.map((msg) => (React.createElement(Box, { key: msg.id, flexDirection: "column", marginBottom: 1 },
            React.createElement(Box, { flexDirection: "row" },
                React.createElement(Text, { bold: true, color: msg.role === "user" ? theme.colors.primary : theme.colors.accent }, msg.role === "user" ? "❯" : "○"),
                React.createElement(Text, { color: theme.colors.textMuted }, " "),
                React.createElement(Text, { bold: true, color: theme.colors.textDim }, msg.role === "user" ? "You" : "Axiom")),
            React.createElement(Box, { paddingLeft: 2, flexDirection: "column" },
                msg.thinking && (React.createElement(Box, { flexDirection: "column" },
                    React.createElement(Box, { flexDirection: "row" },
                        React.createElement(Text, { color: theme.colors.secondary, bold: true },
                            "[",
                            showAllThinking || expandedThinking.has(msg.id) ? "▼" : "▶",
                            " Thinking]"),
                        React.createElement(Text, { color: theme.colors.textMuted }, " "),
                        React.createElement(Text, { color: theme.colors.textMuted }, "[Press 't' to toggle all]")),
                    (showAllThinking || expandedThinking.has(msg.id)) && (React.createElement(Box, { paddingLeft: 2, flexDirection: "column", marginTop: 1 },
                        React.createElement(Text, { color: theme.colors.secondary, italic: true }, msg.thinking))))),
                msg.toolCalls?.map((tc, i) => (React.createElement(Text, { key: i, color: theme.colors.primary },
                    "[",
                    tc.name,
                    "...]"))),
                parseMarkdown(msg.content)))));
    };
    return (React.createElement(Box, { flexDirection: "column", paddingX: 1 },
        React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { color: theme.colors.primary }, "\u256D"),
            React.createElement(Text, { color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
            React.createElement(Text, { color: theme.colors.primary }, "\u256E")),
        React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { color: theme.colors.primary }, "\u2502"),
            React.createElement(Text, null, " "),
            React.createElement(Text, { bold: true, color: theme.colors.primary }, "\uD83E\uDD16 Axiom"),
            React.createElement(Text, { color: theme.colors.textMuted }, " v0.1.0"),
            React.createElement(Text, { color: theme.colors.borderDim }, "                                           "),
            React.createElement(Text, { color: theme.colors.primary }, "\u2502")),
        React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { color: theme.colors.primary }, "\u2570"),
            React.createElement(Text, { color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
            React.createElement(Text, { color: theme.colors.primary }, "\u256F")),
        React.createElement(Box, { flexDirection: "column", minHeight: 10 }, renderHistory()),
        React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { color: theme.colors.borderDim }, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")),
        React.createElement(StatusIndicator, { state: aiState, message: aiMessage, toolName: aiToolName, size: "small" }),
        React.createElement(InputManager, { onSubmit: handleSubmit, placeholder: "Message Axiom...", commands: commands, disabled: disabled || isStreaming })));
};
export default App;
