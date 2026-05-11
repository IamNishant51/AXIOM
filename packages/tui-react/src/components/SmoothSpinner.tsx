/**
 * SmoothSpinner Component - Enhanced animation like Claude Code
 * Multiple spinner styles with different speeds
 */

import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { useTheme } from "../theme/index.js";

export interface SmoothSpinnerProps {
	type?: "thinking" | "working" | "loading";
	size?: "small" | "medium" | "large";
	label?: string;
	color?: string;
	speed?: "slow" | "normal" | "fast";
	reducedMotion?: boolean;
}

// Premium Braille spinner frames
const SPINNER_FRAMES = {
	small: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧"],
	medium: ["⠋", "⠐", "⠑", "⠡", "⠢", "⠣", "⠤", "⠥", "⠦", "⠧", "⠨", "⠩"],
	large: ["⠁⠂⠄", " ⠂⠄", "  ⠄", "   ⠄", "    ⠠", "     ⠐", "      ⠈", "     ⠐"],
};

// Thinking spinner (subtle, slower)
const THINKING_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// Working spinner (more active)
const WORKING_FRAMES = ["◐", "◑", "◒", "◓", "◔", "◕"];

// Speed configurations (ms per frame)
const SPEED_CONFIG = {
	slow: 120,
	normal: 60,
	fast: 30,
};

export const SmoothSpinner: React.FC<SmoothSpinnerProps> = ({
	type = "thinking",
	size = "medium",
	label,
	color,
	speed = "normal",
	reducedMotion = false,
}) => {
	const theme = useTheme();
	const [frame, setFrame] = useState(0);

	const frames = type === "thinking" ? THINKING_FRAMES : type === "working" ? WORKING_FRAMES : SPINNER_FRAMES[size];
	const frameDelay = SPEED_CONFIG[speed];

	// Animation frame
	useEffect(() => {
		if (reducedMotion) {
			setFrame(0);
			return;
		}

		const interval = setInterval(() => {
			setFrame((prev) => (prev + 1) % frames.length);
		}, frameDelay);

		return () => clearInterval(interval);
	}, [frameDelay, frames.length, reducedMotion]);

	const spinnerColor = color || theme.colors.primary;

	// Thinking type - subtle with label
	if (type === "thinking") {
		return (
			<Box flexDirection="row" alignItems="center">
				<Text color={spinnerColor}>{frames[frame]}</Text>
				{label && (
					<>
						<Text> </Text>
						<Text color={theme.colors.textMuted}>{label}</Text>
					</>
				)}
			</Box>
		);
	}

	// Working type - more prominent
	if (type === "working") {
		return (
			<Box flexDirection="row" alignItems="center">
				<Text bold color={spinnerColor}>{frames[frame]}</Text>
				{label && (
					<>
						<Text> </Text>
						<Text color={theme.colors.textDim}>{label}</Text>
					</>
				)}
			</Box>
		);
	}

	// Default loading spinner
	return (
		<Box flexDirection="row" alignItems="center">
			<Text color={spinnerColor} bold>
				{frames[frame]}
			</Text>
			{label && (
				<>
					<Text> </Text>
					<Text color={theme.colors.textDim}>{label}</Text>
				</>
			)}
		</Box>
	);
};

// Compact indicator for status bar
export const StatusIndicatorDot: React.FC<{
	isActive: boolean;
	label?: string;
}> = ({ isActive, label }) => {
	const theme = useTheme();

	if (!isActive) return null;

	return (
		<Box flexDirection="row" alignItems="center">
			<Text color={theme.colors.accent}>●</Text>
			{label && (
				<>
					<Text> </Text>
					<Text color={theme.colors.textMuted}>{label}</Text>
				</>
			)}
		</Box>
	);
};

export default SmoothSpinner;