/**
 * DiffView Component - Code change display
 * Shows additions/deletions with proper styling like Claude Code
 */
import React, { useState } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";
// Parse unified diff format
function parseDiff(diffText) {
    const lines = diffText.split("\n");
    const result = [];
    let lineNumber = 0;
    for (const line of lines) {
        if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) {
            result.push({
                type: "header",
                content: line,
                lineNumber: ++lineNumber,
            });
        }
        else if (line.startsWith("+")) {
            result.push({
                type: "added",
                content: line.slice(1),
                lineNumber: ++lineNumber,
            });
        }
        else if (line.startsWith("-")) {
            result.push({
                type: "removed",
                content: line.slice(1),
                lineNumber: ++lineNumber,
            });
        }
        else if (line.trim()) {
            result.push({
                type: "unchanged",
                content: line,
                lineNumber: ++lineNumber,
            });
        }
    }
    return result;
}
export const DiffView = ({ diff, mode = "unified", showLineNumbers = true, collapsible = true, maxHeight = 30, }) => {
    const theme = useTheme();
    const [isExpanded, setIsExpanded] = useState(!collapsible);
    const [selectedLine, setSelectedLine] = useState(-1);
    // Parse diff if it's a string
    const diffLines = typeof diff === "string" ? parseDiff(diff) : diff;
    // Count additions and deletions
    const additions = diffLines.filter((l) => l.type === "added").length;
    const deletions = diffLines.filter((l) => l.type === "removed").length;
    // Truncate if too long
    const displayLines = isExpanded
        ? diffLines
        : diffLines.slice(0, maxHeight);
    const isTruncated = diffLines.length > maxHeight;
    return (React.createElement(Box, { flexDirection: "column", marginY: 1 },
        React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { color: theme.colors.primary }, isExpanded ? "▼" : "▶"),
            collapsible && (React.createElement(Text, { color: theme.colors.textMuted, dimColor: true },
                "[click to ",
                isExpanded ? "collapse" : "expand",
                "]")),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { bold: true, color: theme.colors.textDim }, "Diff"),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { color: "#4ADE80" },
                "+",
                additions),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { color: "#F87171" },
                "-",
                deletions),
            isTruncated && !isExpanded && (React.createElement(Text, { color: theme.colors.textMuted },
                " ",
                "(",
                diffLines.length,
                " lines, click to expand)"))),
        isExpanded && (React.createElement(Box, { flexDirection: "column", paddingLeft: 2, marginTop: 1, borderStyle: "round", borderColor: theme.colors.borderDim }, displayLines.map((line, index) => {
            // Header lines
            if (line.type === "header") {
                return (React.createElement(Text, { key: index, color: theme.colors.primary, bold: true }, line.content));
            }
            // Added lines - green
            if (line.type === "added") {
                return (React.createElement(Box, { key: index, flexDirection: "row" },
                    showLineNumbers && (React.createElement(Text, { dimColor: true, color: "#4ADE80" },
                        String(line.lineNumber || "").padStart(3, " "),
                        " ")),
                    React.createElement(Text, { color: "#4ADE80" }, "+ "),
                    React.createElement(Text, { color: "#4ADE80" }, line.content || " ")));
            }
            // Removed lines - red
            if (line.type === "removed") {
                return (React.createElement(Box, { key: index, flexDirection: "row" },
                    showLineNumbers && (React.createElement(Text, { dimColor: true, color: "#F87171" },
                        String(line.lineNumber || "").padStart(3, " "),
                        " ")),
                    React.createElement(Text, { color: "#F87171" }, "- "),
                    React.createElement(Text, { color: "#F87171" }, line.content || " ")));
            }
            // Unchanged lines
            return (React.createElement(Box, { key: index, flexDirection: "row" },
                showLineNumbers && (React.createElement(Text, { dimColor: true, color: theme.colors.textMuted },
                    String(line.lineNumber || "").padStart(3, " "),
                    " ")),
                React.createElement(Text, { color: theme.colors.textDim }, "  "),
                React.createElement(Text, { color: theme.colors.textDim }, line.content || " ")));
        })))));
};
// Simple diff from old/new content
export const createSimpleDiff = (oldContent, newContent) => {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");
    const result = [];
    let lineNumber = 1;
    // Simple line-by-line comparison
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
        const oldLine = oldLines[i];
        const newLine = newLines[i];
        if (oldLine === newLine) {
            result.push({
                type: "unchanged",
                content: newLine || "",
                lineNumber: lineNumber++,
            });
        }
        else {
            if (oldLine !== undefined) {
                result.push({
                    type: "removed",
                    content: oldLine,
                    lineNumber: lineNumber++,
                });
            }
            if (newLine !== undefined) {
                result.push({
                    type: "added",
                    content: newLine,
                    lineNumber: lineNumber++,
                });
            }
        }
    }
    return result;
};
export default DiffView;
