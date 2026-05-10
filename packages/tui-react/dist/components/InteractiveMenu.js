/**
 * InteractiveMenu Component - Premium keyboard-driven menu
 * Handles up/down/enter smoothly with cursor and dimmed inactive options
 */
import React, { useState, useEffect, useCallback } from "react";
import { Text, Box } from "ink";
import { useTheme } from "../theme/index.js";
export const InteractiveMenu = ({ items, onSelect, onCancel, defaultIndex = 0, showCursor = true, dimInactive = true, pageSize = 10, }) => {
    const theme = useTheme();
    const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
    // Filter out disabled items for navigation
    const enabledItems = items.filter((item) => !item.disabled);
    const enabledIndices = items.map((item, index) => item.disabled ? -1 : enabledItems.findIndex((ei) => ei === item));
    // Reset selection if it becomes disabled
    useEffect(() => {
        if (items[selectedIndex]?.disabled) {
            const nextEnabled = items.findIndex((item) => !item.disabled);
            if (nextEnabled >= 0)
                setSelectedIndex(nextEnabled);
        }
    }, [items, selectedIndex]);
    const currentItem = items[selectedIndex];
    // Handle keyboard input
    const handleKeyPress = useCallback((key) => {
        switch (key) {
            case "up":
            case "k":
            case "w":
                // Move up
                do {
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
                } while (items[selectedIndex]?.disabled && selectedIndex !== 0);
                break;
            case "down":
            case "j":
            case "s":
                // Move down
                do {
                    setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
                } while (items[selectedIndex]?.disabled && selectedIndex !== items.length - 1);
                break;
            case "return":
            case "enter":
                // Select current item
                if (currentItem && !currentItem.disabled) {
                    currentItem.action?.();
                    onSelect(currentItem, selectedIndex);
                }
                break;
            case "escape":
            case "q":
                onCancel?.();
                break;
            default:
                // Number key quick selection (1-9)
                const num = parseInt(key);
                if (num >= 1 && num <= Math.min(9, items.length)) {
                    const index = num - 1;
                    if (!items[index].disabled) {
                        setSelectedIndex(index);
                        onSelect(items[index], index);
                    }
                }
                break;
        }
    }, [items, selectedIndex, currentItem, onSelect, onCancel]);
    // Expose key handler for parent component
    useEffect(() => {
        // This component expects parent to handle stdin input
        // In practice, you'd wrap this in a useInput handler from Ink
    }, []);
    // Render menu items
    const renderItems = () => {
        // Calculate visible range for pagination
        const totalPages = Math.ceil(items.length / pageSize);
        const currentPage = Math.floor(selectedIndex / pageSize);
        const startIndex = currentPage * pageSize;
        const endIndex = Math.min(startIndex + pageSize, items.length);
        return items.slice(startIndex, endIndex).map((item, index) => {
            const actualIndex = startIndex + index;
            const isSelected = actualIndex === selectedIndex;
            const isDisabled = item.disabled;
            return (React.createElement(Box, { key: actualIndex, flexDirection: "row", paddingY: 0 },
                React.createElement(Box, { width: 2 },
                    showCursor && isSelected && !isDisabled && (React.createElement(Text, { bold: true, color: theme.colors.cursor },
                        theme.typography.cursor,
                        " ")),
                    showCursor && isSelected && isDisabled && (React.createElement(Text, { color: theme.colors.textMuted }, "  ")),
                    !isSelected && React.createElement(Text, null, "  ")),
                React.createElement(Box, { flexGrow: 1 },
                    React.createElement(Text, { bold: isSelected && !isDisabled, color: isDisabled
                            ? theme.colors.textMuted
                            : isSelected
                                ? theme.colors.text
                                : dimInactive
                                    ? theme.colors.textDim
                                    : theme.colors.text }, item.label)),
                item.description && (React.createElement(Box, { width: 30 },
                    React.createElement(Text, { color: theme.colors.textMuted },
                        " ",
                        item.description)))));
        });
    };
    return (React.createElement(Box, { flexDirection: "column" },
        renderItems(),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: theme.colors.textMuted }, "\u2191\u2193 navigate \u2022 enter select \u2022 esc quit"))));
};
// Hook for handling keyboard input in interactive components
export function useMenuInput(onKeyPress) {
    return (input, key) => {
        if (key.return || key.return === "\r") {
            onKeyPress("return");
        }
        else if (key.escape) {
            onKeyPress("escape");
        }
        else if (key.up || input === "k" || input === "w") {
            onKeyPress("up");
        }
        else if (key.down || input === "j" || input === "s") {
            onKeyPress("down");
        }
        else if (input) {
            onKeyPress(input);
        }
    };
}
export default InteractiveMenu;
