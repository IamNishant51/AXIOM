/**
 * Demo App - Complete showcase of premium TUI components
 * Run with: npx tsx src/Demo.tsx
 */
import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "./theme/index.js";
import { Panel, SmoothSpinner, StreamedText, InteractiveMenu, Divider, Badge, Progress, Spacer, } from "./components/index.js";
// Main demo app
export const Demo = () => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [streamedMessage, setStreamedMessage] = useState("");
    const [menuIndex, setMenuIndex] = useState(0);
    const tabs = ["Welcome", "Components", "Interactive"];
    // Handle tab navigation
    useInput((input, key) => {
        if (key.leftArrow || input === "h") {
            setActiveTab((prev) => (prev > 0 ? prev - 1 : tabs.length - 1));
        }
        if (key.rightArrow || input === "l") {
            setActiveTab((prev) => (prev < tabs.length - 1 ? prev + 1 : 0));
        }
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { flexDirection: "row", justifyContent: "center", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: theme.colors.primary }, "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557")),
        React.createElement(Box, { flexDirection: "row", justifyContent: "center" },
            React.createElement(Text, { bold: true, color: theme.colors.primary }, "\u2551          Premium TUI React Demo              \u2551")),
        React.createElement(Box, { flexDirection: "row", justifyContent: "center", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: theme.colors.primary }, "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D")),
        React.createElement(Box, { flexDirection: "row", marginBottom: 1 },
            tabs.map((tab, i) => (React.createElement(Box, { key: i, marginRight: 2 },
                React.createElement(Text, { bold: activeTab === i, color: activeTab === i ? theme.colors.accent : theme.colors.textDim }, activeTab === i ? `❯ ${tab}` : `  ${tab}`)))),
            React.createElement(Text, { color: theme.colors.textMuted }, " [h/l or \u2190/\u2192 to switch]")),
        React.createElement(Divider, null),
        activeTab === 0 && React.createElement(WelcomeTab, null),
        activeTab === 1 && React.createElement(ComponentsTab, null),
        activeTab === 2 && (React.createElement(InteractiveTab, { selectedIndex: menuIndex, onSelect: (i) => setMenuIndex(i) })),
        React.createElement(Spacer, { size: 1 }),
        React.createElement(Divider, null),
        React.createElement(Text, { color: theme.colors.textMuted }, "Press q or Ctrl+C to exit")));
};
// Welcome tab content
const WelcomeTab = () => {
    const theme = useTheme();
    return (React.createElement(Box, { flexDirection: "column", paddingY: 1 },
        React.createElement(Text, { bold: true, color: theme.colors.text }, "Welcome to Premium TUI React"),
        React.createElement(Spacer, { size: 1 }),
        React.createElement(Text, { color: theme.colors.textDim }, "A collection of premium, minimalist terminal UI components"),
        React.createElement(Text, { color: theme.colors.textDim }, "built with React and Ink for Node.js applications."),
        React.createElement(Spacer, { size: 2 }),
        React.createElement(Text, { color: theme.colors.text }, "Features:"),
        React.createElement(Text, { color: theme.colors.textDim }, "  \u2022 Unicode rounded borders"),
        React.createElement(Text, { color: theme.colors.textDim }, "  \u2022 Smooth 60fps animations"),
        React.createElement(Text, { color: theme.colors.textDim }, "  \u2022 Streaming text with typing effects"),
        React.createElement(Text, { color: theme.colors.textDim }, "  \u2022 Keyboard-driven interactive menus"),
        React.createElement(Text, { color: theme.colors.textDim }, "  \u2022 Flexible layout system"),
        React.createElement(Text, { color: theme.colors.textDim }, "  \u2022 Easy-to-swap theming"),
        React.createElement(Spacer, { size: 2 }),
        React.createElement(Panel, { title: "Getting Started" },
            React.createElement(Text, { color: theme.colors.text }, "Install: npm install @axiom/tui-react"),
            React.createElement(Text, { color: theme.colors.textDim }, "Import: Panel, SmoothSpinner from '@axiom/tui-react'"))));
};
// Components showcase tab
const ComponentsTab = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 3000);
        return () => clearTimeout(timer);
    }, []);
    return (React.createElement(Box, { flexDirection: "column", paddingY: 1 },
        React.createElement(Panel, { title: "SmoothSpinner" },
            React.createElement(Box, { flexDirection: "column" },
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { color: theme.colors.text }, "Small: "),
                    React.createElement(SmoothSpinner, { size: "small", label: "loading" })),
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { color: theme.colors.text }, "Medium: "),
                    React.createElement(SmoothSpinner, { size: "medium", label: "processing" })),
                React.createElement(Box, null,
                    React.createElement(Text, { color: theme.colors.text }, "Large: "),
                    React.createElement(SmoothSpinner, { size: "large", label: "working" })))),
        React.createElement(Spacer, { size: 1 }),
        React.createElement(Panel, { title: "StreamedText" },
            React.createElement(Box, { flexDirection: "column" }, loading ? (React.createElement(Box, null,
                React.createElement(Text, { color: theme.colors.textMuted }, "Streaming: "),
                React.createElement(SmoothSpinner, { size: "small" }))) : (React.createElement(StreamedText, { text: "This is a premium streaming text effect. It renders character-by-character with configurable speed and no layout jitter. The cursor blinks smoothly at 530ms intervals.", speed: "normal", mode: "character", showCursor: false })))),
        React.createElement(Spacer, { size: 1 }),
        React.createElement(Panel, { title: "Other Components" },
            React.createElement(Box, { flexDirection: "column" },
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { color: theme.colors.text }, "Progress: "),
                    React.createElement(Progress, { value: 65, width: 30 })),
                React.createElement(Box, null,
                    React.createElement(Text, { color: theme.colors.text }, "Badges: "),
                    React.createElement(Badge, { color: theme.colors.success }, "Active"),
                    React.createElement(Box, { width: 1 }),
                    React.createElement(Badge, { color: theme.colors.warning, variant: "solid" }, "Pending"),
                    React.createElement(Box, { width: 1 }),
                    React.createElement(Badge, { color: theme.colors.error }, "Error"))))));
};
// Interactive menu tab
const InteractiveTab = ({ selectedIndex, onSelect }) => {
    const theme = useTheme();
    const menuItems = [
        { label: "Read a file", description: "Open and view file contents" },
        { label: "Write a file", description: "Create or modify files" },
        { label: "Run command", description: "Execute shell commands" },
        { label: "Search", description: "Find patterns in code" },
        { label: "Git operations", description: "Version control actions" },
        { label: "Terminal", description: "Interactive shell" },
        { label: "Settings", description: "Configure Axiom" },
        { label: "Help", description: "Documentation and tips" },
    ];
    return (React.createElement(Box, { flexDirection: "column", paddingY: 1 },
        React.createElement(Panel, { title: "Commands" },
            React.createElement(InteractiveMenu, { items: menuItems, onSelect: (item, index) => {
                    onSelect(index);
                }, defaultIndex: selectedIndex })),
        React.createElement(Spacer, { size: 1 }),
        React.createElement(Panel, { title: "Selected" },
            React.createElement(Text, { color: theme.colors.text }, selectedIndex >= 0
                ? `Running: ${menuItems[selectedIndex].label}...`
                : "Select a command to execute"),
            selectedIndex >= 0 && (React.createElement(Box, { marginTop: 1 },
                React.createElement(SmoothSpinner, { size: "small", label: "executing" }))))));
};
export default Demo;
