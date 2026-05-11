/**
 * CopyButton - Copy code to clipboard button component
 * Terminal-friendly copy functionality
 */

import React, { memo, useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";
import { copyToClipboard, isClipboardAvailable } from "../utils/clipboard.js";

export interface CopyButtonProps {
	text: string;
	language?: string;
	onCopy?: (success: boolean) => void;
}

/**
 * CopyButton - Simple copy button for terminal
 */
export const CopyButton: React.FC<CopyButtonProps> = memo(({
	text,
	language,
	onCopy,
}) => {
	const theme = useTheme();
	const [copied, setCopied] = useState(false);
	const [clipboardAvailable] = useState(isClipboardAvailable());

	const handleCopy = useCallback(async () => {
		if (!clipboardAvailable) {
			onCopy?.(false);
			return;
		}

		const result = await copyToClipboard(text);
		setCopied(result.success);
		onCopy?.(result.success);

		// Reset after 2 seconds
		setTimeout(() => setCopied(false), 2000);
	}, [text, clipboardAvailable, onCopy]);

	// Handle keyboard shortcut (C key to copy)
	useInput((input) => {
		if (input === "c" || input === "C") {
			handleCopy();
		}
	});

	// Don't show if clipboard not available or text is empty
	if (!clipboardAvailable || !text.trim()) {
		return null;
	}

	return (
		<Box>
			<Box
				paddingX={1}
				paddingY={0}
				borderStyle="round"
				borderColor={copied ? theme.colors.success : theme.colors.border}
			>
				<Text
					color={copied ? theme.colors.success : theme.colors.textMuted}
					bold={copied}
				>
					{copied ? "✓ Copied" : "📋 Copy [C]"}
				</Text>
			</Box>
		</Box>
	);
});

CopyButton.displayName = "CopyButton";

/**
 * CopyButtonRow - Row with language label and copy button
 */
export const CopyButtonRow: React.FC<{
	language?: string;
	code: string;
	showLineNumbers?: boolean;
}> = memo(({ language, code, showLineNumbers = false }) => {
	const theme = useTheme();
	const lines = code.split("\n");

	return (
		<Box flexDirection="column">
			{/* Header with language and copy button */}
			<Box flexDirection="row" justifyContent="space-between" alignItems="center">
				{language && (
					<Text dimColor color={theme.colors.primary}>
						{language}
					</Text>
				)}
				<CopyButton text={code} language={language} />
			</Box>

			{/* Code lines */}
			<Box flexDirection="column" paddingLeft={2}>
				{lines.slice(0, 20).map((line, i) => (
					<Box key={i} flexDirection="row">
						{showLineNumbers && (
							<Text dimColor color={theme.colors.textMuted}>
								{`${(i + 1).toString().padStart(3, " ")} `}
							</Text>
						)}
						<Text color={theme.colors.accent}>{line}</Text>
					</Box>
				))}
				{lines.length > 20 && (
					<Text dimColor color={theme.colors.textMuted}>
						... and {lines.length - 20} more lines
					</Text>
				)}
			</Box>
		</Box>
	);
});

CopyButtonRow.displayName = "CopyButtonRow";

export default CopyButton;