/**
 * MarkdownRenderer - Enhanced markdown rendering for Claude Code style
 * Full GFM support including tables, code blocks, task lists
 */
import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";
// Cache for parsed markdown
const markdownCache = new Map();
const MAX_CACHE_SIZE = 100;
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
function parseTable(tableLines, theme) {
    // Parse header row
    const headerCells = tableLines[0].split("|").filter(cell => cell.trim());
    const headerContent = headerCells.map(cell => cell.trim());
    // Parse alignment from second row (separator)
    const separatorCells = tableLines[1].split("|").filter(cell => cell.trim());
    const alignments = separatorCells.map(cell => {
        const trimmed = cell.trim();
        if (trimmed.startsWith(":") && trimmed.endsWith(":"))
            return "center";
        if (trimmed.endsWith(":"))
            return "right";
        return "left";
    });
    // Parse data rows
    const dataRows = [];
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
    const formatCell = (content, width, alignment) => {
        const padding = width - content.length;
        if (padding <= 0)
            return content;
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
    const tableElements = [];
    // Header row with border
    const headerRow = headerContent.map((header, i) => formatCell(header, colWidths[i], alignments[i])).join(" │ ");
    tableElements.push(React.createElement(Text, { key: "header", color: COLORS.header, bold: true },
        "\u250C\u2500",
        colWidths.map(w => "─".repeat(w)).join("─┬─"),
        "\u2500\u2510",
        "\n",
        "\u2502 ",
        headerRow,
        " \u2502",
        "\n",
        "\u251C\u2500",
        colWidths.map(w => "─".repeat(w)).join("─┼─"),
        "\u2500\u2524"));
    // Data rows
    dataRows.forEach((row, rowIndex) => {
        const formattedRow = row.map((cell, colIndex) => {
            const alignment = alignments[colIndex] || "left";
            const width = colWidths[colIndex] || cell.length + 2;
            return formatCell(cell || "", width, alignment);
        }).join(" │ ");
        tableElements.push(React.createElement(Text, { key: `row-${rowIndex}`, color: COLORS.text },
            "\u2502 ",
            formattedRow,
            " \u2502"));
    });
    // Bottom border
    tableElements.push(React.createElement(Text, { key: "footer", color: COLORS.border },
        "\u2514\u2500",
        colWidths.map(w => "─".repeat(w)).join("─┴─"),
        "\u2500\u2518"));
    return (React.createElement(Box, { flexDirection: "column", marginY: 1 }, tableElements.map((el, i) => (React.createElement(React.Fragment, { key: i }, el)))));
}
/**
 * Parse inline markdown formatting
 */
function parseInline(text) {
    const parts = [];
    let remaining = text;
    let keyIndex = 0;
    while (remaining.length > 0) {
        // Inline code (must check before bold to handle `**` etc)
        const codeMatch = remaining.match(/`([^`]+)`/);
        if (codeMatch && (codeMatch.index ?? 0) === 0) {
            parts.push(React.createElement(Text, { key: keyIndex++, color: COLORS.accent }, codeMatch[1]));
            remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
            continue;
        }
        // Bold (**text** or __text__)
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
        const boldMatchAlt = remaining.match(/__([^_]+)__/);
        const bold = boldMatch && (!boldMatchAlt || (boldMatch.index ?? 0) < (boldMatchAlt.index ?? Infinity))
            ? boldMatch
            : boldMatchAlt;
        if (bold && (bold.index ?? 0) === 0) {
            parts.push(React.createElement(Text, { key: keyIndex++, bold: true }, bold[1]));
            remaining = remaining.slice(bold.index + bold[0].length);
            continue;
        }
        // Italic (*text* or _text_)
        const italicMatch = remaining.match(/\*([^*]+)\*/);
        const italicMatchAlt = remaining.match(/_([^_]+)_/);
        const italic = italicMatch && (!italicMatchAlt || (italicMatch.index ?? 0) < (italicMatchAlt.index ?? Infinity))
            ? italicMatch
            : italicMatchAlt;
        if (italic && (italic.index ?? 0) === 0) {
            parts.push(React.createElement(Text, { key: keyIndex++, italic: true }, italic[1]));
            remaining = remaining.slice(italic.index + italic[0].length);
            continue;
        }
        // Strikethrough
        const strikeMatch = remaining.match(/~~([^~]+)~~/);
        if (strikeMatch && (strikeMatch.index ?? 0) === 0) {
            parts.push(React.createElement(Text, { key: keyIndex++, color: COLORS.textMuted, strikethrough: true }, strikeMatch[1]));
            remaining = remaining.slice(strikeMatch.index + strikeMatch[0].length);
            continue;
        }
        // Link
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch && (linkMatch.index ?? 0) === 0) {
            parts.push(React.createElement(Text, { key: keyIndex++, color: COLORS.primary, underline: true }, linkMatch[1]));
            remaining = remaining.slice(linkMatch.index + linkMatch[0].length);
            continue;
        }
        // No match - take one character
        parts.push(React.createElement(Text, { key: keyIndex++ }, remaining[0]));
        remaining = remaining.slice(1);
    }
    return React.createElement(React.Fragment, null, parts);
}
/**
 * Parse code block with syntax highlighting hints
 */
function parseCodeBlock(lines, language, startIndex) {
    const codeLines = [];
    let endIndex = startIndex;
    while (endIndex < lines.length && !lines[endIndex].startsWith("```")) {
        codeLines.push(lines[endIndex]);
        endIndex++;
    }
    // Simple syntax highlighting for common languages
    const highlightCode = (line, lang) => {
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
        return React.createElement(Text, { key: 0, color: COLORS.accent }, line);
    };
    const codeElements = codeLines.map((line, idx) => (React.createElement(Box, { key: idx, flexDirection: "row" },
        React.createElement(Text, { dimColor: true, color: COLORS.borderDim },
            String(idx + 1).padStart(3, " "),
            "  "),
        highlightCode(line, language))));
    return {
        element: (React.createElement(Box, { flexDirection: "column", marginY: 1, paddingLeft: 2 },
            language && (React.createElement(Text, { dimColor: true, color: COLORS.primary }, language.toLowerCase())),
            React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: COLORS.border },
                React.createElement(Box, { flexDirection: "column", paddingX: 1, paddingY: 0 }, codeElements)))),
        endIndex,
    };
}
/**
 * Simple shell syntax highlighting
 */
function highlightShell(line) {
    const parts = [];
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
                parts.push(React.createElement(Text, { key: keyIndex++, color: color }, match[0]));
                remaining = remaining.slice(match[0].length);
                matched = true;
                break;
            }
        }
        if (!matched) {
            // Take one character
            const char = remaining[0];
            const color = /[|;&`]/.test(char) ? COLORS.secondary : COLORS.accent;
            parts.push(React.createElement(Text, { key: keyIndex++, color: color }, char));
            remaining = remaining.slice(1);
        }
    }
    return React.createElement(React.Fragment, null, parts);
}
/**
 * Simple JS/TS syntax highlighting
 */
function highlightJS(line) {
    const parts = [];
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
            parts.push(React.createElement(Text, { key: keyIndex++, dimColor: true, color: COLORS.textMuted }, commentMatch[1]));
            remaining = remaining.slice(commentMatch[0].length);
            continue;
        }
        // String
        const stringMatch = remaining.match(/^(["'`][^"'`]*["'`])/);
        if (stringMatch) {
            parts.push(React.createElement(Text, { key: keyIndex++, color: "#FBBF24" }, stringMatch[1]));
            remaining = remaining.slice(stringMatch[0].length);
            continue;
        }
        // Keyword
        const keywordMatch = remaining.match(new RegExp(`^${keywords.source}`));
        if (keywordMatch) {
            parts.push(React.createElement(Text, { key: keyIndex++, color: COLORS.secondary }, keywordMatch[0]));
            remaining = remaining.slice(keywordMatch[0].length);
            continue;
        }
        // Number
        const numberMatch = remaining.match(/^\d+\.?\d*/);
        if (numberMatch) {
            parts.push(React.createElement(Text, { key: keyIndex++, color: "#FBBF24" }, numberMatch[0]));
            remaining = remaining.slice(numberMatch[0].length);
            continue;
        }
        // Function call
        const funcMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\(/);
        if (funcMatch) {
            parts.push(React.createElement(Text, { key: keyIndex++, color: COLORS.accent }, funcMatch[1]));
            remaining = remaining.slice(funcMatch[1].length);
            continue;
        }
        // Take one character
        parts.push(React.createElement(Text, { key: keyIndex++, color: COLORS.accent }, remaining[0]));
        remaining = remaining.slice(1);
    }
    return React.createElement(React.Fragment, null, parts);
}
/**
 * Simple JSON syntax highlighting
 */
function highlightJSON(line) {
    return highlightJS(line);
}
/**
 * Simple Python syntax highlighting
 */
function highlightPython(line) {
    const parts = [];
    let remaining = line;
    let keyIndex = 0;
    while (remaining.length > 0) {
        // Comment
        const commentMatch = remaining.match(/^(#.*)/);
        if (commentMatch) {
            parts.push(React.createElement(Text, { key: keyIndex++, dimColor: true, color: COLORS.textMuted }, commentMatch[1]));
            remaining = remaining.slice(commentMatch[0].length);
            continue;
        }
        // String
        const stringMatch = remaining.match(/^(["'](?:[^"'\\]|\\.)*["']|"""[\s\S]*?""")/);
        if (stringMatch) {
            parts.push(React.createElement(Text, { key: keyIndex++, color: "#FBBF24" }, stringMatch[1]));
            remaining = remaining.slice(stringMatch[0].length);
            continue;
        }
        // Keyword
        const pyKeywords = /\b(def|class|import|from|return|if|elif|else|for|while|try|except|finally|with|as|lambda|and|or|not|in|is|True|False|None|self|print)\b/;
        const keywordMatch = remaining.match(new RegExp(`^${pyKeywords.source}`));
        if (keywordMatch) {
            parts.push(React.createElement(Text, { key: keyIndex++, color: COLORS.secondary }, keywordMatch[0]));
            remaining = remaining.slice(keywordMatch[0].length);
            continue;
        }
        // Number
        const numberMatch = remaining.match(/^\d+\.?\d*/);
        if (numberMatch) {
            parts.push(React.createElement(Text, { key: keyIndex++, color: "#FBBF24" }, numberMatch[0]));
            remaining = remaining.slice(numberMatch[0].length);
            continue;
        }
        // Take one character
        parts.push(React.createElement(Text, { key: keyIndex++, color: COLORS.accent }, remaining[0]));
        remaining = remaining.slice(1);
    }
    return React.createElement(React.Fragment, null, parts);
}
/**
 * Parse and render markdown content
 */
function parseMarkdown(content, theme) {
    const lines = content.split("\n");
    const elements = [];
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
            const tableLines = [];
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
            elements.push(React.createElement(Text, { key: i, bold: true, color: headingColors[level - 1] }, headingMatch[2]));
            i++;
            continue;
        }
        // Horizontal rule
        if (line.match(/^[-*_]{3,}$/)) {
            elements.push(React.createElement(Text, { key: i, dimColor: true, color: COLORS.borderDim }, "─".repeat(50)));
            i++;
            continue;
        }
        // Task list
        const taskMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (taskMatch) {
            const checked = taskMatch[2].toLowerCase() === "x";
            elements.push(React.createElement(Box, { key: i, flexDirection: "row", alignItems: "center" },
                React.createElement(Text, { color: checked ? "#4ADE80" : COLORS.textMuted },
                    "[",
                    checked ? "✓" : " ",
                    "]"),
                React.createElement(Text, { color: checked ? COLORS.textMuted : COLORS.text }, " "),
                React.createElement(Text, { color: checked ? COLORS.textMuted : COLORS.text, strikethrough: checked }, parseInline(taskMatch[3]))));
            i++;
            continue;
        }
        // Unordered list
        const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
        if (ulMatch) {
            const indent = Math.floor(ulMatch[1].length / 2);
            elements.push(React.createElement(Box, { key: i, flexDirection: "row", paddingLeft: indent + 1 },
                React.createElement(Text, { color: COLORS.secondary }, "\u2022 "),
                React.createElement(Text, { color: COLORS.text }, parseInline(ulMatch[2]))));
            i++;
            continue;
        }
        // Ordered list
        const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
        if (olMatch) {
            const indent = Math.floor(olMatch[1].length / 2);
            elements.push(React.createElement(Box, { key: i, flexDirection: "row", paddingLeft: indent + 1 },
                React.createElement(Text, { color: COLORS.secondary },
                    olMatch[0].match(/^\d+/)?.[0],
                    ". "),
                React.createElement(Text, { color: COLORS.text }, parseInline(olMatch[2]))));
            i++;
            continue;
        }
        // Blockquote
        if (line.startsWith("> ")) {
            const quotes = [];
            while (i < lines.length && lines[i].startsWith("> ")) {
                quotes.push(lines[i].slice(2));
                i++;
            }
            elements.push(React.createElement(Box, { key: i, flexDirection: "column", paddingLeft: 1, borderStyle: "classic", borderColor: COLORS.border }, quotes.map((q, idx) => (React.createElement(Text, { key: idx, color: COLORS.textMuted, italic: true, dimColor: true }, q)))));
            continue;
        }
        // Empty line
        if (!line.trim()) {
            elements.push(React.createElement(Box, { key: i, height: 1 }));
            i++;
            continue;
        }
        // Regular text with inline formatting
        elements.push(React.createElement(Text, { key: i, color: COLORS.text }, parseInline(line)));
        i++;
    }
    return elements;
}
/**
 * Main MarkdownRenderer component
 */
export const MarkdownRenderer = ({ content, style = "default" }) => {
    const theme = useTheme();
    // Memoize parsing
    const elements = useMemo(() => {
        if (markdownCache.has(content)) {
            return markdownCache.get(content);
        }
        const parsed = parseMarkdown(content, theme);
        if (markdownCache.size >= MAX_CACHE_SIZE) {
            const firstKey = markdownCache.keys().next().value;
            if (firstKey)
                markdownCache.delete(firstKey);
        }
        markdownCache.set(content, parsed);
        return parsed;
    }, [content, theme]);
    if (style === "code") {
        return (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: COLORS.border }, content.split("\n").map((line, i) => (React.createElement(Text, { key: i, color: COLORS.accent }, line)))));
    }
    return React.createElement(Box, { flexDirection: "column" }, elements);
};
export default MarkdownRenderer;
