/**
 * TUI React - Premium Terminal UI Components
 * Export all components and utilities
 */
export { Panel } from "./Panel.js";
export { SmoothSpinner } from "./SmoothSpinner.js";
export { StreamedText, StaticText } from "./StreamedText.js";
export { StreamedResponse, StaticResponse } from "./StreamedResponse.js";
export { StatusIndicator } from "./StatusIndicator.js";
export { InputManager } from "./InputManager.js";
export { InteractiveMenu, useMenuInput } from "./InteractiveMenu.js";
// Additional utility components
import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";
/**
 * Divider - Clean visual separator
 */
export const Divider = ({ char = "─", color, }) => {
    const theme = useTheme();
    return (React.createElement(Box, { width: "100%" },
        React.createElement(Text, { color: color || theme.colors.borderDim }, char.repeat(60))));
};
/**
 * Badge - Small label/tag component
 */
export const Badge = ({ children, color, variant = "outline" }) => {
    const theme = useTheme();
    const bgColor = color || theme.colors.primary;
    if (variant === "solid") {
        return (React.createElement(Box, null,
            React.createElement(Text, { bold: true, color: bgColor },
                " ",
                children,
                " ")));
    }
    return (React.createElement(Box, null,
        React.createElement(Text, { color: bgColor },
            "[",
            children,
            "]")));
};
/**
 * Progress - Simple progress indicator
 */
export const Progress = ({ value, width = 40, color }) => {
    const theme = useTheme();
    const filled = Math.round((value / 100) * width);
    const empty = width - filled;
    return (React.createElement(Box, null,
        React.createElement(Text, { color: color || theme.colors.accent }, "█".repeat(filled)),
        React.createElement(Text, { color: theme.colors.borderDim }, "░".repeat(empty)),
        React.createElement(Text, { color: theme.colors.textMuted },
            " ",
            value,
            "%")));
};
/**
 * Cursor - Blinking cursor component
 */
export const Cursor = ({ color }) => {
    const theme = useTheme();
    const [visible, setVisible] = React.useState(true);
    React.useEffect(() => {
        const interval = setInterval(() => setVisible((v) => !v), 530);
        return () => clearInterval(interval);
    }, []);
    return (React.createElement(Text, { color: visible ? color || theme.colors.cursor : "transparent" }, "\u2588"));
};
/**
 * Spacer - Flexible space component
 */
export const Spacer = ({ size = 1 }) => {
    return React.createElement(Box, { height: size });
};
/**
 * Flex - Flexbox container for layout
 */
export const Flex = ({ direction = "row", align, justify, children, gap }) => {
    return (React.createElement(Box, { flexDirection: direction, alignItems: align, justifyContent: justify },
        gap !== undefined && gap > 0 && (React.createElement(React.Fragment, null, React.Children.map(children, (child, i) => (React.createElement(React.Fragment, { key: i },
            i > 0 && React.createElement(Box, { width: gap }),
            child))))),
        gap === undefined && children));
};
