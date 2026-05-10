/**
 * App.tsx - Main Layout Component
 * Premium Terminal UI - Claude Code Style
 */

import React, { useCallback, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { useTheme } from "./theme/index.js";
import InputManager from "./components/InputManager.js";
import StatusIndicator, { StatusState } from "./components/StatusIndicator.js";

export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: number;
	thinking?: string;
	toolCalls?: Array<{ name: string; args: any; result?: string }>;
}

// Simple markdown renderer for terminal
interface MarkdownSegment {
	type: "text" | "bold" | "italic" | "code" | "codeblock" | "list" | "link" | "heading";
	content: string;
	language?: string;
}

function parseMarkdown(content: string): React.ReactNode[] {
	const lines = content.split("\n");
	const elements: React.ReactNode[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Code block (```language)
		if (line.startsWith("```")) {
			const language = line.slice(3).trim();
			const codeLines: string[] = [];
			i++;
			while (i < lines.length && !lines[i].startsWith("```")) {
				codeLines.push(lines[i]);
				i++;
			}
			elements.push(
				<Box key={i} flexDirection="column" marginY={1}>
					{language && (
						<Text color="#60A5FA">{language}</Text>
					)}
					<Text color="#34D399">
						{codeLines.map((l, j) => (
							<Text key={j}>{l}{"\n"}</Text>
						))}
					</Text>
				</Box>
			);
			continue;
		}

		// Heading (#, ##, ###)
		const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			const text = headingMatch[2];
			elements.push(
				<Text key={i} bold color={level === 1 ? "#60A5FA" : level === 2 ? "#A78BFA" : "#34D399"}>
					{text}
				</Text>
			);
			continue;
		}

		// List item (- or * or 1.)
		const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
		if (listMatch) {
			const indent = listMatch[1].length;
			const marker = listMatch[2];
			const text = listMatch[3];
			elements.push(
				<Box key={i} paddingLeft={indent}>
					<Text color="#A78BFA">{marker} </Text>
					<Text color="#F5F5F5">{parseInlineMarkdown(text)}</Text>
				</Box>
			);
			continue;
		}

		// Horizontal rule
		if (line.match(/^[-*_]{3,}$/)) {
			elements.push(
				<Text key={i} color="#404040">────────────────────────────────</Text>
			);
			continue;
		}

		// Regular line with inline markdown
		if (line.trim()) {
			elements.push(
				<Text key={i} color="#F5F5F5">{parseInlineMarkdown(line)}</Text>
			);
		} else {
			// Empty line
			elements.push(<Text key={i}>{"\n"}</Text>);
		}
	}

	return elements;
}

function parseInlineMarkdown(text: string): React.ReactNode {
	// Handle inline code (`code`)
	const parts: React.ReactNode[] = [];
	let remaining = text;
	let keyIndex = 0;

	while (remaining.length > 0) {
		// Inline code: `code`
		const codeMatch = remaining.match(/`([^`]+)`/);
		if (codeMatch) {
			const before = remaining.slice(0, codeMatch.index);
			if (before) parts.push(<Text key={keyIndex++}>{before}</Text>);
			parts.push(<Text key={keyIndex++} color="#34D399">{codeMatch[1]}</Text>);
			remaining = remaining.slice(codeMatch.index! + codeMatch[0].length);
			continue;
		}

		// Bold: **text**
		const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
		if (boldMatch) {
			const before = remaining.slice(0, boldMatch.index);
			if (before) parts.push(<Text key={keyIndex++}>{before}</Text>);
			parts.push(<Text key={keyIndex++} bold>{boldMatch[1]}</Text>);
			remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
			continue;
		}

		// Italic: *text* or _text_
		const italicMatch = remaining.match(/\*([^*]+)\*|_([^_]+)_/);
		if (italicMatch) {
			const before = remaining.slice(0, italicMatch.index);
			if (before) parts.push(<Text key={keyIndex++}>{before}</Text>);
			const italicText = italicMatch[1] || italicMatch[2];
			parts.push(<Text key={keyIndex++} italic>{italicText}</Text>);
			remaining = remaining.slice(italicMatch.index! + italicMatch[0].length);
			continue;
		}

		// Link: [text](url)
		const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
		if (linkMatch) {
			const before = remaining.slice(0, linkMatch.index);
			if (before) parts.push(<Text key={keyIndex++}>{before}</Text>);
			parts.push(<Text key={keyIndex++} color="#60A5FA" underline>{linkMatch[1]}</Text>);
			remaining = remaining.slice(linkMatch.index! + linkMatch[0].length);
			continue;
		}

		// No more matches, add rest
		parts.push(<Text key={keyIndex++}>{remaining}</Text>);
		break;
	}

	return parts.length > 0 ? <>{parts}</> : text;
}

export interface AppProps {
	messages?: Message[];
	onMessage?: (message: string) => void;
	onCommand?: (command: string) => void;
	aiState?: StatusState;
	aiMessage?: string;
	aiToolName?: string;
	isStreaming?: boolean;
	disabled?: boolean;
	commands?: Array<{ name: string; description: string; action: string }>;
}

export const App: React.FC<AppProps> = ({
	messages = [],
	onMessage,
	onCommand,
	aiState = "idle",
	aiMessage,
	aiToolName,
	isStreaming = false,
	disabled = false,
	commands,
}) => {
	const theme = useTheme();
	const { exit } = useApp();
	const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());
	const [showAllThinking, setShowAllThinking] = useState(true);

	// Toggle thinking expansion for a specific message
	const toggleThinking = (msgId: string) => {
		setExpandedThinking((prev) => {
			const next = new Set(prev);
			if (next.has(msgId)) {
				next.delete(msgId);
			} else {
				next.add(msgId);
			}
			return next;
		});
	};

	// Keyboard handler for toggling thinking display
	useInput((input, key) => {
		// Press 't' to toggle all thinking visibility when input is empty
		if (input === "t" && !disabled && !isStreaming) {
			setShowAllThinking((prev) => !prev);
		}
	});

	// Handle user submit
	const handleSubmit = useCallback(
		(value: string) => {
			if (value.startsWith("/")) {
				if (value === "/clear") {
					// Parent handles clear via messages prop update
					onCommand?.("clear");
				} else if (value === "/exit") {
					exit();
				} else {
					onCommand?.(value);
				}
				return;
			}
			onMessage?.(value);
		},
		[onMessage, onCommand, exit]
	);

	// Render history
	const renderHistory = () => {
		if (messages.length === 0) {
			return (
				<Text color={theme.colors.textMuted}>
					Type a message to start...
				</Text>
			);
		}

		return messages.map((msg) => (
			<Box key={msg.id} flexDirection="column" marginBottom={1}>
				<Box flexDirection="row">
					<Text bold color={msg.role === "user" ? theme.colors.primary : theme.colors.accent}>
						{msg.role === "user" ? "❯" : "○"}
					</Text>
					<Text color={theme.colors.textMuted}> </Text>
					<Text bold color={theme.colors.textDim}>
						{msg.role === "user" ? "You" : "Axiom"}
					</Text>
				</Box>
				<Box paddingLeft={2} flexDirection="column">
					{msg.thinking && (
						<Box flexDirection="column">
							<Box flexDirection="row">
								<Text color={theme.colors.secondary} bold>
									[{showAllThinking || expandedThinking.has(msg.id) ? "▼" : "▶"} Thinking]
								</Text>
								<Text color={theme.colors.textMuted}> </Text>
								<Text color={theme.colors.textMuted}>
									[Press 't' to toggle all]
								</Text>
							</Box>
							{(showAllThinking || expandedThinking.has(msg.id)) && (
								<Box paddingLeft={2} flexDirection="column" marginTop={1}>
									<Text color={theme.colors.secondary} italic>
										{msg.thinking}
									</Text>
								</Box>
							)}
						</Box>
					)}
					{msg.toolCalls?.map((tc, i) => (
						<Text key={i} color={theme.colors.primary}>
							[{tc.name}...]
						</Text>
					))}
					{parseMarkdown(msg.content)}
				</Box>
			</Box>
		));
	};

	return (
		<Box flexDirection="column" paddingX={1}>
			{/* Header */}
			<Box flexDirection="row">
				<Text color={theme.colors.primary}>╭</Text>
				<Text color={theme.colors.borderDim}>────────────────────────────────────────────────────────────</Text>
				<Text color={theme.colors.primary}>╮</Text>
			</Box>
			<Box flexDirection="row">
				<Text color={theme.colors.primary}>│</Text>
				<Text> </Text>
				<Text bold color={theme.colors.primary}>🤖 Axiom</Text>
				<Text color={theme.colors.textMuted}> v0.1.0</Text>
				<Text color={theme.colors.borderDim}>                                           </Text>
				<Text color={theme.colors.primary}>│</Text>
			</Box>
			<Box flexDirection="row">
				<Text color={theme.colors.primary}>╰</Text>
				<Text color={theme.colors.borderDim}>────────────────────────────────────────────────────────────</Text>
				<Text color={theme.colors.primary}>╯</Text>
			</Box>

			{/* History */}
			<Box flexDirection="column" minHeight={10}>
				{renderHistory()}
			</Box>

			{/* Divider */}
			<Box flexDirection="row">
				<Text color={theme.colors.borderDim}>────────────────────────────────────────────────────────────</Text>
			</Box>

			{/* Status */}
			<StatusIndicator state={aiState} message={aiMessage} toolName={aiToolName} size="small" />

			{/* Input */}
			<InputManager
				onSubmit={handleSubmit}
				placeholder="Message Axiom..."
				commands={commands}
				disabled={disabled || isStreaming}
			/>
		</Box>
	);
};

export default App;