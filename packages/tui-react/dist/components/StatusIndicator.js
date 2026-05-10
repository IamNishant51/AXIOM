/**
 * StatusIndicator Component - 60fps smooth animation
 * Premium spinner with fluid state transitions
 */
import React, { useState, useEffect, useRef } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";
// Status messages for each state
const STATUS_MESSAGES = {
    idle: "",
    thinking: "Thinking",
    working: "Working",
    success: "Done",
    error: "Error",
};
// Smooth state transition timing (ms)
const TRANSITION_DELAY = 150;
export const StatusIndicator = ({ state = "idle", message, toolName, size = "medium", }) => {
    const theme = useTheme();
    const [displayState, setDisplayState] = useState(state);
    const [displayMessage, setDisplayMessage] = useState(message || STATUS_MESSAGES[state]);
    const [frame, setFrame] = useState(0);
    const lastUpdateRef = useRef(Date.now());
    const frameRef = useRef(0);
    // 60fps frame timing (~16ms per frame)
    const FRAME_DELAY = 16;
    // Smooth state transitions
    useEffect(() => {
        const transitionTimeout = setTimeout(() => {
            setDisplayState(state);
            setDisplayMessage(message || STATUS_MESSAGES[state]);
        }, TRANSITION_DELAY);
        return () => clearTimeout(transitionTimeout);
    }, [state, message]);
    // 60fps spinner animation
    useEffect(() => {
        if (displayState === "idle" || displayState === "success" || displayState === "error") {
            return;
        }
        const frames = theme.typography.spinner;
        let animationId;
        const animate = () => {
            const now = Date.now();
            const elapsed = now - lastUpdateRef.current;
            if (elapsed >= FRAME_DELAY) {
                frameRef.current = (frameRef.current + 1) % frames.length;
                setFrame(frameRef.current);
                lastUpdateRef.current = now;
            }
            animationId = setTimeout(animate, FRAME_DELAY);
        };
        animationId = setTimeout(animate, FRAME_DELAY);
        return () => clearTimeout(animationId);
    }, [displayState, theme.typography.spinner]);
    // Determine colors based on state
    const getStateColor = () => {
        switch (displayState) {
            case "thinking":
                return theme.colors.primary;
            case "working":
                return theme.colors.accent;
            case "success":
                return theme.colors.success;
            case "error":
                return theme.colors.error;
            default:
                return theme.colors.textMuted;
        }
    };
    const stateColor = getStateColor();
    const showSpinner = displayState !== "idle" && displayState !== "success" && displayState !== "error";
    // Don't render anything in idle state
    if (displayState === "idle") {
        return null;
    }
    // Render based on size
    if (size === "small") {
        return (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            showSpinner && (React.createElement(Text, { color: stateColor, bold: true }, theme.typography.spinner[frame])),
            displayState === "success" && (React.createElement(Text, { color: theme.colors.success }, "\u2713")),
            displayState === "error" && (React.createElement(Text, { color: theme.colors.error }, "\u2717")),
            React.createElement(Text, null, " "),
            displayMessage && (React.createElement(Text, { color: theme.colors.textDim }, displayMessage)),
            toolName && (React.createElement(Text, { color: theme.colors.textMuted },
                " [",
                toolName,
                "]"))));
    }
    // Medium size - more detailed
    return (React.createElement(Box, { flexDirection: "column", marginY: 0 },
        React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            showSpinner && (React.createElement(React.Fragment, null,
                React.createElement(Text, { color: stateColor, bold: true }, theme.typography.spinner[frame]),
                React.createElement(Text, null, " "))),
            displayState === "success" && (React.createElement(Text, { bold: true, color: theme.colors.success }, "\u2713")),
            displayState === "error" && (React.createElement(Text, { bold: true, color: theme.colors.error }, "\u2717")),
            displayMessage && (React.createElement(Text, { color: theme.colors.textDim }, displayMessage)),
            toolName && (React.createElement(Text, { color: theme.colors.textMuted },
                " [",
                toolName,
                "]")))));
};
export default StatusIndicator;
