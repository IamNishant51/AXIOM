/**
 * Utility functions for TUI
 * Axiom TUI
 */

/**
 * Calculate visible width of string (ignoring ANSI codes)
 */
export function visibleWidth(str: string): number {
	// Remove ANSI escape codes
	const withoutAnsi = str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
	return withoutAnsi.length;
}

/**
 * Truncate string to specified width, preserving ANSI codes
 */
export function truncateToWidth(str: string, width: number, ellipsis: string = "..."): string {
	const vw = visibleWidth(str);
	if (vw <= width) return str;

	// Find the truncation point while respecting ANSI codes
	let result = "";
	let currentWidth = 0;
	let inEscape = false;
	let escapeBuffer = "";

	for (let i = 0; i < str.length && currentWidth < width; i++) {
		const char = str[i];

		if (char === "\x1b") {
			inEscape = true;
			escapeBuffer = char;
			continue;
		}

		if (inEscape) {
			escapeBuffer += char;
			if (char === "m" || char === "H" || char === "J" || char === "K") {
				// End of escape sequence
				result += escapeBuffer;
				inEscape = false;
				escapeBuffer = "";
			}
			continue;
		}

		currentWidth++;
		result += char;
	}

	// Add reset code before ellipsis if needed
	if (result.includes("\x1b[")) {
		result += "\x1b[0m";
	}

	// Add ellipsis
	result += ellipsis;

	// Add reset after ellipsis
	result += "\x1b[0m";

	return result;
}

/**
 * Wrap text to specified width, preserving ANSI codes
 */
export function wrapTextWithAnsi(text: string, width: number): string[] {
	const lines: string[] = [];
	let currentLine = "";
	let currentWidth = 0;

	const words = text.split(/(\s+)/);

	for (const word of words) {
		const wordWidth = visibleWidth(word);

		if (currentWidth + wordWidth > width && currentLine.length > 0) {
			lines.push(currentLine);
			currentLine = word;
			currentWidth = wordWidth;
		} else {
			currentLine += word;
			currentWidth += wordWidth;
		}
	}

	if (currentLine.length > 0) {
		lines.push(currentLine);
	}

	return lines;
}

/**
 * Extract text segments (text and escape codes)
 */
export function extractSegments(text: string): Array<{ text: string; escape?: string }> {
	const segments: Array<{ text: string; escape?: string }> = [];
	let current = "";
	let inEscape = false;
	let escapeCode = "";

	for (const char of text) {
		if (char === "\x1b") {
			if (current.length > 0) {
				segments.push({ text: current });
			}
			current = "";
			inEscape = true;
			escapeCode = char;
			continue;
		}

		if (inEscape) {
			escapeCode += char;
			if (char === "m") {
				segments.push({ text: "", escape: escapeCode });
				inEscape = false;
				escapeCode = "";
			}
			continue;
		}

		current += char;
	}

	if (current.length > 0) {
		segments.push({ text: current });
	}

	return segments;
}

/**
 * Slice text by column position
 */
export function sliceByColumn(text: string, start: number, end: number): string {
	let result = "";
	let currentColumn = 0;
	let inEscape = false;
	let escapeBuffer = "";

	for (const char of text) {
		if (char === "\x1b") {
			inEscape = true;
			escapeBuffer = char;
			continue;
		}

		if (inEscape) {
			escapeBuffer += char;
			result += char;
			if (char === "m") {
				inEscape = false;
				escapeBuffer = "";
			}
			continue;
		}

		if (currentColumn >= start && currentColumn < end) {
			result += char;
		}

		currentColumn++;
	}

	return result;
}

/**
 * Slice text by visible width
 */
export function sliceWithWidth(text: string, start: number, end: number): string {
	let result = "";
	let currentColumn = 0;
	let inEscape = false;
	let escapeBuffer = "";

	for (const char of text) {
		if (char === "\x1b") {
			inEscape = true;
			escapeBuffer = char;
			result += char;
			continue;
		}

		if (inEscape) {
			escapeBuffer += char;
			result += char;
			if (char === "m") {
				inEscape = false;
				escapeBuffer = "";
			}
			continue;
		}

		if (currentColumn >= start && currentColumn < end) {
			result += char;
		}

		if (currentColumn >= end) {
			break;
		}

		currentColumn++;
	}

	return result;
}