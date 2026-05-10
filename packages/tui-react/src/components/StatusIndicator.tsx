/**
 * StatusIndicator Component - 60fps smooth animation
 * Premium spinner with fluid state transitions
 */

import React, { useState, useEffect, useRef } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";

export type StatusState = "idle" | "thinking" | "working" | "success" | "error";

export interface StatusIndicatorProps {
	state?: StatusState;
	message?: string;
	toolName?: string;
	size?: "small" | "medium";
}

// Status messages for each state
const STATUS_MESSAGES: Record<StatusState, string> = {
	idle: "",
	thinking: "Thinking",
	working: "Working",
	success: "Done",
	error: "Error",
};

// Smooth state transition timing (ms)
const TRANSITION_DELAY = 150;

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
	state = "idle",
	message,
	toolName,
	size = "medium",
}) => {
	const theme = useTheme();
	const [displayState, setDisplayState] = useState(state);
	const [displayMessage, setDisplayMessage] = useState(message || STATUS_MESSAGES[state]);
	const [frame, setFrame] = useState(0);
	const lastUpdateRef = useRef(Date.now());
	const frameRef = useRef(0);

	// 60fps frame timing (~16ms per frame)
	const FRAME_DELAY = 16;

	// Smooth state transitions
	useEffect(() => {
		const transitionTimeout = setTimeout(() => {
			setDisplayState(state);
			setDisplayMessage(message || STATUS_MESSAGES[state]);
		}, TRANSITION_DELAY);

		return () => clearTimeout(transitionTimeout);
	}, [state, message]);

	// 60fps spinner animation
	useEffect(() => {
		if (displayState === "idle" || displayState === "success" || displayState === "error") {
			return;
		}

		const frames = theme.typography.spinner;
		let animationId: NodeJS.Timeout;

		const animate = () => {
			const now = Date.now();
			const elapsed = now - lastUpdateRef.current;

			if (elapsed >= FRAME_DELAY) {
				frameRef.current = (frameRef.current + 1) % frames.length;
				setFrame(frameRef.current);
				lastUpdateRef.current = now;
			}

			animationId = setTimeout(animate, FRAME_DELAY);
		};

		animationId = setTimeout(animate, FRAME_DELAY);

		return () => clearTimeout(animationId);
	}, [displayState, theme.typography.spinner]);

	// Determine colors based on state
	const getStateColor = () => {
		switch (displayState) {
			case "thinking":
				return theme.colors.primary;
			case "working":
				return theme.colors.accent;
			case "success":
				return theme.colors.success;
			case "error":
				return theme.colors.error;
			default:
				return theme.colors.textMuted;
		}
	};

	const stateColor = getStateColor();
	const showSpinner = displayState !== "idle" && displayState !== "success" && displayState !== "error";

	// Don't render anything in idle state
	if (displayState === "idle") {
		return null;
	}

	// Render based on size
	if (size === "small") {
		return (
			<Box flexDirection="row" alignItems="center">
				{showSpinner && (
					<Text color={stateColor} bold>
						{theme.typography.spinner[frame]}
					</Text>
				)}
				{displayState === "success" && (
					<Text color={theme.colors.success}>✓</Text>
				)}
				{displayState === "error" && (
					<Text color={theme.colors.error}>✗</Text>
				)}
				<Text> </Text>
				{displayMessage && (
					<Text color={theme.colors.textDim}>{displayMessage}</Text>
				)}
				{toolName && (
					<Text color={theme.colors.textMuted}> [{toolName}]</Text>
				)}
			</Box>
		);
	}

	// Medium size - more detailed
	return (
		<Box flexDirection="column" marginY={0}>
			<Box flexDirection="row" alignItems="center">
				{showSpinner && (
					<>
						<Text color={stateColor} bold>
							{theme.typography.spinner[frame]}
						</Text>
						<Text> </Text>
					</>
				)}
				{displayState === "success" && (
					<Text bold color={theme.colors.success}>
						✓
					</Text>
				)}
				{displayState === "error" && (
					<Text bold color={theme.colors.error}>
						✗
					</Text>
				)}
				{displayMessage && (
					<Text color={theme.colors.textDim}>{displayMessage}</Text>
				)}
				{toolName && (
					<Text color={theme.colors.textMuted}> [{toolName}]</Text>
				)}
			</Box>
		</Box>
	);
};

export default StatusIndicator;