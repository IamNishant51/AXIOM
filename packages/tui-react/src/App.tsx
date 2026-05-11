/**
 * App.tsx - Main Layout Component
 * Claude Code CLI Style Implementation
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

// Enhanced markdown renderer - Claude Code style
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
			// Claude Code style: code blocks with dark background feel
			elements.push(
				<Box key={`code-${i}`} flexDirection="column" marginY={1} paddingLeft={2}>
					{language && (
						<Text dimColor color="#60A5FA">{language}</Text>
					)}
					{codeLines.map((l, j) => (
						<Text key={j} color="#34D399">
							{l}
						</Text>
					))}
				</Box>
			);
			continue;
		}

		// Heading (#, ##, ###)
		const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			const text = headingMatch[2];
			const colors = ["#60A5FA", "#A78BFA", "#34D399"] as const;
			elements.push(
				<Text key={i} bold color={colors[level - 1]}>
					{text}
				</Text>
			);
			continue;
		}

		// Horizontal rule
		if (line.match(/^[-*_]{3,}$/)) {
			elements.push(
				<Text key={i} dimColor color="#404040">───</Text>
			);
			continue;
		}

		// List item (-, *, or numbered)
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

		// Regular line with inline markdown
		if (line.trim()) {
			elements.push(
				<Text key={i} color="#F5F5F5">
					{parseInlineMarkdown(line)}
				</Text>
			);
		} else {
			elements.push(<Text key={i}>{"\n"}</Text>);
		}
	}

	return elements;
}

// Inline markdown parser
function parseInlineMarkdown(text: string): React.ReactNode {
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

		parts.push(<Text key={keyIndex++}>{remaining}</Text>);
		break;
	}

	return parts.length > 0 ? <>{parts}</> : text;
}

// Tool call display - Claude Code style
function renderToolCalls(toolCalls: Message["toolCalls"], theme: any) {
	if (!toolCalls || toolCalls.length === 0) return null;

	return (
		<Box flexDirection="column" marginTop={1}>
			{toolCalls.map((tc, i) => (
				<Box key={i} flexDirection="row" alignItems="center">
					<Text color={theme.colors.primary}>●</Text>
					<Text color={theme.colors.textMuted}> </Text>
					<Text color={theme.colors.primary} bold>{tc.name}</Text>
					<Text color={theme.colors.textMuted}> - running...</Text>
				</Box>
			))}
		</Box>
	);
}

// Thinking display - Claude Code style
function renderThinking(
	thinking: string | undefined,
	showAllThinking: boolean,
	expandedThinking: Set<string>,
	msgId: string,
	theme: any
) {
	if (!thinking) return null;

	const isExpanded = showAllThinking || expandedThinking.has(msgId);

	return (
		<Box flexDirection="column" marginBottom={1}>
			<Box flexDirection="row" alignItems="center">
				<Text color={theme.colors.secondary}>
					{isExpanded ? "▼" : "▶"}
				</Text>
				<Text color={theme.colors.textMuted}> </Text>
				<Text color={theme.colors.secondary} bold>Reasoning</Text>
				<Text color={theme.colors.textMuted}> </Text>
				<Text dimColor color={theme.colors.textMuted}>
					[Tab]
				</Text>
			</Box>
			{isExpanded && (
				<Box paddingLeft={2} flexDirection="column" marginTop={1}>
					<Text color={theme.colors.textDim} italic>
						{thinking}
					</Text>
				</Box>
			)}
		</Box>
	);
}

// Message bubble - Claude Code style
function renderMessage(msg: Message, theme: any, showAllThinking: boolean, expandedThinking: Set<string>) {
	const isUser = msg.role === "user";

	return (
		<Box key={msg.id} flexDirection="column" marginBottom={2}>
			{/* Role indicator */}
			<Box flexDirection="row" alignItems="center">
				<Text bold color={isUser ? theme.colors.primary : theme.colors.accent}>
					{isUser ? "❯" : "○"}
				</Text>
				<Text color={theme.colors.textMuted}> </Text>
				<Text bold color={theme.colors.textDim}>
					{isUser ? "You" : "Axiom"}
				</Text>
			</Box>

			{/* Content */}
			<Box paddingLeft={2} flexDirection="column">
				{/* Thinking/Reasoning - only for assistant */}
				{!isUser && renderThinking(msg.thinking, showAllThinking, expandedThinking, msg.id, theme)}

				{/* Tool calls */}
				{!isUser && renderToolCalls(msg.toolCalls, theme)}

				{/* Message content */}
				{parseMarkdown(msg.content)}
			</Box>
		</Box>
	);
}

export const App: React.FC<{
	messages?: Message[];
	onMessage?: (message: string) => void;
	onCommand?: (command: string) => void;
	aiState?: StatusState;
	aiMessage?: string;
	aiToolName?: string;
	isStreaming?: boolean;
	disabled?: boolean;
	commands?: Array<{ name: string; description: string; action: string }>;
}> = ({
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
	const [showAllThinking, setShowAllThinking] = useState(false); // Default collapsed

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

	// Keyboard handler for toggling thinking (Tab key)
	useInput((input, key) => {
		if (disabled || isStreaming) return;
		if (key.tab) {
			setShowAllThinking((prev) => !prev);
		}
	});

	// Handle user submit
	const handleSubmit = useCallback(
		(value: string) => {
			if (value.startsWith("/")) {
				if (value === "/clear") {
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
				<Text dimColor color={theme.colors.textMuted}>
					Type a message...
				</Text>
			);
		}

		return messages.map((msg) => renderMessage(msg, theme, showAllThinking, expandedThinking));
	};

	return (
		<Box flexDirection="column" paddingX={1}>
			{/* Minimal Header - Claude Code style */}
			<Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
				<Box flexDirection="row" alignItems="center">
					<Text bold color={theme.colors.primary}>▲</Text>
					<Text> </Text>
					<Text bold color={theme.colors.text}>Axiom</Text>
					<Text color={theme.colors.textMuted}> v0.1.0</Text>
				</Box>
				<Text color={theme.colors.textMuted}>minimax-m2.5-free</Text>
			</Box>

			{/* Subtle divider */}
			<Text dimColor color={theme.colors.borderDim}>────────────────────────────────────────────────────────────</Text>

			{/* History */}
			<Box flexDirection="column" minHeight={10}>
				{renderHistory()}
			</Box>

			{/* Divider */}
			<Text dimColor color={theme.colors.borderDim}>────────────────────────────────────────────────────────────</Text>

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