/**
 * ToolOutput Component - Real-time tool execution display
 * Shows command output as it happens, like Claude Code
 */
import React, { useState, useEffect, useRef } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";
// ANSI color code detection for syntax highlighting
function parseAnsiOutput(output) {
    if (!output)
        return [];
    const lines = output.split("\n");
    return lines.map((line, i) => {
        // Simple ANSI detection - just render the line
        // In a full implementation, you'd parse ANSI codes and apply colors
        const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, "");
        // Detect if line is stderr (starts with error keywords or has error patterns)
        const isError = cleanLine.toLowerCase().includes("error") ||
            cleanLine.toLowerCase().includes("failed") ||
            cleanLine.toLowerCase().includes("exception");
        return (React.createElement(Text, { key: i, color: isError ? "#F87171" : "#F5F5F5" }, cleanLine || " "));
    });
}
export const ToolOutput = ({ toolName, command, output = "", isRunning = false, isExpanded = true, onToggleExpand, maxHeight = 20, }) => {
    const theme = useTheme();
    const [displayedOutput, setDisplayedOutput] = useState("");
    const outputRef = useRef(output);
    const indexRef = useRef(0);
    // Update ref when output changes
    useEffect(() => {
        outputRef.current = output;
    }, [output]);
    // Stream output character by character
    useEffect(() => {
        if (!isRunning && !output)
            return;
        // If not running, show full output
        if (!isRunning) {
            setDisplayedOutput(output);
            return;
        }
        // Streaming mode - show incrementally
        const streamOutput = () => {
            const remaining = outputRef.current.slice(indexRef.current);
            if (!remaining)
                return;
            // Stream faster for tool output
            const chunkSize = remaining.length > 100 ? 10 : remaining.length > 50 ? 5 : 2;
            const chunk = remaining.slice(0, chunkSize);
            indexRef.current += chunkSize;
            setDisplayedOutput((prev) => prev + chunk);
            if (indexRef.current < outputRef.current.length) {
                setTimeout(streamOutput, 20);
            }
        };
        streamOutput();
    }, [output, isRunning]);
    // Truncate if too long
    const displayOutput = displayedOutput.length > 2000
        ? displayedOutput.slice(0, 2000) + "\n... (output truncated)"
        : displayedOutput;
    const outputLines = displayOutput.split("\n");
    const isLongOutput = outputLines.length > maxHeight;
    return (React.createElement(Box, { flexDirection: "column", marginTop: 1, marginBottom: 1 },
        React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { color: theme.colors.primary }, isExpanded ? "▼" : "▶"),
            onToggleExpand && (React.createElement(Text, { color: theme.colors.textMuted, dimColor: true },
                "[click to ",
                isExpanded ? "collapse" : "expand",
                "]")),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { bold: true, color: theme.colors.primary }, toolName),
            isRunning && (React.createElement(React.Fragment, null,
                React.createElement(Text, { color: theme.colors.textMuted }, " - "),
                React.createElement(Text, { color: theme.colors.accent }, "running...")))),
        command && isExpanded && (React.createElement(Box, { paddingLeft: 2, flexDirection: "column", marginTop: 1 },
            React.createElement(Text, { color: theme.colors.textDim },
                "$ ",
                command))),
        isExpanded && displayOutput && (React.createElement(Box, { paddingLeft: 2, flexDirection: "column", marginTop: 1, borderStyle: "round", borderColor: theme.colors.borderDim }, displayOutput.split("\n").map((line, i) => {
            const isError = line.toLowerCase().includes("error") ||
                line.toLowerCase().includes("failed") ||
                line.toLowerCase().includes("exception");
            return (React.createElement(Text, { key: i, color: isError ? "#F87171" : "#A3A3A3" }, line || " "));
        }))),
        isRunning && (React.createElement(Box, { paddingLeft: 2, marginTop: 1 },
            React.createElement(Text, { color: theme.colors.accent }, "\u25CF Running...")))));
};
// Tool execution chain component
export const ToolChain = ({ tools }) => {
    return (React.createElement(Box, { flexDirection: "column" }, tools.map((tool, index) => (React.createElement(ToolOutput, { key: index, toolName: tool.name, command: tool.command, output: tool.output, isRunning: tool.isRunning, isExpanded: tool.isExpanded })))));
};
export default ToolOutput;
