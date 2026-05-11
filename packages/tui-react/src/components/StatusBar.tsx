/**
 * StatusBar - Persistent status display
 * Shows model, tokens, connection, memory, etc.
 */

import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";
import { SmoothSpinner } from "./SmoothSpinner.js";

export interface StatusBarProps {
	model?: string;
	totalTokens?: number;
	inputTokens?: number;
	outputTokens?: number;
	connectionStatus?: "connected" | "disconnected" | "connecting";
	memoryLoaded?: boolean;
	memoryFiles?: string[];
	mcpServers?: string[];
	isProcessing?: boolean;
	toolName?: string;
	onToggleInfo?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
	model = "minimax-m2.5-free",
	totalTokens = 0,
	inputTokens = 0,
	outputTokens = 0,
	connectionStatus = "connected",
	memoryLoaded = false,
	memoryFiles = [],
	mcpServers = [],
	isProcessing = false,
	toolName,
}) => {
	const theme = useTheme();
	const [showDetails, setShowDetails] = useState(false);
	const [currentTime, setCurrentTime] = useState(new Date());

	// Update time every minute
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, 60000);
		return () => clearInterval(interval);
	}, []);

	// Connection status color and icon
	const getConnectionDisplay = () => {
		switch (connectionStatus) {
			case "connected":
				return { icon: "●", color: theme.colors.success };
			case "connecting":
				return { icon: "◐", color: theme.colors.warning };
			case "disconnected":
				return { icon: "○", color: theme.colors.error };
		}
	};

	const conn = getConnectionDisplay();

	// Toggle details view
	useInput((input) => {
		if (input === "s" || input === "S") {
			setShowDetails((prev) => !prev);
		}
	});

	// Render memory files
	const renderMemoryFiles = () => {
		if (memoryFiles.length === 0) return null;
		const displayFiles = memoryFiles.slice(0, 3);
		const remaining = memoryFiles.length - 3;
		return (
			<Box flexDirection="row">
				<Text color={theme.colors.textMuted}>Memory: </Text>
				{displayFiles.map((file, i) => (
					<Text key={i} color={theme.colors.accent}>
						{file}
					</Text>
				))}
				{remaining > 0 && (
					<Text color={theme.colors.textMuted}> +{remaining} more</Text>
				)}
			</Box>
		);
	};

	// Render MCP servers
	const renderMcpServers = () => {
		if (mcpServers.length === 0) return null;
		return (
			<Box flexDirection="row">
				<Text color={theme.colors.textMuted}>MCP: </Text>
				{mcpServers.map((server, i) => (
					<Text key={i} color={theme.colors.secondary}>
						{server}
					</Text>
				))}
			</Box>
		);
	};

	return (
		<Box flexDirection="column">
			{/* Main status bar */}
			<Box flexDirection="row" justifyContent="space-between" alignItems="center">
				<Box flexDirection="row" alignItems="center">
					<Text color={theme.colors.primary}>{model}</Text>
					<Text color={theme.colors.textMuted}> | </Text>
					<Text color={conn.color}>{conn.icon}</Text>
					<Text color={theme.colors.textMuted}> </Text>
					{isProcessing ? (
						<>
							<SmoothSpinner type="thinking" size="small" speed="fast" />
							{toolName && (
								<>
									<Text color={theme.colors.textMuted}> </Text>
									<Text color={theme.colors.secondary}>{toolName}</Text>
								</>
							)}
						</>
					) : (
						<Text color={theme.colors.textMuted}>idle</Text>
					)}
				</Box>

				<Box flexDirection="row" alignItems="center">
					{memoryLoaded && (
						<>
							<Text color={theme.colors.accent}>◆</Text>
							<Text color={theme.colors.textMuted}> Memory</Text>
							<Text color={theme.colors.textMuted}> | </Text>
						</>
					)}
					<Text color={theme.colors.textMuted}>
						{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
					</Text>
				</Box>
			</Box>

			{/* Expanded details */}
			{showDetails && (
				<Box flexDirection="column" marginTop={1} paddingLeft={2}>
					<Box flexDirection="row">
						<Text color={theme.colors.textMuted}>Tokens: </Text>
						<Text color={theme.colors.textDim}>{totalTokens}</Text>
						<Text color={theme.colors.textMuted}> (</Text>
						<Text color={theme.colors.textDim}>{inputTokens}</Text>
						<Text color={theme.colors.textMuted}>, </Text>
						<Text color={theme.colors.textDim}>{outputTokens}</Text>
						<Text color={theme.colors.textMuted}>)</Text>
					</Box>
					{renderMemoryFiles()}
					{renderMcpServers()}
				</Box>
			)}

			{/* Help hint */}
			<Text dimColor color={theme.colors.textMuted}>
				[Press S for status details]
			</Text>
		</Box>
	);
};

// Compact status for inline display
export const CompactStatus: React.FC<{
	processing?: boolean;
	toolName?: string;
}> = ({ processing = false, toolName }) => {
	const theme = useTheme();

	if (!processing) return null;

	return (
		<Box flexDirection="row" alignItems="center">
			<Text color={theme.colors.accent}>●</Text>
			<Text color={theme.colors.textMuted}> </Text>
			{toolName ? (
				<Text color={theme.colors.primary}>{toolName}</Text>
			) : (
				<Text color={theme.colors.textMuted}>Working...</Text>
			)}
		</Box>
	);
};

export default StatusBar;