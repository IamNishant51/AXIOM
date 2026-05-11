/**
 * VimInput - Vim-style input mode
 * Provides vim keybindings for text editing
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";

export type VimMode = "normal" | "insert" | "visual";

export interface VimInputProps {
	onSubmit: (value: string) => void;
	placeholder?: string;
	initialValue?: string;
}

// Vim command buffer
interface VimCommand {
	type: "motion" | "operator" | "delete" | "yank" | "change";
	count?: number;
	motion?: string;
}

export const VimInput: React.FC<VimInputProps> = ({
	onSubmit,
	placeholder = "Vim input (i=insert, Esc=normal, :w=submit)",
	initialValue = "",
}) => {
	const theme = useTheme();
	const [mode, setMode] = useState<VimMode>("normal");
	const [input, setInput] = useState(initialValue);
	const [cursorPosition, setCursorPosition] = useState(initialValue.length);
	const [commandBuffer, setCommandBuffer] = useState("");
	const [visualStart, setVisualStart] = useState<number | null>(null);

	const inputRef = useRef(input);

	// Keep ref updated
	useEffect(() => {
		inputRef.current = input;
	}, [input]);

	// Text operations
	const deleteChar = useCallback((position: number) => {
		if (position > 0 && position <= input.length) {
			setInput((prev) => prev.slice(0, position - 1) + prev.slice(position));
			setCursorPosition((prev) => Math.max(0, prev - 1));
		}
	}, []);

	const deleteWord = useCallback((position: number) => {
		// Delete word before cursor
		const before = input.slice(0, position);
		const match = before.match(/(\s*)(\S+)\s*$/);
		if (match) {
			const deleteStart = position - (match[2].length + match[1].length);
			setInput((prev) => prev.slice(0, deleteStart) + prev.slice(position));
			setCursorPosition(deleteStart);
		}
	}, []);

	const deleteLine = useCallback((position: number) => {
		setInput((prev) => prev.slice(position));
		setCursorPosition(0);
	}, []);

	const yankWord = useCallback((position: number) => {
		const before = input.slice(0, position);
		const match = before.match(/(\s*)(\S+)\s*$/);
		if (match) {
			const wordStart = position - (match[2].length + match[1].length);
			return input.slice(wordStart, position);
		}
		return "";
	}, [input]);

	const moveWord = useCallback((position: number, forward: boolean): number => {
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
				} else {
					setCommandBuffer((prev) => prev.slice(0, -1));
				}
				setInput((prev) => prev.slice(0, -1));
			} else if (inputChar && inputChar.length === 1) {
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

	return (
		<Box flexDirection="column">
			{/* Mode indicator */}
			<Box flexDirection="row" marginBottom={1}>
				<Text bold color={modeColor}>
					{mode.toUpperCase()}
				</Text>
				<Text color={theme.colors.textMuted}> </Text>
				<Text dimColor color={theme.colors.textMuted}>
					{mode === "insert" ? "-- INSERT --" : mode === "visual" ? "-- VISUAL --" : ""}
				</Text>
			</Box>

			{/* Input line */}
			<Box flexDirection="row" alignItems="center">
				<Text bold color={theme.colors.secondary}>❯</Text>
				<Text> </Text>
				{/* Render text with cursor */}
				<Box flexDirection="row">
					<Text color={theme.colors.text}>
						{input.slice(0, cursorPosition)}
					</Text>
					<Text color={theme.colors.cursor} inverse>
						{input[cursorPosition] || " "}
					</Text>
					<Text color={theme.colors.text}>
						{input.slice(cursorPosition + 1)}
					</Text>
				</Box>
			</Box>

			{/* Help text */}
			<Text dimColor color={theme.colors.textMuted}>
				{mode === "normal" && "i=insert, :w=write, h/j/k/l=move, w/b=word, gg/G=start/end"}
				{mode === "insert" && "Esc=normal mode, Enter=submit"}
				{mode === "visual" && "Esc=normal, y=yank, d=delete"}
			</Text>
		</Box>
	);
};

export default VimInput;