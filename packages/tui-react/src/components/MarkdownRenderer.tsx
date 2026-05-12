/**
 * MarkdownRenderer - Enhanced markdown rendering for Claude Code style
 * Full GFM support including tables, code blocks, task lists
 */

import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";

interface MarkdownProps {
	content: string;
	style?: "default" | "compact" | "code";
}

// Cache for parsed markdown
const markdownCache = new Map<string, React.ReactNode[]>();
const MAX_CACHE_SIZE = 100;

// Table cell data
interface TableCell {
	content: string;
	alignment: "left" | "center" | "right";
}

// ANSI color codes for terminal
const COLORS = {
	primary: "#60A5FA",
	secondary: "#A78BFA",
	accent: "#34D399",
	text: "#F5F5F5",
	textMuted: "#525252",
	border: "#404040",
	borderDim: "#262626",
	header: "#60A5FA",
};

/**
 * Parse a markdown table
 */
function parseTable(tableLines: string[], theme: any): React.ReactNode {
	// Parse header row
	const headerCells = tableLines[0].split("|").filter(cell => cell.trim());
	const headerContent = headerCells.map(cell => cell.trim());

	// Parse alignment from second row (separator)
	const separatorCells = tableLines[1].split("|").filter(cell => cell.trim());
	const alignments = separatorCells.map(cell => {
		const trimmed = cell.trim();
		if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
		if (trimmed.endsWith(":")) return "right";
		return "left";
	});

	// Parse data rows
	const dataRows: string[][] = [];
	for (let i = 2; i < tableLines.length; i++) {
		const cells = tableLines[i].split("|").filter(cell => cell.trim());
		dataRows.push(cells.map(cell => cell.trim()));
	}

	// Calculate column widths
	const colWidths = headerContent.map((header, colIndex) => {
		let maxWidth = header.length;
		for (const row of dataRows) {
			if (row[colIndex]) {
				maxWidth = Math.max(maxWidth, row[colIndex].length);
			}
		}
		return maxWidth + 2; // padding
	});

	// Format cell content
	const formatCell = (content: string, width: number, alignment: "left" | "center" | "right"): string => {
		const padding = width - content.length;
		if (padding <= 0) return content;

		switch (alignment) {
			case "center":
				return " ".repeat(Math.floor(padding / 2)) + content + " ".repeat(Math.ceil(padding / 2));
			case "right":
				return " ".repeat(padding) + content;
			default:
				return content + " ".repeat(padding);
		}
	};

	// Create table elements
	const tableElements: React.ReactNode[] = [];

	// Header row with border
	const headerRow = headerContent.map((header, i) => formatCell(header, colWidths[i], alignments[i])).join(" │ ");
	tableElements.push(
		<Text key="header" color={COLORS.header} bold>
			┌─{colWidths.map(w => "─".repeat(w)).join("─┬─")}─┐{"\n"}
			│ {headerRow} │{"\n"}
			├─{colWidths.map(w => "─".repeat(w)).join("─┼─")}─┤
		</Text>
	);

	// Data rows
	dataRows.forEach((row, rowIndex) => {
		const formattedRow = row.map((cell, colIndex) => {
			const alignment = alignments[colIndex] || "left";
			const width = colWidths[colIndex] || cell.length + 2;
			return formatCell(cell || "", width, alignment);
		}).join(" │ ");

		tableElements.push(
			<Text key={`row-${rowIndex}`} color={COLORS.text}>
				│ {formattedRow} │
			</Text>
		);
	});

	// Bottom border
	tableElements.push(
		<Text key="footer" color={COLORS.border}>
			└─{colWidths.map(w => "─".repeat(w)).join("─┴─")}─┘
		</Text>
	);

	return (
		<Box flexDirection="column" marginY={1}>
			{tableElements.map((el, i) => (
				<React.Fragment key={i}>{el}</React.Fragment>
			))}
		</Box>
	);
}

/**
 * Parse inline markdown formatting
 */
function parseInline(text: string): React.ReactNode {
	const parts: React.ReactNode[] = [];
	let remaining = text;
	let keyIndex = 0;

	while (remaining.length > 0) {
		// Bold (**text**) - must check before single *
		const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
		if (boldMatch && (boldMatch.index ?? 0) === 0) {
			parts.push(<Text key={keyIndex++} bold>{boldMatch[1]}</Text>);
			remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
			continue;
		}

		// Italic (*text* or _text_)
		const italicMatch = remaining.match(/\*([^*]+)\*/);
		const italicMatchAlt = remaining.match(/_([^_]+)_/);
		const italic = italicMatch && (!italicMatchAlt || (italicMatch.index ?? 0) < (italicMatchAlt.index ?? Infinity))
			? italicMatch
			: italicMatchAlt;
		if (italic && (italic.index ?? 0) === 0) {
			parts.push(<Text key={keyIndex++} italic>{italic[1]}</Text>);
			remaining = remaining.slice(italic.index! + italic[0].length);
			continue;
		}

		// Inline code (must check before other patterns)
		const codeMatch = remaining.match(/`([^`]+)`/);
		if (codeMatch && (codeMatch.index ?? 0) === 0) {
			parts.push(
				<Text key={keyIndex++} color={COLORS.accent}>
					{codeMatch[1]}
				</Text>
			);
			remaining = remaining.slice(codeMatch.index! + codeMatch[0].length);
			continue;
		}

		// Strikethrough
		const strikeMatch = remaining.match(/~~([^~]+)~~/);
		if (strikeMatch && (strikeMatch.index ?? 0) === 0) {
			parts.push(
				<Text key={keyIndex++} dimColor strikethrough>
					{strikeMatch[1]}
				</Text>
			);
			remaining = remaining.slice(strikeMatch.index! + strikeMatch[0].length);
			continue;
		}

		// Link
		const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
		if (linkMatch && (linkMatch.index ?? 0) === 0) {
			parts.push(
				<Text key={keyIndex++} color={COLORS.primary} underline>
					{linkMatch[1]}
				</Text>
			);
			remaining = remaining.slice(linkMatch.index! + linkMatch[0].length);
			continue;
		}

		// No match - take one character
		parts.push(<Text key={keyIndex++}>{remaining[0]}</Text>);
		remaining = remaining.slice(1);
	}

	return <>{parts}</>;
}

/**
 * Parse code block with syntax highlighting hints
 */
function parseCodeBlock(lines: string[], language: string, startIndex: number): { element: React.ReactNode; endIndex: number } {
	const codeLines: string[] = [];
	let endIndex = startIndex;

	while (endIndex < lines.length && !lines[endIndex].startsWith("```")) {
		codeLines.push(lines[endIndex]);
		endIndex++;
	}

	// Simple syntax highlighting for common languages
	const highlightCode = (line: string, lang: string): React.ReactNode => {
		if (lang === "bash" || lang === "sh" || lang === "shell") {
			return highlightShell(line);
		}
		if (lang === "javascript" || lang === "js" || lang === "typescript" || lang === "ts") {
			return highlightJS(line);
		}
		if (lang === "json") {
			return highlightJSON(line);
		}
		if (lang === "python" || lang === "py") {
			return highlightPython(line);
		}
		// Default: plain green
		return <Text key={0} color={COLORS.accent}>{line}</Text>;
	};

	const codeElements = codeLines.map((line, idx) => (
		<Box key={idx} flexDirection="row">
			<Text dimColor color={COLORS.borderDim}>{String(idx + 1).padStart(3, " ")}  </Text>
			{highlightCode(line, language)}
		</Box>
	));

	return {
		element: (
			<Box flexDirection="column" marginY={1} paddingLeft={2}>
				{language && (
					<Text dimColor color={COLORS.primary}>
						{language.toLowerCase()}
					</Text>
				)}
				<Box flexDirection="column" borderStyle="round" borderColor={COLORS.border}>
					<Box flexDirection="column" paddingX={1} paddingY={0}>
						{codeElements}
					</Box>
				</Box>
			</Box>
		),
		endIndex,
	};
}

/**
 * Simple shell syntax highlighting
 */
function highlightShell(line: string): React.ReactNode {
	const parts: React.ReactNode[] = [];
	let remaining = line;
	let keyIndex = 0;

	// Common shell patterns
	const patterns = [
		{ regex: /^(export|echo|cd|ls|git|npm|pnpm|yarn|node|python)/, color: COLORS.primary },
		{ regex: /^-/, color: COLORS.secondary },
		{ regex: /["'][^"']*["'](?:\s+[^"']*)*/, color: COLORS.accent },
		{ regex: /\$[A-Z_][A-Z0-9_]*/, color: COLORS.secondary },
	];

	let offset = 0;
	while (remaining.length > 0) {
		let matched = false;

		for (const { regex, color } of patterns) {
			const match = remaining.match(regex);
			if (match && match.index === 0) {
				parts.push(<Text key={keyIndex++} color={color}>{match[0]}</Text>);
				remaining = remaining.slice(match[0].length);
				matched = true;
				break;
			}
		}

		if (!matched) {
			// Take one character
			const char = remaining[0];
			const color = /[|;&`]/.test(char) ? COLORS.secondary : COLORS.accent;
			parts.push(<Text key={keyIndex++} color={color}>{char}</Text>);
			remaining = remaining.slice(1);
		}
	}

	return <>{parts}</>;
}

/**
 * Simple JS/TS syntax highlighting
 */
function highlightJS(line: string): React.ReactNode {
	const parts: React.ReactNode[] = [];
	let remaining = line;
	let keyIndex = 0;

	// Keywords
	const keywords = /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|new|async|await|try|catch|throw|typeof|instanceof)\b/;
	// Strings
	const strings = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/;
	// Comments
	const comment = /\/\/.*/;
	// Numbers
	const numbers = /\b\d+\.?\d*\b/;

	while (remaining.length > 0) {
		// Comment
		const commentMatch = remaining.match(/^(\/\/.*)/);
		if (commentMatch) {
			parts.push(<Text key={keyIndex++} dimColor color={COLORS.textMuted}>{commentMatch[1]}</Text>);
			remaining = remaining.slice(commentMatch[0].length);
			continue;
		}

		// String
		const stringMatch = remaining.match(/^(["'`][^"'`]*["'`])/);
		if (stringMatch) {
			parts.push(<Text key={keyIndex++} color="#FBBF24">{stringMatch[1]}</Text>);
			remaining = remaining.slice(stringMatch[0].length);
			continue;
		}

		// Keyword
		const keywordMatch = remaining.match(new RegExp(`^${keywords.source}`));
		if (keywordMatch) {
			parts.push(<Text key={keyIndex++} color={COLORS.secondary}>{keywordMatch[0]}</Text>);
			remaining = remaining.slice(keywordMatch[0].length);
			continue;
		}

		// Number
		const numberMatch = remaining.match(/^\d+\.?\d*/);
		if (numberMatch) {
			parts.push(<Text key={keyIndex++} color="#FBBF24">{numberMatch[0]}</Text>);
			remaining = remaining.slice(numberMatch[0].length);
			continue;
		}

		// Function call
		const funcMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\(/);
		if (funcMatch) {
			parts.push(<Text key={keyIndex++} color={COLORS.accent}>{funcMatch[1]}</Text>);
			remaining = remaining.slice(funcMatch[1].length);
			continue;
		}

		// Take one character
		parts.push(<Text key={keyIndex++} color={COLORS.accent}>{remaining[0]}</Text>);
		remaining = remaining.slice(1);
	}

	return <>{parts}</>;
}

/**
 * Simple JSON syntax highlighting
 */
function highlightJSON(line: string): React.ReactNode {
	return highlightJS(line);
}

/**
 * Simple Python syntax highlighting
 */
function highlightPython(line: string): React.ReactNode {
	const parts: React.ReactNode[] = [];
	let remaining = line;
	let keyIndex = 0;

	while (remaining.length > 0) {
		// Comment
		const commentMatch = remaining.match(/^(#.*)/);
		if (commentMatch) {
			parts.push(<Text key={keyIndex++} dimColor color={COLORS.textMuted}>{commentMatch[1]}</Text>);
			remaining = remaining.slice(commentMatch[0].length);
			continue;
		}

		// String
		const stringMatch = remaining.match(/^(["'](?:[^"'\\]|\\.)*["']|"""[\s\S]*?""")/);
		if (stringMatch) {
			parts.push(<Text key={keyIndex++} color="#FBBF24">{stringMatch[1]}</Text>);
			remaining = remaining.slice(stringMatch[0].length);
			continue;
		}

		// Keyword
		const pyKeywords = /\b(def|class|import|from|return|if|elif|else|for|while|try|except|finally|with|as|lambda|and|or|not|in|is|True|False|None|self|print)\b/;
		const keywordMatch = remaining.match(new RegExp(`^${pyKeywords.source}`));
		if (keywordMatch) {
			parts.push(<Text key={keyIndex++} color={COLORS.secondary}>{keywordMatch[0]}</Text>);
			remaining = remaining.slice(keywordMatch[0].length);
			continue;
		}

		// Number
		const numberMatch = remaining.match(/^\d+\.?\d*/);
		if (numberMatch) {
			parts.push(<Text key={keyIndex++} color="#FBBF24">{numberMatch[0]}</Text>);
			remaining = remaining.slice(numberMatch[0].length);
			continue;
		}

		// Take one character
		parts.push(<Text key={keyIndex++} color={COLORS.accent}>{remaining[0]}</Text>);
		remaining = remaining.slice(1);
	}

	return <>{parts}</>;
}

/**
 * Parse and render markdown content
 */
function parseMarkdown(content: string, theme: any): React.ReactNode[] {
	const lines = content.split("\n");
	const elements: React.ReactNode[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		// Code block
		if (line.startsWith("```")) {
			const language = line.slice(3).trim();
			const { element, endIndex } = parseCodeBlock(lines, language, i + 1);
			elements.push(element);
			i = endIndex + 1;
			continue;
		}

		// Table
		if (line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("---")) {
			const tableLines: string[] = [];
			while (i < lines.length && lines[i].includes("|")) {
				tableLines.push(lines[i]);
				i++;
			}
			elements.push(parseTable(tableLines, theme));
			continue;
		}

		// Heading
		const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			const headingColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.text, COLORS.textMuted, COLORS.textMuted];
			const sizes = [22, 18, 16, 14, 12, 10];
			elements.push(
				<Text key={i} bold color={headingColors[level - 1]}>
					{headingMatch[2]}
				</Text>
			);
			i++;
			continue;
		}

		// Horizontal rule
		if (line.match(/^[-*_]{3,}$/)) {
			elements.push(
				<Text key={i} dimColor color={COLORS.borderDim}>
					{"─".repeat(50)}
				</Text>
			);
			i++;
			continue;
		}

		// Task list
		const taskMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.+)$/);
		if (taskMatch) {
			const checked = taskMatch[2].toLowerCase() === "x";
			elements.push(
				<Box key={i} flexDirection="row" alignItems="center">
					<Text color={checked ? "#4ADE80" : COLORS.textMuted}>
						[{checked ? "✓" : " "}]
					</Text>
					<Text color={checked ? COLORS.textMuted : COLORS.text}> </Text>
					<Text color={checked ? COLORS.textMuted : COLORS.text} strikethrough={checked}>
						{parseInline(taskMatch[3])}
					</Text>
				</Box>
			);
			i++;
			continue;
		}

		// Unordered list
		const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
		if (ulMatch) {
			const indent = Math.floor(ulMatch[1].length / 2);
			elements.push(
				<Box key={i} flexDirection="row" paddingLeft={indent + 1}>
					<Text color={COLORS.secondary}>• </Text>
					<Text color={COLORS.text}>{parseInline(ulMatch[2])}</Text>
				</Box>
			);
			i++;
			continue;
		}

		// Ordered list
		const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
		if (olMatch) {
			const indent = Math.floor(olMatch[1].length / 2);
			elements.push(
				<Box key={i} flexDirection="row" paddingLeft={indent + 1}>
					<Text color={COLORS.secondary}>{olMatch[0].match(/^\d+/)?.[0]}. </Text>
					<Text color={COLORS.text}>{parseInline(olMatch[2])}</Text>
				</Box>
			);
			i++;
			continue;
		}

		// Blockquote
		if (line.startsWith("> ")) {
			const quotes: string[] = [];
			while (i < lines.length && lines[i].startsWith("> ")) {
				quotes.push(lines[i].slice(2));
				i++;
			}
			elements.push(
				<Box key={i} flexDirection="column" paddingLeft={1} borderStyle="classic" borderColor={COLORS.border}>
					{quotes.map((q, idx) => (
						<Text key={idx} color={COLORS.textMuted} italic dimColor>
							{q}
						</Text>
					))}
				</Box>
			);
			continue;
		}

		// Empty line
		if (!line.trim()) {
			elements.push(<Box key={i} height={1} />);
			i++;
			continue;
		}

		// Regular text with inline formatting
		elements.push(
			<Text key={i} color={COLORS.text}>
				{parseInline(line)}
			</Text>
		);
		i++;
	}

	return elements;
}

/**
 * Main MarkdownRenderer component
 */
export const MarkdownRenderer: React.FC<MarkdownProps> = ({ content, style = "default" }) => {
	const theme = useTheme();

	// Memoize parsing
	const elements = useMemo(() => {
		if (markdownCache.has(content)) {
			return markdownCache.get(content)!;
		}

		const parsed = parseMarkdown(content, theme);

		if (markdownCache.size >= MAX_CACHE_SIZE) {
			const firstKey = markdownCache.keys().next().value;
			if (firstKey) markdownCache.delete(firstKey);
		}
		markdownCache.set(content, parsed);

		return parsed;
	}, [content, theme]);

	if (style === "code") {
		return (
			<Box flexDirection="column" borderStyle="round" borderColor={COLORS.border}>
				{content.split("\n").map((line, i) => (
					<Text key={i} color={COLORS.accent}>{line}</Text>
				))}
			</Box>
		);
	}

	return <Box flexDirection="column">{elements}</Box>;
};

export default MarkdownRenderer;