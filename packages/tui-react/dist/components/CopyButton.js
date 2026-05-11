/**
 * CopyButton - Copy code to clipboard button component
 * Terminal-friendly copy functionality
 */
import React, { memo, useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";
import { copyToClipboard, isClipboardAvailable } from "../utils/clipboard.js";
/**
 * CopyButton - Simple copy button for terminal
 */
export const CopyButton = memo(({ text, language, onCopy, }) => {
    const theme = useTheme();
    const [copied, setCopied] = useState(false);
    const [clipboardAvailable] = useState(isClipboardAvailable());
    const handleCopy = useCallback(async () => {
        if (!clipboardAvailable) {
            onCopy?.(false);
            return;
        }
        const result = await copyToClipboard(text);
        setCopied(result.success);
        onCopy?.(result.success);
        // Reset after 2 seconds
        setTimeout(() => setCopied(false), 2000);
    }, [text, clipboardAvailable, onCopy]);
    // Handle keyboard shortcut (C key to copy)
    useInput((input) => {
        if (input === "c" || input === "C") {
            handleCopy();
        }
    });
    // Don't show if clipboard not available or text is empty
    if (!clipboardAvailable || !text.trim()) {
        return null;
    }
    return (React.createElement(Box, null,
        React.createElement(Box, { paddingX: 1, paddingY: 0, borderStyle: "round", borderColor: copied ? theme.colors.success : theme.colors.border },
            React.createElement(Text, { color: copied ? theme.colors.success : theme.colors.textMuted, bold: copied }, copied ? "✓ Copied" : "📋 Copy [C]"))));
});
CopyButton.displayName = "CopyButton";
/**
 * CopyButtonRow - Row with language label and copy button
 */
export const CopyButtonRow = memo(({ language, code, showLineNumbers = false }) => {
    const theme = useTheme();
    const lines = code.split("\n");
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
            language && (React.createElement(Text, { dimColor: true, color: theme.colors.primary }, language)),
            React.createElement(CopyButton, { text: code, language: language })),
        React.createElement(Box, { flexDirection: "column", paddingLeft: 2 },
            lines.slice(0, 20).map((line, i) => (React.createElement(Box, { key: i, flexDirection: "row" },
                showLineNumbers && (React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, `${(i + 1).toString().padStart(3, " ")} `)),
                React.createElement(Text, { color: theme.colors.accent }, line)))),
            lines.length > 20 && (React.createElement(Text, { dimColor: true, color: theme.colors.textMuted },
                "... and ",
                lines.length - 20,
                " more lines")))));
});
CopyButtonRow.displayName = "CopyButtonRow";
export default CopyButton;
