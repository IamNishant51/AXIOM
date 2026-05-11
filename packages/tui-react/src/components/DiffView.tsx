/**
 * DiffView Component - Code change display
 * Shows additions/deletions with proper styling like Claude Code
 */

import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";

export interface DiffLine {
	type: "added" | "removed" | "unchanged" | "header";
	content: string;
	lineNumber?: number;
}

export interface DiffChange {
	type: "added" | "removed" | "unchanged";
	content: string;
	lineNumber?: number;
}

export interface DiffViewProps {
	diff: string | DiffLine[];
	mode?: "inline" | "unified";
	showLineNumbers?: boolean;
	collapsible?: boolean;
	maxHeight?: number;
}

// Parse unified diff format
function parseDiff(diffText: string): DiffLine[] {
	const lines = diffText.split("\n");
	const result: DiffLine[] = [];
	let lineNumber = 0;

	for (const line of lines) {
		if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) {
			result.push({
				type: "header",
				content: line,
				lineNumber: ++lineNumber,
			});
		} else if (line.startsWith("+")) {
			result.push({
				type: "added",
				content: line.slice(1),
				lineNumber: ++lineNumber,
			});
		} else if (line.startsWith("-")) {
			result.push({
				type: "removed",
				content: line.slice(1),
				lineNumber: ++lineNumber,
			});
		} else if (line.trim()) {
			result.push({
				type: "unchanged",
				content: line,
				lineNumber: ++lineNumber,
			});
		}
	}

	return result;
}

export const DiffView: React.FC<DiffViewProps> = ({
	diff,
	mode = "unified",
	showLineNumbers = true,
	collapsible = true,
	maxHeight = 30,
}) => {
	const theme = useTheme();
	const [isExpanded, setIsExpanded] = useState(!collapsible);
	const [selectedLine, setSelectedLine] = useState<number>(-1);

	// Parse diff if it's a string
	const diffLines: DiffLine[] = typeof diff === "string" ? parseDiff(diff) : diff;

	// Count additions and deletions
	const additions = diffLines.filter((l) => l.type === "added").length;
	const deletions = diffLines.filter((l) => l.type === "removed").length;

	// Truncate if too long
	const displayLines = isExpanded
		? diffLines
		: diffLines.slice(0, maxHeight);
	const isTruncated = diffLines.length > maxHeight;

	return (
		<Box flexDirection="column" marginY={1}>
			{/* Diff header with stats */}
			<Box flexDirection="row" alignItems="center">
				<Text color={theme.colors.primary}>
					{isExpanded ? "▼" : "▶"}
				</Text>
				{collapsible && (
					<Text color={theme.colors.textMuted} dimColor>
						[click to {isExpanded ? "collapse" : "expand"}]
					</Text>
				)}
				<Text color={theme.colors.textMuted}> </Text>
				<Text bold color={theme.colors.textDim}>
					Diff
				</Text>
				<Text color={theme.colors.textMuted}> </Text>
				<Text color="#4ADE80">+{additions}</Text>
				<Text color={theme.colors.textMuted}> </Text>
				<Text color="#F87171">-{deletions}</Text>
				{isTruncated && !isExpanded && (
					<Text color={theme.colors.textMuted}>
						{" "}({diffLines.length} lines, click to expand)
					</Text>
				)}
			</Box>

			{/* Diff content */}
			{isExpanded && (
				<Box
					flexDirection="column"
					paddingLeft={2}
					marginTop={1}
					borderStyle="round"
					borderColor={theme.colors.borderDim}
				>
					{displayLines.map((line, index) => {
						// Header lines
						if (line.type === "header") {
							return (
								<Text key={index} color={theme.colors.primary} bold>
									{line.content}
								</Text>
							);
						}

						// Added lines - green
						if (line.type === "added") {
							return (
								<Box key={index} flexDirection="row">
									{showLineNumbers && (
										<Text dimColor color="#4ADE80">
											{String(line.lineNumber || "").padStart(3, " ")}{" "}
										</Text>
									)}
									<Text color="#4ADE80">+ </Text>
									<Text color="#4ADE80">{line.content || " "}</Text>
								</Box>
							);
						}

						// Removed lines - red
						if (line.type === "removed") {
							return (
								<Box key={index} flexDirection="row">
									{showLineNumbers && (
										<Text dimColor color="#F87171">
											{String(line.lineNumber || "").padStart(3, " ")}{" "}
										</Text>
									)}
									<Text color="#F87171">- </Text>
									<Text color="#F87171">{line.content || " "}</Text>
								</Box>
							);
						}

						// Unchanged lines
						return (
							<Box key={index} flexDirection="row">
								{showLineNumbers && (
									<Text dimColor color={theme.colors.textMuted}>
										{String(line.lineNumber || "").padStart(3, " ")}{" "}
									</Text>
								)}
								<Text color={theme.colors.textDim}>  </Text>
								<Text color={theme.colors.textDim}>
									{line.content || " "}
								</Text>
							</Box>
						);
					})}
				</Box>
			)}
		</Box>
	);
};

// Simple diff from old/new content
export const createSimpleDiff = (oldContent: string, newContent: string): DiffLine[] => {
	const oldLines = oldContent.split("\n");
	const newLines = newContent.split("\n");

	const result: DiffLine[] = [];
	let lineNumber = 1;

	// Simple line-by-line comparison
	const maxLen = Math.max(oldLines.length, newLines.length);

	for (let i = 0; i < maxLen; i++) {
		const oldLine = oldLines[i];
		const newLine = newLines[i];

		if (oldLine === newLine) {
			result.push({
				type: "unchanged",
				content: newLine || "",
				lineNumber: lineNumber++,
			});
		} else {
			if (oldLine !== undefined) {
				result.push({
					type: "removed",
					content: oldLine,
					lineNumber: lineNumber++,
				});
			}
			if (newLine !== undefined) {
				result.push({
					type: "added",
					content: newLine,
					lineNumber: lineNumber++,
				});
			}
		}
	}

	return result;
};

export default DiffView;