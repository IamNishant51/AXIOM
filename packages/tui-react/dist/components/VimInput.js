/**
 * VimInput - Vim-style input mode
 * Provides vim keybindings for text editing
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";
export const VimInput = ({ onSubmit, placeholder = "Vim input (i=insert, Esc=normal, :w=submit)", initialValue = "", }) => {
    const theme = useTheme();
    const [mode, setMode] = useState("normal");
    const [input, setInput] = useState(initialValue);
    const [cursorPosition, setCursorPosition] = useState(initialValue.length);
    const [commandBuffer, setCommandBuffer] = useState("");
    const [visualStart, setVisualStart] = useState(null);
    const inputRef = useRef(input);
    // Keep ref updated
    useEffect(() => {
        inputRef.current = input;
    }, [input]);
    // Text operations
    const deleteChar = useCallback((position) => {
        if (position > 0 && position <= input.length) {
            setInput((prev) => prev.slice(0, position - 1) + prev.slice(position));
            setCursorPosition((prev) => Math.max(0, prev - 1));
        }
    }, []);
    const deleteWord = useCallback((position) => {
        // Delete word before cursor
        const before = input.slice(0, position);
        const match = before.match(/(\s*)(\S+)\s*$/);
        if (match) {
            const deleteStart = position - (match[2].length + match[1].length);
            setInput((prev) => prev.slice(0, deleteStart) + prev.slice(position));
            setCursorPosition(deleteStart);
        }
    }, []);
    const deleteLine = useCallback((position) => {
        setInput((prev) => prev.slice(position));
        setCursorPosition(0);
    }, []);
    const yankWord = useCallback((position) => {
        const before = input.slice(0, position);
        const match = before.match(/(\s*)(\S+)\s*$/);
        if (match) {
            const wordStart = position - (match[2].length + match[1].length);
            return input.slice(wordStart, position);
        }
        return "";
    }, [input]);
    const moveWord = useCallback((position, forward) => {
        const remaining = forward ? input.slice(position) : input.slice(0, position).split("").reverse().join("");
        const match = forward ? remaining.match(/(\s+)(\S+)/) : remaining.match(/(\S+)(\s+)/);
        if (match) {
            return forward ? position + match[1].length + match[2].length : position - match[2].length - match[1].length;
        }
        return forward ? input.length : 0;
    }, [input]);
    // Keyboard handler
    useInput((inputChar, key) => {
        // Insert mode - like normal input
        if (mode === "insert") {
            if (key.escape) {
                setMode("normal");
                setCursorPosition(Math.min(cursorPosition, input.length));
                return;
            }
            if (key.return) {
                onSubmit(input);
                setInput("");
                setCursorPosition(0);
                return;
            }
            if (key.backspace) {
                deleteChar(cursorPosition);
                return;
            }
            if (inputChar && inputChar.length === 1) {
                const newPos = cursorPosition + 1;
                setInput((prev) => prev.slice(0, cursorPosition) + inputChar + prev.slice(cursorPosition));
                setCursorPosition(newPos);
            }
            return;
        }
        // Normal mode - vim commands
        if (key.escape) {
            setVisualStart(null);
            setCommandBuffer("");
            return;
        }
        // : commands (ex mode)
        if (commandBuffer === ":") {
            if (key.return) {
                if (input === ":w" || input === "w") {
                    onSubmit(input.slice(1).trim() || inputRef.current);
                }
                setInput("");
                setCommandBuffer("");
                setMode("normal");
                return;
            }
            if (key.backspace) {
                if (commandBuffer.length <= 1) {
                    setCommandBuffer("");
                }
                else {
                    setCommandBuffer((prev) => prev.slice(0, -1));
                }
                setInput((prev) => prev.slice(0, -1));
            }
            else if (inputChar && inputChar.length === 1) {
                setCommandBuffer((prev) => prev + inputChar);
                setInput((prev) => prev + inputChar);
            }
            return;
        }
        // Handle counting (e.g., 3j = 3 lines down)
        if (inputChar && /[1-9]/.test(inputChar) && commandBuffer.match(/^[0-9]*$/)) {
            const count = parseInt(inputChar);
            setCommandBuffer((prev) => prev + count);
            return;
        }
        // Single key commands in normal mode
        switch (inputChar) {
            case "i":
                // Enter insert mode
                setMode("insert");
                setCommandBuffer("");
                break;
            case "a":
                // Append (move right and enter insert)
                setCursorPosition((prev) => Math.min(prev + 1, input.length));
                setMode("insert");
                setCommandBuffer("");
                break;
            case "I":
                // Beginning of line, insert
                setCursorPosition(0);
                setMode("insert");
                setCommandBuffer("");
                break;
            case "A":
                // End of line, insert
                setCursorPosition(input.length);
                setMode("insert");
                setCommandBuffer("");
                break;
            case "o":
                // Open line below
                setInput((prev) => prev + "\n");
                setCursorPosition(input.length + 1);
                setMode("insert");
                setCommandBuffer("");
                break;
            case "O":
                // Open line above
                setInput((prev) => "\n" + prev);
                setCursorPosition(0);
                setMode("insert");
                setCommandBuffer("");
                break;
            case "x":
                // Delete character under cursor
                if (cursorPosition < input.length) {
                    setInput((prev) => prev.slice(0, cursorPosition) + prev.slice(cursorPosition + 1));
                }
                setCommandBuffer("");
                break;
            case "X":
                // Delete character before cursor
                if (cursorPosition > 0) {
                    deleteChar(cursorPosition);
                }
                setCommandBuffer("");
                break;
            case "dw":
                // Delete word
                deleteWord(cursorPosition);
                setCommandBuffer("");
                break;
            case "dd":
                // Delete line
                deleteLine(cursorPosition);
                setCommandBuffer("");
                break;
            case "yy":
                // Yank line (copy)
                // In terminal we can't really copy, but we can track it
                setCommandBuffer("");
                break;
            case "p":
                // Paste (would need clipboard support)
                setCommandBuffer("");
                break;
            case "u":
                // Undo (simplified - just clear input)
                setInput(initialValue);
                setCursorPosition(0);
                setCommandBuffer("");
                break;
            case ".":
                // Repeat last command (simplified)
                setCommandBuffer("");
                break;
            case "v":
                // Visual mode
                setVisualStart(cursorPosition);
                setMode("visual");
                setCommandBuffer("");
                break;
            case ":":
                // Ex mode
                setCommandBuffer(":");
                setInput(":");
                setCommandBuffer(":");
                break;
            case "h":
                // Move left
                setCursorPosition((prev) => Math.max(0, prev - 1));
                setCommandBuffer("");
                break;
            case "l":
                // Move right
                setCursorPosition((prev) => Math.min(input.length, prev + 1));
                setCommandBuffer("");
                break;
            case "j":
                // Move down (in our case, just stay)
                setCommandBuffer("");
                break;
            case "k":
                // Move up
                setCommandBuffer("");
                break;
            case "w":
                // Word forward
                setCursorPosition(moveWord(cursorPosition, true));
                setCommandBuffer("");
                break;
            case "W":
                // Word forward (big words)
                setCursorPosition(moveWord(cursorPosition, true));
                setCommandBuffer("");
                break;
            case "b":
                // Word backward
                setCursorPosition(moveWord(cursorPosition, false));
                setCommandBuffer("");
                break;
            case "B":
                // Word backward (big words)
                setCursorPosition(moveWord(cursorPosition, false));
                setCommandBuffer("");
                break;
            case "0":
                // Beginning of line
                setCursorPosition(0);
                setCommandBuffer("");
                break;
            case "$":
                // End of line
                setCursorPosition(input.length);
                setCommandBuffer("");
                break;
            case "gg":
                // Go to beginning
                setCursorPosition(0);
                setCommandBuffer("");
                break;
            case "G":
                // Go to end
                setCursorPosition(input.length);
                setCommandBuffer("");
                break;
            default:
                setCommandBuffer("");
        }
    });
    // Mode indicator color
    const modeColor = mode === "insert" ? theme.colors.accent : mode === "visual" ? theme.colors.warning : theme.colors.primary;
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { flexDirection: "row", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: modeColor }, mode.toUpperCase()),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, mode === "insert" ? "-- INSERT --" : mode === "visual" ? "-- VISUAL --" : "")),
        React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { bold: true, color: theme.colors.secondary }, "\u276F"),
            React.createElement(Text, null, " "),
            React.createElement(Box, { flexDirection: "row" },
                React.createElement(Text, { color: theme.colors.text }, input.slice(0, cursorPosition)),
                React.createElement(Text, { color: theme.colors.cursor, inverse: true }, input[cursorPosition] || " "),
                React.createElement(Text, { color: theme.colors.text }, input.slice(cursorPosition + 1)))),
        React.createElement(Text, { dimColor: true, color: theme.colors.textMuted },
            mode === "normal" && "i=insert, :w=write, h/j/k/l=move, w/b=word, gg/G=start/end",
            mode === "insert" && "Esc=normal mode, Enter=submit",
            mode === "visual" && "Esc=normal, y=yank, d=delete")));
};
export default VimInput;
