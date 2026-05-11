/**
 * InputManager Component - Claude Code CLI Style
 * Clean, minimal input with proper styling and comprehensive backspace support
 */
import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";
const DEFAULT_COMMANDS = [
    { name: "/clear", description: "Clear conversation", action: "clear" },
    { name: "/help", description: "Show commands", action: "help" },
    { name: "/exit", description: "Exit", action: "exit" },
];
/**
 * Check if character is a backspace signal
 */
function isBackspace(input, key) {
    if (key.backspace || key.delete)
        return true;
    // Common backspace escape sequences
    const code = input.charCodeAt(0);
    return code === 127 || code === 8;
}
export const InputManager = ({ onSubmit, placeholder = "Message Axiom...", commands = DEFAULT_COMMANDS, disabled = false, }) => {
    const theme = useTheme();
    const [input, setInput] = useState("");
    const [showPalette, setShowPalette] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputBufferRef = useRef("");
    // Clear input buffer on submit
    useEffect(() => {
        if (!disabled && input === "") {
            inputBufferRef.current = "";
        }
    }, [input, disabled]);
    const filteredCommands = showPalette
        ? commands.filter((cmd) => cmd.name.toLowerCase().includes(input.toLowerCase().slice(1)))
        : [];
    // Handle keyboard input
    useInput((inputChar, key) => {
        if (disabled)
            return;
        // Palette navigation mode
        if (showPalette) {
            if (key.upArrow || inputChar === "k") {
                setSelectedIndex((prev) => prev > 0 ? prev - 1 : filteredCommands.length - 1);
                return;
            }
            if (key.downArrow || inputChar === "j") {
                setSelectedIndex((prev) => prev < filteredCommands.length - 1 ? prev + 1 : 0);
                return;
            }
            if (key.return) {
                const cmd = filteredCommands[selectedIndex];
                if (cmd) {
                    setShowPalette(false);
                    setInput("");
                    onSubmit(cmd.action);
                }
                return;
            }
            if (key.escape) {
                setShowPalette(false);
                setInput("");
                return;
            }
        }
        // Handle backspace - comprehensive coverage for all terminal types
        if (isBackspace(inputChar, key)) {
            setInput((prev) => {
                if (prev.length > 0) {
                    return prev.slice(0, -1);
                }
                return prev;
            });
            return;
        }
        // Handle Enter/Submit
        if (key.return) {
            const value = input.trim();
            if (value) {
                if (value === "/") {
                    setShowPalette(true);
                    setSelectedIndex(0);
                }
                else {
                    const submittedValue = input;
                    setInput("");
                    onSubmit(submittedValue);
                }
            }
            return;
        }
        // Handle Escape - exit palette mode
        if (key.escape) {
            if (showPalette) {
                setShowPalette(false);
                setInput("");
            }
            return;
        }
        // Handle regular character input
        if (inputChar && inputChar.length === 1) {
            // Start palette if typing /
            if (inputChar === "/" && !showPalette) {
                setShowPalette(true);
                setSelectedIndex(0);
                setInput("/");
            }
            else if (showPalette) {
                setInput((prev) => prev + inputChar);
            }
            else {
                setInput((prev) => prev + inputChar);
            }
        }
    });
    return (React.createElement(Box, { flexDirection: "column" },
        showPalette && filteredCommands.length > 0 && (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.border, marginBottom: 1 }, filteredCommands.map((cmd, index) => (React.createElement(Box, { key: cmd.name, flexDirection: "row", paddingX: 2 },
            React.createElement(Text, { bold: index === selectedIndex, color: index === selectedIndex ? theme.colors.text : theme.colors.primary, inverse: index === selectedIndex }, cmd.name),
            React.createElement(Text, { color: theme.colors.textMuted },
                " ",
                cmd.description)))))),
        React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { bold: true, color: theme.colors.secondary }, "\u276F"),
            React.createElement(Text, null, " "),
            disabled ? (React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, placeholder)) : (React.createElement(React.Fragment, null,
                React.createElement(Text, { bold: true, color: theme.colors.text }, input),
                React.createElement(Text, { color: theme.colors.cursor }, "\u2588"))))));
};
export default InputManager;
