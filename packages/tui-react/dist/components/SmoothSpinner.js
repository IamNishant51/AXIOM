/**
 * SmoothSpinner Component - Enhanced animation like Claude Code
 * Multiple spinner styles with different speeds
 */
import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { useTheme } from "../theme/index.js";
// Premium Braille spinner frames
const SPINNER_FRAMES = {
    small: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧"],
    medium: ["⠋", "⠐", "⠑", "⠡", "⠢", "⠣", "⠤", "⠥", "⠦", "⠧", "⠨", "⠩"],
    large: ["⠁⠂⠄", " ⠂⠄", "  ⠄", "   ⠄", "    ⠠", "     ⠐", "      ⠈", "     ⠐"],
};
// Thinking spinner (subtle, slower)
const THINKING_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
// Working spinner (more active)
const WORKING_FRAMES = ["◐", "◑", "◒", "◓", "◔", "◕"];
// Speed configurations (ms per frame)
const SPEED_CONFIG = {
    slow: 120,
    normal: 60,
    fast: 30,
};
export const SmoothSpinner = ({ type = "thinking", size = "medium", label, color, speed = "normal", reducedMotion = false, }) => {
    const theme = useTheme();
    const [frame, setFrame] = useState(0);
    const frames = type === "thinking" ? THINKING_FRAMES : type === "working" ? WORKING_FRAMES : SPINNER_FRAMES[size];
    const frameDelay = SPEED_CONFIG[speed];
    // Animation frame
    useEffect(() => {
        if (reducedMotion) {
            setFrame(0);
            return;
        }
        const interval = setInterval(() => {
            setFrame((prev) => (prev + 1) % frames.length);
        }, frameDelay);
        return () => clearInterval(interval);
    }, [frameDelay, frames.length, reducedMotion]);
    const spinnerColor = color || theme.colors.primary;
    // Thinking type - subtle with label
    if (type === "thinking") {
        return (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { color: spinnerColor }, frames[frame]),
            label && (React.createElement(React.Fragment, null,
                React.createElement(Text, null, " "),
                React.createElement(Text, { color: theme.colors.textMuted }, label)))));
    }
    // Working type - more prominent
    if (type === "working") {
        return (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { bold: true, color: spinnerColor }, frames[frame]),
            label && (React.createElement(React.Fragment, null,
                React.createElement(Text, null, " "),
                React.createElement(Text, { color: theme.colors.textDim }, label)))));
    }
    // Default loading spinner
    return (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
        React.createElement(Text, { color: spinnerColor, bold: true }, frames[frame]),
        label && (React.createElement(React.Fragment, null,
            React.createElement(Text, null, " "),
            React.createElement(Text, { color: theme.colors.textDim }, label)))));
};
// Compact indicator for status bar
export const StatusIndicatorDot = ({ isActive, label }) => {
    const theme = useTheme();
    if (!isActive)
        return null;
    return (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
        React.createElement(Text, { color: theme.colors.accent }, "\u25CF"),
        label && (React.createElement(React.Fragment, null,
            React.createElement(Text, null, " "),
            React.createElement(Text, { color: theme.colors.textMuted }, label)))));
};
export default SmoothSpinner;
