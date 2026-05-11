/**
 * StreamingResponse Component - Real-time streaming text
 * Character-by-character streaming with no layout jitter
 */

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";

export interface StreamChunk {
	type: "text" | "thinking" | "tool_call" | "tool_result" | "tool_output";
	content: string;
	toolName?: string;
	timestamp?: number;
}

export interface StreamingResponseProps {
	initialContent?: string;
	isStreaming?: boolean;
	onComplete?: () => void;
	showCursor?: boolean;
	style?: "plain" | "markdown" | "code";
}

// Memoized to prevent re-renders
const StreamedContent = memo<{ content: string; style: string; theme: any }>(
	({ content, style, theme }) => {
		if (style === "markdown") {
			const lines = content.split("\n");
			return (
				<Box flexDirection="column">
					{lines.map((line, i) => (
						<Text key={i} color={theme.colors.text}>
							{line || " "}
						</Text>
					))}
				</Box>
			);
		}
		return <Text color={theme.colors.text}>{content}</Text>;
	}
);
StreamedContent.displayName = "StreamedContent";

export const StreamingResponse: React.FC<StreamingResponseProps> = ({
	initialContent = "",
	isStreaming = false,
	onComplete,
	showCursor = true,
	style = "plain",
}) => {
	const theme = useTheme();
	const [displayedContent, setDisplayedContent] = useState(initialContent);
	const [isComplete, setIsComplete] = useState(!isStreaming);
	const [cursorVisible, setCursorVisible] = useState(true);

	const contentRef = useRef(initialContent);
	const indexRef = useRef(initialContent.length);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Update ref when initialContent changes
	useEffect(() => {
		contentRef.current = initialContent;
		setDisplayedContent(initialContent);
		indexRef.current = initialContent.length;
		setIsComplete(!isStreaming);
	}, [initialContent, isStreaming]);

	// Cursor blink effect
	useEffect(() => {
		if (!isStreaming || isComplete) return;

		const interval = setInterval(() => {
			setCursorVisible((prev) => !prev);
		}, 530);

		return () => clearInterval(interval);
	}, [isStreaming, isComplete]);

	// Typing effect
	useEffect(() => {
		if (isComplete || !isStreaming) return;

		const typeNext = () => {
			const remaining = contentRef.current.slice(indexRef.current);

			if (!remaining) {
				setIsComplete(true);
				setCursorVisible(true);
				onComplete?.();
				return;
			}

			// Type faster for streaming - 1-3 chars at a time for smooth but fast feel
			const chunkSize = remaining.length > 50 ? 5 : remaining.length > 20 ? 3 : 1;
			const chunk = remaining.slice(0, chunkSize);

			indexRef.current += chunkSize;
			setDisplayedContent((prev) => prev + chunk);

			// Variable speed based on content
			const delay = chunkSize * 8;
			timeoutRef.current = setTimeout(typeNext, delay);
		};

		timeoutRef.current = setTimeout(typeNext, 50);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [isComplete, isStreaming, onComplete]);

	// If not streaming and has content, render immediately
	const renderContent = () => {
		if (!isStreaming && displayedContent) {
			return <StreamedContent content={displayedContent} style={style} theme={theme} />;
		}

		// Streaming mode
		return <StreamedContent content={displayedContent} style={style} theme={theme} />;
	};

	return (
		<Box flexDirection="column">
			{renderContent()}
			{showCursor && isStreaming && !isComplete && (
				<Text color={cursorVisible ? theme.colors.cursor : "transparent"}>
					█
				</Text>
			)}
		</Box>
	);
};

// Streaming thinking component with distinctive styling
export const StreamingThinking: React.FC<{
	thinking: string;
	isStreaming?: boolean;
	isExpanded?: boolean;
}> = ({ thinking, isStreaming = false, isExpanded = true }) => {
	const theme = useTheme();

	if (!isExpanded) {
		return (
			<Box flexDirection="row" alignItems="center">
				<Text color={theme.colors.secondary}>▶</Text>
				<Text color={theme.colors.textMuted}> Reasoning</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" marginBottom={1}>
			<Box flexDirection="row" alignItems="center">
				<Text color={theme.colors.secondary}>▼</Text>
				<Text color={theme.colors.textMuted}> Reasoning</Text>
				{isStreaming && (
					<Text color={theme.colors.textMuted}> </Text>
				)}
			</Box>
			<Box paddingLeft={2} flexDirection="column" marginTop={1}>
				<Text color={theme.colors.textDim} italic>
					{thinking}
				</Text>
			</Box>
		</Box>
	);
};

export default StreamingResponse;