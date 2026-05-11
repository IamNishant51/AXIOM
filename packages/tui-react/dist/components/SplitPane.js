/**
 * SplitPane - Split view with resizable panes
 * Left: Context (files, task, chat), Right: Live execution
 */
import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";
export const SplitPane = ({ children, direction = "horizontal", defaultSplit = 50, minSize = 20, maxSize = 80, }) => {
    const theme = useTheme();
    const [splitPosition, setSplitPosition] = useState(defaultSplit);
    const [activePane, setActivePane] = useState(1);
    const [isResizing, setIsResizing] = useState(false);
    // Tab to switch focus between panes
    useInput((input, key) => {
        if (key.tab) {
            setActivePane((prev) => (prev === 0 ? 1 : 0));
            return;
        }
        // Arrow keys to resize
        if (isResizing) {
            if (direction === "horizontal") {
                if (key.leftArrow || input === "h") {
                    setSplitPosition((prev) => Math.max(minSize, prev - 2));
                }
                else if (key.rightArrow || input === "l") {
                    setSplitPosition((prev) => Math.min(maxSize, prev + 2));
                }
            }
            else {
                if (key.upArrow || input === "k") {
                    setSplitPosition((prev) => Math.max(minSize, prev - 2));
                }
                else if (key.downArrow || input === "j") {
                    setSplitPosition((prev) => Math.min(maxSize, prev + 2));
                }
            }
            if (key.escape) {
                setIsResizing(false);
            }
            return;
        }
        // Start resizing with \ or |
        if (input === "\\" || input === "|") {
            setIsResizing(true);
        }
    });
    // Divider component
    const renderDivider = () => {
        const isVertical = direction === "vertical";
        if (isVertical) {
            return (React.createElement(Box, { flexDirection: "column", width: 3 }, Array.from({ length: 20 }).map((_, i) => (React.createElement(Text, { key: i, color: theme.colors.borderDim }, "\u2502")))));
        }
        // Horizontal divider
        const dividerChar = isResizing ? "█" : "─";
        return (React.createElement(Box, { flexDirection: "row", height: 1 },
            React.createElement(Text, { color: isResizing ? theme.colors.accent : theme.colors.borderDim }, dividerChar.repeat(40))));
    };
    // Pane wrapper with focus indicator
    const wrapPane = (content, paneIndex) => {
        const isActive = activePane === paneIndex;
        return (React.createElement(Box, { flexDirection: "column", borderStyle: isActive ? "bold" : undefined, borderColor: isActive ? theme.colors.primary : undefined },
            isActive && (React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { bold: true, color: theme.colors.primary }, paneIndex === 0 ? "◀ Context" : "▶ Output"))),
            content));
    };
    // Render based on direction
    if (direction === "horizontal") {
        // Left | Right
        const leftWidth = Math.round((splitPosition / 100) * 80); // Account for divider
        return (React.createElement(Box, { flexDirection: "row" },
            React.createElement(Box, { width: leftWidth }, wrapPane(children[0], 0)),
            renderDivider(),
            React.createElement(Box, { flexGrow: 1 }, wrapPane(children[1], 1))));
    }
    // Vertical (Top | Bottom)
    const topHeight = Math.round((splitPosition / 100) * 10);
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { height: topHeight }, wrapPane(children[0], 0)),
        renderDivider(),
        React.createElement(Box, { flexGrow: 1 }, wrapPane(children[1], 1))));
};
export const TabContainer = ({ tabs, defaultTab, onChange, }) => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");
    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        onChange?.(tabId);
    }, [onChange]);
    // Tab navigation
    useInput((input, key) => {
        const currentIndex = tabs.findIndex((t) => t.id === activeTab);
        if (key.leftArrow || input === "h") {
            const newIndex = Math.max(0, currentIndex - 1);
            handleTabChange(tabs[newIndex].id);
        }
        else if (key.rightArrow || input === "l") {
            const newIndex = Math.min(tabs.length - 1, currentIndex + 1);
            handleTabChange(tabs[newIndex].id);
        }
    });
    const activeContent = tabs.find((t) => t.id === activeTab)?.content;
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { flexDirection: "row", marginBottom: 1 }, tabs.map((tab) => (React.createElement(Box, { key: tab.id, flexDirection: "row", marginRight: 2 },
            React.createElement(Text, { bold: activeTab === tab.id, color: activeTab === tab.id ? theme.colors.primary : theme.colors.textMuted }, activeTab === tab.id ? "▸" : " "),
            React.createElement(Text, { bold: activeTab === tab.id, color: activeTab === tab.id ? theme.colors.text : theme.colors.textMuted }, tab.label))))),
        React.createElement(Box, { flexDirection: "column" }, activeContent)));
};
export default SplitPane;
