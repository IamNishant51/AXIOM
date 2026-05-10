/**
 * Panel Component - Premium container with Unicode borders
 * Uses rounded box-drawing characters for elegant framing
 */
import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";
export const Panel = ({ children, title, padding = 1, borderStyle = "rounded", minHeight = 0, flexGrow = 0, }) => {
    const theme = useTheme();
    const { borders, spacing, colors } = theme;
    if (borderStyle === "none") {
        return (React.createElement(Box, { flexGrow: flexGrow, minHeight: minHeight },
            React.createElement(Box, { paddingLeft: padding, paddingRight: padding, paddingTop: padding }, children)));
    }
    // Calculate dimensions for proper border rendering
    const paddingX = spacing.md;
    const paddingY = spacing.sm;
    return (React.createElement(Box, { flexDirection: "column", flexGrow: flexGrow, minHeight: minHeight },
        React.createElement(Box, null,
            React.createElement(Text, { bold: true, color: colors.border }, borders.topLeft),
            title && (React.createElement(React.Fragment, null,
                React.createElement(Text, { color: colors.textDim }, " ".repeat(1)),
                React.createElement(Text, { bold: true, color: colors.text }, title),
                React.createElement(Text, { color: colors.textDim }, " ".repeat(1)))),
            React.createElement(Text, { color: colors.border }, borders.top.repeat(40)),
            React.createElement(Text, { bold: true, color: colors.border }, borders.topRight)),
        React.createElement(Box, { flexGrow: 1 },
            React.createElement(Text, { bold: true, color: colors.border }, borders.left),
            React.createElement(Box, { flexGrow: 1, paddingX: paddingX, paddingY: paddingY, flexDirection: "column" }, children),
            React.createElement(Text, { bold: true, color: colors.border }, borders.right)),
        React.createElement(Box, null,
            React.createElement(Text, { bold: true, color: colors.border }, borders.bottomLeft),
            React.createElement(Text, { color: colors.border }, borders.bottom.repeat(42)),
            React.createElement(Text, { bold: true, color: colors.border }, borders.bottomRight))));
};
export default Panel;
