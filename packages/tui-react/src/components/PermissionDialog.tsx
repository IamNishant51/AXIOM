/**
 * PermissionDialog - Authorization prompts for tool execution
 * Like Claude Code's permission dialogs
 */

import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";

export type PermissionType = "tool" | "write" | "dangerous" | "network";

export interface PermissionDialogProps {
	type: PermissionType;
	title: string;
	message: string;
	details?: string;
	onAllow: () => void;
	onDeny: () => void;
	onAllowOnce?: () => void;
	preview?: string; // For file write previews
}

export const PermissionDialog: React.FC<PermissionDialogProps> = ({
	type,
	title,
	message,
	details,
	onAllow,
	onDeny,
	onAllowOnce,
	preview,
}) => {
	const theme = useTheme();
	const [selected, setSelected] = useState<"allow" | "deny" | "allowOnce">("allow");

	const hasAllowOnce = typeof onAllowOnce === "function";

	// Icon based on type
	const getIcon = () => {
		switch (type) {
			case "tool": return "⚙";
			case "write": return "📝";
			case "dangerous": return "⚠";
			case "network": return "🌐";
			default: return "▶";
		}
	};

	// Color based on type
	const getColor = () => {
		switch (type) {
			case "dangerous": return "#F87171";
			case "network": return "#60A5FA";
			case "write": return "#FBBF24";
			default: return theme.colors.primary;
		}
	};

	const accentColor = getColor();

	// Keyboard navigation
	useInput((input, key) => {
		if (key.upArrow || input === "k") {
			setSelected((prev) => {
				if (prev === "allowOnce") return "allow";
				if (prev === "allow") return "deny";
				return "deny";
			});
		} else if (key.downArrow || input === "j") {
			setSelected((prev) => {
				if (prev === "deny") return hasAllowOnce ? "allowOnce" : "allow";
				if (prev === "allow") return hasAllowOnce ? "allowOnce" : "deny";
				return "allow";
			});
		} else if (key.return) {
			if (selected === "allow") onAllow();
			else if (selected === "allowOnce" && hasAllowOnce) onAllowOnce();
			else onDeny();
		} else if (key.escape) {
			onDeny();
		}
	});

	// Options to display
	const options = [
		{ key: "allow" as const, label: "Allow", description: "Always allow this action" },
		...(hasAllowOnce ? [{ key: "allowOnce" as const, label: "Allow Once", description: "Allow this time only" }] : []),
		{ key: "deny" as const, label: "Deny", description: "Block this action" },
	];

	return (
		<Box flexDirection="column" borderStyle="round" borderColor={accentColor} paddingX={2} paddingY={1}>
			{/* Header */}
			<Box flexDirection="row" alignItems="center" marginBottom={1}>
				<Text bold color={accentColor}>{getIcon()}</Text>
				<Text color={theme.colors.textMuted}> </Text>
				<Text bold color={theme.colors.text}>{title}</Text>
			</Box>

			{/* Message */}
			<Text color={theme.colors.text}>{message}</Text>

			{/* Details */}
			{details && (
				<Box marginTop={1}>
					<Text dimColor color={theme.colors.textMuted}>{details}</Text>
				</Box>
			)}

			{/* Preview (for file writes) */}
			{preview && (
				<Box flexDirection="column" marginTop={1} paddingLeft={1} borderStyle="single" borderColor={theme.colors.borderDim}>
					<Text dimColor color={theme.colors.textMuted}>Preview:</Text>
					<Text color={theme.colors.textDim}>{preview.slice(0, 200)}</Text>
					{preview.length > 200 && (
						<Text dimColor color={theme.colors.textMuted}>... (truncated)</Text>
					)}
				</Box>
			)}

			{/* Options */}
			<Box flexDirection="column" marginTop={2}>
				{options.map((opt) => (
					<Box key={opt.key} flexDirection="row" alignItems="center">
						<Text
							color={selected === opt.key ? theme.colors.text : theme.colors.textMuted}
							inverse={selected === opt.key}
							bold={selected === opt.key}
						>
							{selected === opt.key ? "▸" : " "}
						</Text>
						<Text color={theme.colors.textMuted}> </Text>
						<Text bold={selected === opt.key} color={selected === opt.key ? theme.colors.text : theme.colors.textMuted}>
							{opt.label}
						</Text>
						<Text color={theme.colors.textMuted}> - </Text>
						<Text color={theme.colors.textMuted}>{opt.description}</Text>
					</Box>
				))}
			</Box>

			{/* Help text */}
			<Box marginTop={1}>
				<Text dimColor color={theme.colors.textMuted}>
					[↑↓ select, Enter confirm, Esc cancel]
				</Text>
			</Box>
		</Box>
	);
};

// Permission request queue manager
export class PermissionManager {
	private queue: PermissionDialogProps[] = [];
	private current: PermissionDialogProps | null = null;
	private onRequest: ((permission: PermissionDialogProps) => void) | null = null;

	constructor(onRequest: (permission: PermissionDialogProps) => void) {
		this.onRequest = onRequest;
	}

	add(permission: PermissionDialogProps) {
		this.queue.push(permission);
		this.process();
	}

	private process() {
		if (this.current || this.queue.length === 0) return;
		this.current = this.queue.shift()!;
		this.onRequest?.(this.current);
	}

	resolve(allowed: boolean, allowOnce: boolean = false) {
		const permission = this.current;
		if (!permission) return;

		if (allowed || allowOnce) {
			permission.onAllow();
		} else {
			permission.onDeny();
		}

		this.current = null;
		this.process();
	}
}

export default PermissionDialog;