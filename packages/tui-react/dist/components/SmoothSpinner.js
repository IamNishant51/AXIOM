/**
 * SmoothSpinner Component - Premium 60fps Braille animation
 * Uses smooth Braille pattern characters for fluid loading state
 */
import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { useTheme } from "../theme/index.js";
// Premium Braille spinner frames - smooth, elegant motion
const SPINNER_FRAMES = {
    small: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
    medium: ["⠋", "⠐", "⠑", "⠡", "⠢", "⠣", "⠤", "⠥", "⠦", "⠧", "⠨", "⠩"],
    large: [
        "⠁⠂⠄⡀⢀⠠⠐⠈ ",
        " ⠂⠄⡀⢀⠠⠐⠈⠐",
        "  ⠄⡀⢀⠠⠐⠈⠐⠈",
        "   ⡀⢀⠠⠐⠈⠐⠈ ",
        "    ⠠⠐⠈⠐⠈  ",
        "     ⠐⠈⠐     ",
        "      ⠈       ",
        "     ⠐⠈⠐     ",
        "    ⠠⠐⠈⠐⠈ ",
        "   ⡀⢀⠠⠐⠈⠐⠈",
        "  ⠄⡀⢀⠠⠐⠈⠐⠈",
        " ⠂⠄⡀⢀⠠⠐⠈⠐",
    ],
};
// Alternative: Dot matrix spinner for extra premium feel
const DOT_SPINNER = ["⠋", "⠙", "⠚", "⠛", "⠜", "⠝", "⠞", "⠟"];
export const SmoothSpinner = ({ size = "medium", label = "Loading", color, }) => {
    const theme = useTheme();
    const [frame, setFrame] = useState(0);
    const [dotFrame, setDotFrame] = useState(0);
    const frames = SPINNER_FRAMES[size];
    const frameCount = frames.length;
    const dotFrameCount = DOT_SPINNER.length;
    // 60fps equivalent - ~16ms per frame
    const FRAME_DELAY = 16;
    // Use useEffect with proper timing for 60fps
    useEffect(() => {
        let animationId;
        let lastTime = Date.now();
        const animate = () => {
            const now = Date.now();
            const elapsed = now - lastTime;
            if (elapsed >= FRAME_DELAY) {
                setFrame((prev) => (prev + 1) % frameCount);
                setDotFrame((prev) => (prev + 1) % dotFrameCount);
                lastTime = now;
            }
            animationId = setTimeout(animate, FRAME_DELAY);
        };
        animationId = setTimeout(animate, FRAME_DELAY);
        return () => {
            clearTimeout(animationId);
        };
    }, [frameCount, dotFrameCount]);
    const spinnerColor = color || theme.colors.primary;
    const dotColor = theme.colors.textMuted;
    return (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
        React.createElement(Text, { color: spinnerColor, bold: true }, DOT_SPINNER[dotFrame]),
        size !== "small" && (React.createElement(React.Fragment, null,
            React.createElement(Text, null, " "),
            React.createElement(Text, { color: dotColor }, frames[frame]))),
        label && (React.createElement(React.Fragment, null,
            React.createElement(Text, null, " "),
            React.createElement(Text, { color: theme.colors.textDim }, label),
            React.createElement(Text, { color: dotColor }, dotFrame % 2 === 0 ? "..." : dotFrame % 3 === 0 ? "   " : ".  ")))));
};
export default SmoothSpinner;
