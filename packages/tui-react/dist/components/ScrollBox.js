/**
 * ScrollBox - Virtual scrolling container for large lists
 * Efficient rendering for messages, history, etc.
 */
import React, { useState, memo } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";
// Scroll indicator bar
const ScrollIndicator = memo(({ hasMore, total, visible }) => {
    const theme = useTheme();
    if (!hasMore)
        return null;
    return (React.createElement(Box, null,
        React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, `[${visible}/${total}]`)));
});
ScrollIndicator.displayName = "ScrollIndicator";
// Simple ScrollBox that handles keyboard navigation and displays items
export const ScrollBox = ({ children, height = 20, width, scrollPosition: externalPosition, onScroll, showScrollbar = true, }) => {
    const theme = useTheme();
    const [internalPosition, setInternalPosition] = useState(0);
    const [hasMoreTop, setHasMoreTop] = useState(false);
    const [hasMoreBottom, setHasMoreBottom] = useState(false);
    const position = externalPosition !== undefined ? externalPosition : internalPosition;
    // Calculate how many children we can show
    const childArray = React.Children.toArray(children);
    const totalItems = childArray.length;
    const visibleItems = Math.min(height, totalItems);
    const canScrollUp = position > 0;
    const canScrollDown = position + visibleItems < totalItems;
    // Get visible children
    const visibleChildren = childArray.slice(position, position + visibleItems);
    return (React.createElement(Box, { flexDirection: "column", width: width },
        canScrollUp && (React.createElement(Box, null,
            React.createElement(Text, { dimColor: true, color: theme.colors.secondary }, "\u25B2 more above"))),
        React.createElement(Box, { flexDirection: "column", height: visibleItems }, visibleChildren.map((child, index) => (React.createElement(Box, { key: position + index, justifyContent: "flex-start" }, child)))),
        canScrollDown && (React.createElement(Box, null,
            React.createElement(Text, { dimColor: true, color: theme.colors.secondary }, "\u25BC more below"))),
        showScrollbar && (React.createElement(ScrollIndicator, { hasMore: canScrollUp || canScrollDown, total: totalItems, visible: visibleItems }))));
};
export default ScrollBox;
