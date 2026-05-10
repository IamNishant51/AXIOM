/**
 * StreamedResponse Component - Anti-jitter streaming output
 * Efficiently batches updates and renders content
 */

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";

export interface StreamChunk {
	type: "text" | "thinking" | "tool_call" | "tool_result";
	content: string;
	toolName?: string;
	timestamp?: number;
}

export interface StreamedResponseProps {
	chunks: StreamChunk[];
	isStreaming?: boolean;
	showThinking?: boolean;
	showToolCalls?: boolean;
	onComplete?: () => void;
}

// Memoized static message component to prevent re-renders
const StaticMessage = memo<{ chunks: StreamChunk[]; theme: any }>(
	({ chunks, theme }) => (
		<Box flexDirection="column">
			{chunks.map((chunk, index) => {
				if (chunk.type === "thinking") {
					return (
						<Text key={index} color={theme.colors.textMuted} italic>
							[Thinking] {chunk.content}
						</Text>
					);
				}
				if (chunk.type === "tool_call") {
					return (
						<Text key={index} color={theme.colors.primary}>
							[{chunk.toolName || "tool"}...]
						</Text>
					);
				}
				if (chunk.type === "tool_result") {
					return (
						<Text key={index} color={theme.colors.textDim}>
							[{chunk.toolName || "tool"} done]
						</Text>
					);
				}
				// Text content
				return (
					<Text key={index} color={theme.colors.text}>
						{chunk.content}
					</Text>
				);
			})}
		</Box>
	)
);

StaticMessage.displayName = "StaticMessage";

export const StreamedResponse: React.FC<StreamedResponseProps> = ({
	chunks,
	isStreaming = false,
	showThinking = true,
	showToolCalls = true,
	onComplete,
}) => {
	const theme = useTheme();
	const [displayedChunks, setDisplayedChunks] = useState<StreamChunk[]>([]);
	const [activeChunk, setActiveChunk] = useState<StreamChunk | null>(null);
	const lastChunkRef = useRef<string>("");

	// Separate completed chunks from actively streaming one
	useEffect(() => {
		// Find the last complete chunks vs the currently streaming one
		if (chunks.length === 0) {
			setDisplayedChunks([]);
			setActiveChunk(null);
			return;
		}

		// If not streaming, all chunks are finalized
		if (!isStreaming) {
			setDisplayedChunks(chunks);
			setActiveChunk(null);
			onComplete?.();
			return;
		}

		// For streaming, keep all but the last as static, last one is active
		const completed = chunks.slice(0, -1);
		const active = chunks[chunks.length - 1];

		// Only update if there's a change to avoid re-renders
		const completedKey = JSON.stringify(completed.map((c) => c.content));
		if (completedKey !== lastChunkRef.current) {
			setDisplayedChunks(completed);
			lastChunkRef.current = completedKey;
		}

		setActiveChunk(active);
	}, [chunks, isStreaming, onComplete]);

	// Batch update timer to reduce re-renders during rapid streaming
	const [pendingContent, setPendingContent] = useState("");
	const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!activeChunk) return;

		// For text chunks, update in batches of 50ms to reduce flicker
		if (activeChunk.type === "text") {
			if (flushTimeoutRef.current) {
				clearTimeout(flushTimeoutRef.current);
			}

			flushTimeoutRef.current = setTimeout(() => {
				setPendingContent(activeChunk.content);
			}, 50);
		} else {
			setPendingContent(activeChunk.content);
		}

		return () => {
			if (flushTimeoutRef.current) {
				clearTimeout(flushTimeoutRef.current);
			}
		};
	}, [activeChunk]);

	// Render completed chunks (only these re-render when finalized)
	const renderCompleted = () => {
		if (displayedChunks.length === 0) return null;
		return <StaticMessage chunks={displayedChunks} theme={theme} />;
	};

	// Render active streaming chunk (this is the only component that updates during streaming)
	const renderActive = () => {
		if (!activeChunk || !isStreaming) return null;

		if (activeChunk.type === "thinking" && !showThinking) return null;
		if ((activeChunk.type === "tool_call" || activeChunk.type === "tool_result") && !showToolCalls)
			return null;

		if (activeChunk.type === "thinking") {
			return (
				<Text color={theme.colors.textMuted} italic>
					[Thinking] {pendingContent || activeChunk.content}
				</Text>
			);
		}

		if (activeChunk.type === "tool_call") {
			return (
				<Text color={theme.colors.primary}>
					[{activeChunk.toolName || "tool"}...] {pendingContent || ""}
				</Text>
			);
		}

		if (activeChunk.type === "tool_result") {
			return (
				<Text color={theme.colors.textDim}>
					[{activeChunk.toolName || "tool"} done] {pendingContent || ""}
				</Text>
			);
		}

		// Text chunk - render directly without Box wrapper to prevent jitter
		return <Text color={theme.colors.text}>{pendingContent || activeChunk.content}</Text>;
	};

	return (
		<Box flexDirection="column">
			{/* Completed chunks - memoized to prevent re-renders */}
			{renderCompleted()}

			{/* Active streaming chunk - only this updates during streaming */}
			{renderActive()}
		</Box>
	);
};

// Convenience component for complete, non-streaming content
export const StaticResponse: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const theme = useTheme();
	return (
		<Box flexDirection="column">
			<Text color={theme.colors.text}>{children}</Text>
		</Box>
	);
};

export default StreamedResponse;