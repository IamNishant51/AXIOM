/**
 * StatusBar - Enhanced with OpenClaude-style animations
 * Persistent status display with token counter and smooth animations
 */
import React, { useState, useEffect, useRef, memo } from "react";
import { Box, Text } from "ink";
import { useTheme, parseRGB, interpolateColor, toRGBColor, ERROR_RED } from "../theme/index.js";
import { useTokenCounterAnimation } from "../utils/animation.js";
// Animated spinner glyph
const SpinnerGlyph = memo(({ reducedMotion }) => {
    const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const [frame, setFrame] = useState(0);
    const [time, setTime] = useState(0);
    useEffect(() => {
        if (reducedMotion) {
            setFrame(0);
            return;
        }
        const interval = setInterval(() => {
            setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
            setTime((prev) => prev + 120);
        }, 120);
        return () => clearInterval(interval);
    }, [reducedMotion]);
    if (reducedMotion) {
        const isDim = Math.floor(time / 2000) % 2 === 1;
        return (React.createElement(Box, { flexWrap: "wrap", height: 1, width: 2 },
            React.createElement(Text, { dimColor: isDim }, "\u25CF")));
    }
    return (React.createElement(Box, { flexWrap: "wrap", height: 1, width: 2 },
        React.createElement(Text, null, SPINNER_FRAMES[frame])));
});
SpinnerGlyph.displayName = "SpinnerGlyph";
// Stalled indicator - pulsing when tokens stop
const StalledIndicator = memo(({ intensity, reducedMotion }) => {
    const theme = useTheme();
    if (intensity === 0 || reducedMotion)
        return null;
    // Interpolate to red
    const baseRGB = parseRGB(theme.colors.error);
    if (!baseRGB)
        return null;
    const interpolated = interpolateColor(baseRGB, ERROR_RED, Math.min(intensity, 1));
    const color = toRGBColor(interpolated);
    return (React.createElement(Text, { color: color }, " \u25CF"));
});
StalledIndicator.displayName = "StalledIndicator";
// Token counter with animation
const AnimatedTokenCounter = memo(({ tokens, reducedMotion }) => {
    const [time, setTime] = useState(0);
    const displayedTokens = useTokenCounterAnimation(tokens, reducedMotion);
    useEffect(() => {
        if (reducedMotion)
            return;
        const interval = setInterval(() => setTime((prev) => prev + 50), 50);
        return () => clearInterval(interval);
    }, [reducedMotion]);
    return (React.createElement(Text, { dimColor: true },
        "\u2193 ",
        displayedTokens,
        " tokens"));
});
AnimatedTokenCounter.displayName = "AnimatedTokenCounter";
// Elapsed time formatter
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}
export const StatusBar = ({ model = "minimax-m2.5-free", totalTokens = 0, inputTokens = 0, outputTokens = 0, connectionStatus = "connected", memoryLoaded = false, memoryFiles = [], mcpServers = [], isProcessing = false, toolName, reducedMotion = false, }) => {
    const theme = useTheme();
    const [showDetails, setShowDetails] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [elapsedMs, setElapsedMs] = useState(0);
    const [stalledIntensity, setStalledIntensity] = useState(0);
    const [lastTokenTime, setLastTokenTime] = useState(Date.now());
    const processingStartRef = useRef(null);
    const lastTokenRef = useRef(totalTokens);
    const lastUpdateRef = useRef(Date.now());
    // Update time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);
    // Track elapsed time during processing
    useEffect(() => {
        if (isProcessing && !processingStartRef.current) {
            processingStartRef.current = Date.now();
        }
        else if (!isProcessing) {
            processingStartRef.current = null;
        }
        const interval = setInterval(() => {
            if (processingStartRef.current) {
                setElapsedMs(Date.now() - processingStartRef.current);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isProcessing]);
    // Stalled detection
    useEffect(() => {
        if (totalTokens > lastTokenRef.current) {
            lastTokenRef.current = totalTokens;
            setLastTokenTime(Date.now());
            setStalledIntensity(0);
        }
        const checkStalled = () => {
            const timeSinceLastToken = Date.now() - lastTokenTime;
            if (timeSinceLastToken > 3000 && isProcessing) {
                const intensity = Math.min((timeSinceLastToken - 3000) / 2000, 1);
                setStalledIntensity(intensity);
            }
        };
        const interval = setInterval(checkStalled, 500);
        return () => clearInterval(interval);
    }, [totalTokens, lastTokenTime, isProcessing]);
    // Connection status
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
    // Render memory files
    const renderMemoryFiles = () => {
        if (memoryFiles.length === 0)
            return null;
        const displayFiles = memoryFiles.slice(0, 3);
        const remaining = memoryFiles.length - 3;
        return (React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { color: theme.colors.inactive }, "Memory: "),
            displayFiles.map((file, i) => (React.createElement(Text, { key: i, color: theme.colors.accent }, file))),
            remaining > 0 && (React.createElement(Text, { color: theme.colors.inactive },
                " +",
                remaining,
                " more"))));
    };
    // Render MCP servers
    const renderMcpServers = () => {
        if (mcpServers.length === 0)
            return null;
        return (React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { color: theme.colors.inactive }, "MCP: "),
            mcpServers.map((server, i) => (React.createElement(Text, { key: i, color: theme.colors.secondary }, server)))));
    };
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { color: theme.colors.primary }, model),
                React.createElement(Text, { color: theme.colors.inactive }, " | "),
                React.createElement(Text, { color: conn.color }, conn.icon),
                React.createElement(Text, { color: theme.colors.inactive }, " "),
                isProcessing ? (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                    React.createElement(SpinnerGlyph, { reducedMotion: reducedMotion }),
                    React.createElement(Text, { color: theme.colors.inactive }, " "),
                    toolName ? (React.createElement(Text, { color: theme.colors.secondary }, toolName)) : (React.createElement(Text, { color: theme.colors.inactive }, "Working")),
                    React.createElement(StalledIndicator, { intensity: stalledIntensity, reducedMotion: reducedMotion }),
                    elapsedMs > 0 && (React.createElement(Text, { dimColor: true },
                        " \u00B7 ",
                        formatDuration(elapsedMs))),
                    totalTokens > 0 && (React.createElement(AnimatedTokenCounter, { tokens: totalTokens, reducedMotion: reducedMotion })))) : (React.createElement(Text, { color: theme.colors.inactive }, "idle"))),
            React.createElement(Box, { flexDirection: "row", alignItems: "center" },
                memoryLoaded && (React.createElement(React.Fragment, null,
                    React.createElement(Text, { color: theme.colors.accent }, "\u25C6"),
                    React.createElement(Text, { color: theme.colors.inactive }, " Memory"),
                    React.createElement(Text, { color: theme.colors.inactive }, " | "))),
                React.createElement(Text, { color: theme.colors.inactive }, currentTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })))),
        showDetails && (React.createElement(Box, { flexDirection: "column", marginTop: 1, paddingLeft: 2 },
            React.createElement(Box, { flexDirection: "row" },
                React.createElement(Text, { color: theme.colors.inactive }, "Tokens: "),
                React.createElement(Text, { color: theme.colors.text }, totalTokens),
                React.createElement(Text, { color: theme.colors.inactive }, " ("),
                React.createElement(Text, { color: theme.colors.text }, inputTokens),
                React.createElement(Text, { color: theme.colors.inactive }, ", "),
                React.createElement(Text, { color: theme.colors.text }, outputTokens),
                React.createElement(Text, { color: theme.colors.inactive }, ")")),
            elapsedMs > 0 && (React.createElement(Text, { color: theme.colors.inactive },
                "Duration: ",
                formatDuration(elapsedMs))),
            renderMemoryFiles(),
            renderMcpServers())),
        React.createElement(Text, { dimColor: true, color: theme.colors.subtle }, "[S] status")));
};
// Compact status for inline display
export const CompactStatus = ({ processing = false, toolName, reducedMotion = false }) => {
    const theme = useTheme();
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        if (!processing || reducedMotion)
            return;
        const interval = setInterval(() => {
            setFrame((prev) => (prev + 1) % 10);
        }, 120);
        return () => clearInterval(interval);
    }, [processing, reducedMotion]);
    if (!processing)
        return null;
    const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    return (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
        React.createElement(Text, { color: theme.colors.claude }, reducedMotion ? "●" : SPINNER_FRAMES[frame]),
        React.createElement(Text, { color: theme.colors.inactive }, " "),
        toolName ? (React.createElement(Text, { color: theme.colors.secondary }, toolName)) : (React.createElement(Text, { color: theme.colors.inactive }, "Working..."))));
};
export default StatusBar;
