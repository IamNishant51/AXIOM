/**
 * InputManager Component - Premium command input with / palette
 * Simple, robust implementation
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";

export interface Command {
	name: string;
	description: string;
	action: string;
}

export interface InputManagerProps {
	onSubmit: (value: string) => void;
	placeholder?: string;
	commands?: Command[];
	disabled?: boolean;
}

const DEFAULT_COMMANDS: Command[] = [
	{ name: "/clear", description: "Clear conversation", action: "clear" },
	{ name: "/help", description: "Show commands", action: "help" },
	{ name: "/exit", description: "Exit", action: "exit" },
];

export const InputManager: React.FC<InputManagerProps> = ({
	onSubmit,
	placeholder = "Message Axiom...",
	commands = DEFAULT_COMMANDS,
	disabled = false,
}) => {
	const theme = useTheme();
	const [input, setInput] = useState("");
	const [showPalette, setShowPalette] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);

	const filteredCommands = showPalette
		? commands.filter((cmd) =>
				cmd.name.toLowerCase().includes(input.toLowerCase().slice(1))
			)
		: [];

	// Handle keyboard input
	useInput((inputChar, key) => {
		if (disabled) return;

		// Palette navigation
		if (showPalette) {
			if (key.upArrow || inputChar === "k") {
				setSelectedIndex((prev) =>
					prev > 0 ? prev - 1 : filteredCommands.length - 1
				);
				return;
			}
			if (key.downArrow || inputChar === "j") {
				setSelectedIndex((prev) =>
					prev < filteredCommands.length - 1 ? prev + 1 : 0
				);
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
			// Handle backspace in palette mode - delete character or close palette if empty
			if (key.backspace || key.delete || inputChar === "\x7f" || inputChar === "\b" || inputChar === "") {
				if (input.length > 1) {
					setInput((prev) => prev.slice(0, -1));
				} else {
					setShowPalette(false);
					setInput("");
				}
				return;
			}
			// If typing regular chars, close palette
			if (inputChar && !key.escape) {
				setShowPalette(false);
			}
		}

		// Regular input handling
		if (key.return) {
			const value = input.trim();
			if (value) {
				if (value === "/") {
					setShowPalette(true);
					setSelectedIndex(0);
				} else {
					setInput("");
					onSubmit(value);
				}
			}
		} else if (key.backspace || key.delete || inputChar === "\x7f" || inputChar === "\b" || inputChar === "") {
			// Handle backspace from all terminal types:
			// - key.backspace: Ink's built-in backspace detection
			// - key.delete: Delete key
			// - \x7f: DEL character (some terminals)
			// - \b: Backspace character
			// - : Unicode backspace
			if (input.length > 0) {
				setInput((prev) => prev.slice(0, -1));
			}
		} else if (inputChar && inputChar.length === 1) {
			// Start palette if typing /
			if (inputChar === "/" && !showPalette) {
				setShowPalette(true);
				setSelectedIndex(0);
				setInput("/");
			} else {
				setInput((prev) => prev + inputChar);
			}
		}
	});

	return (
		<Box flexDirection="column">
			{/* Command Palette */}
			{showPalette && filteredCommands.length > 0 && (
				<Box flexDirection="column" borderStyle="round" borderColor={theme.colors.border} marginBottom={1}>
					{filteredCommands.map((cmd, index) => (
						<Box key={cmd.name} flexDirection="row" paddingX={2}>
							<Text
								bold={index === selectedIndex}
								color={index === selectedIndex ? theme.colors.text : theme.colors.primary}
								inverse={index === selectedIndex}
							>
								{cmd.name}
							</Text>
							<Text color={theme.colors.textMuted}> {cmd.description}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Input Line */}
			<Box flexDirection="row" alignItems="center">
				<Text bold color={theme.colors.primary}>{theme.typography.cursor}</Text>
				<Text> </Text>
				{disabled ? (
					<Text color={theme.colors.textMuted}>{placeholder}</Text>
				) : (
					<>
						<Text color={theme.colors.text}>{input}</Text>
						<Text color={theme.colors.cursor}>█</Text>
					</>
				)}
			</Box>
		</Box>
	);
};

export default InputManager;