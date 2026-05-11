/**
 * StatusBar - Persistent status display
 * Shows model, tokens, connection, memory, etc.
 */
import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";
import { SmoothSpinner } from "./SmoothSpinner.js";
export const StatusBar = ({ model = "minimax-m2.5-free", totalTokens = 0, inputTokens = 0, outputTokens = 0, connectionStatus = "connected", memoryLoaded = false, memoryFiles = [], mcpServers = [], isProcessing = false, toolName, }) => {
    const theme = useTheme();
    const [showDetails, setShowDetails] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    // Update time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);
    // Connection status color and icon
    const getConnectionDisplay = () => {
        switch (connectionStatus) {
            case "connected":
                return { icon: "●", color: theme.colors.success };
            case "connecting":
                return { icon: "◐", color: theme.colors.warning };
            case "disconnected":
                return { icon: "○", color: theme.colors.error };
        }
    };
    const conn = getConnectionDisplay();
    // Toggle details view
    useInput((input) => {
        if (input === "s" || input === "S") {
            setShowDetails((prev) => !prev);
        }
    });
    // Render memory files
    const renderMemoryFiles = () => {
        if (memoryFiles.length === 0)
            return null;
        const displayFiles = memoryFiles.slice(0, 3);
        const remaining = memoryFiles.length - 3;
        return (React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { color: theme.colors.textMuted }, "Memory: "),
            displayFiles.map((file, i) => (React.createElement(Text, { key: i, color: theme.colors.accent }, file))),
            remaining > 0 && (React.createElement(Text, { color: theme.colors.textMuted },
                " +",
                remaining,
                " more"))));
    };
    // Render MCP servers
    const renderMcpServers = () => {
        if (mcpServers.length === 0)
            return null;
        return (React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { color: theme.colors.textMuted }, "MCP: "),
            mcpServers.map((server, i) => (React.createElement(Text, { key: i, color: theme.colors.secondary }, server)))));
    };
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { color: theme.colors.primary }, model),
                React.createElement(Text, { color: theme.colors.textMuted }, " | "),
                React.createElement(Text, { color: conn.color }, conn.icon),
                React.createElement(Text, { color: theme.colors.textMuted }, " "),
                isProcessing ? (React.createElement(React.Fragment, null,
                    React.createElement(SmoothSpinner, { type: "thinking", size: "small", speed: "fast" }),
                    toolName && (React.createElement(React.Fragment, null,
                        React.createElement(Text, { color: theme.colors.textMuted }, " "),
                        React.createElement(Text, { color: theme.colors.secondary }, toolName))))) : (React.createElement(Text, { color: theme.colors.textMuted }, "idle"))),
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                memoryLoaded && (React.createElement(React.Fragment, null,
                    React.createElement(Text, { color: theme.colors.accent }, "\u25C6"),
                    React.createElement(Text, { color: theme.colors.textMuted }, " Memory"),
                    React.createElement(Text, { color: theme.colors.textMuted }, " | "))),
                React.createElement(Text, { color: theme.colors.textMuted }, currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })))),
        showDetails && (React.createElement(Box, { flexDirection: "column", marginTop: 1, paddingLeft: 2 },
            React.createElement(Box, { flexDirection: "row" },
                React.createElement(Text, { color: theme.colors.textMuted }, "Tokens: "),
                React.createElement(Text, { color: theme.colors.textDim }, totalTokens),
                React.createElement(Text, { color: theme.colors.textMuted }, " ("),
                React.createElement(Text, { color: theme.colors.textDim }, inputTokens),
                React.createElement(Text, { color: theme.colors.textMuted }, ", "),
                React.createElement(Text, { color: theme.colors.textDim }, outputTokens),
                React.createElement(Text, { color: theme.colors.textMuted }, ")")),
            renderMemoryFiles(),
            renderMcpServers())),
        React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "[Press S for status details]")));
};
// Compact status for inline display
export const CompactStatus = ({ processing = false, toolName }) => {
    const theme = useTheme();
    if (!processing)
        return null;
    return (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
        React.createElement(Text, { color: theme.colors.accent }, "\u25CF"),
        React.createElement(Text, { color: theme.colors.textMuted }, " "),
        toolName ? (React.createElement(Text, { color: theme.colors.primary }, toolName)) : (React.createElement(Text, { color: theme.colors.textMuted }, "Working..."))));
};
export default StatusBar;
