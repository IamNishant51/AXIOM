/**
 * Editor Component - Multi-line text editor with autocomplete
 * Axiom TUI
 */

import type { Component, Focusable } from "../tui.js";
import { matchesKey, Key } from "../keys.js";
import { visibleWidth, truncateToWidth } from "../utils.js";
import type { Terminal } from "../terminal.js";

/**
 * Editor theme
 */
export interface EditorTheme {
	borderColor: (str: string) => string;
	selectList?: SelectListTheme;
}

/**
 * Select list theme (for autocomplete)
 */
export interface SelectListTheme {
	selectedPrefix: (text: string) => string;
	selectedText: (text: string) => string;
	description: (text: string) => string;
	scrollInfo: (text: string) => string;
	noMatch: (text: string) => string;
}

/**
 * Editor options
 */
export interface EditorOptions {
	paddingX?: number;
}

/**
 * Autocomplete item
 */
export interface AutocompleteItem {
	value: string;
	label: string;
	description?: string;
}

/**
 * Autocomplete provider interface
 */
export interface AutocompleteProvider {
	getSuggestions(input: string): AutocompleteItem[];
}

/**
 * Editor component - interactive multi-line text editor
 */
export class Editor implements Component, Focusable {
	private text = "";
	private cursorX = 0;
	private cursorY = 0;
	private scrollY = 0;
	private _focused = false;
	private terminal?: Terminal;
	private theme: EditorTheme;
	private options: EditorOptions;
	private autocompleteProvider?: AutocompleteProvider;
	private showAutocomplete = false;
	private autocompleteItems: AutocompleteItem[] = [];
	private autocompleteIndex = 0;

	public onSubmit?: (text: string) => void;
	public onChange?: (text: string) => void;

	constructor(theme: EditorTheme, options: EditorOptions = {}) {
		this.theme = theme;
		this.options = options;
	}

	/**
	 * Initialize with terminal for height awareness
	 */
	setTerminal(terminal: Terminal): void {
		this.terminal = terminal;
	}

	/**
	 * Set autocomplete provider
	 */
	setAutocompleteProvider(provider: AutocompleteProvider): void {
		this.autocompleteProvider = provider;
	}

	/**
	 * Set editor content
	 */
	setValue(text: string): void {
		this.text = text;
		this.onChange?.(text);
	}

	/**
	 * Get editor content
	 */
	getValue(): string {
		return this.text;
	}

	/**
	 * Clear editor
	 */
	clear(): void {
		this.text = "";
		this.cursorX = 0;
		this.cursorY = 0;
		this.scrollY = 0;
		this.onChange?.("");
	}

	/**
	 * Enable/disable submit
	 */
	disableSubmit = false;

	invalidate(): void {
		// Nothing to invalidate for now
	}

	render(width: number): string[] {
		const lines: string[] = [];
		const paddingX = this.options.paddingX ?? 1;
		const effectiveWidth = width - paddingX * 2 - 2; // -2 for borders

		if (effectiveWidth <= 0) return [];

		// Get terminal height or default
		const maxHeight = this.terminal?.rows ? Math.min(this.terminal.rows - 5, 10) : 10;

		// Split text into lines
		const textLines = this.text.split("\n");

		// Calculate visible range
		const visibleLines: string[] = [];
		for (let i = this.scrollY; i < textLines.length && visibleLines.length < maxHeight; i++) {
			visibleLines.push(textLines[i]);
		}

		// Top border
		const borderColor = this.theme.borderColor;
		lines.push(borderColor("┌" + "─".repeat(effectiveWidth) + "┐"));

		// Content lines
		for (let i = 0; i < maxHeight; i++) {
			const lineIndex = this.scrollY + i;
			let content: string;

			if (lineIndex < textLines.length) {
				const line = textLines[lineIndex];
				const displayLine = truncateToWidth(line, effectiveWidth);

				// Add cursor if on this line
				if (this.focused && lineIndex === this.cursorY) {
					const beforeCursor = displayLine.substring(0, this.cursorX);
					const atCursor = displayLine[this.cursorX] || "";
					const afterCursor = displayLine.substring(this.cursorX + 1);
					content = beforeCursor + "\x1b[7m" + (atCursor || " ") + "\x1b[27m" + afterCursor;
				} else {
					content = displayLine;
				}
			} else {
				content = "";
			}

			// Pad to full width
			const visibleLen = visibleWidth(content);
			if (visibleLen < effectiveWidth) {
				content += " ".repeat(effectiveWidth - visibleLen);
			}

			lines.push(borderColor("│") + content + borderColor("│"));
		}

		// Bottom border
		lines.push(borderColor("└" + "─".repeat(effectiveWidth) + "┘"));

		// Autocomplete overlay
		if (this.showAutocomplete && this.autocompleteItems.length > 0) {
			const acLines = this.renderAutocomplete(effectiveWidth - 2);
			for (const acLine of acLines) {
				lines.push(acLine);
			}
		}

		return lines;
	}

	/**
	 * Render autocomplete suggestions
	 */
	private renderAutocomplete(width: number): string[] {
		const lines: string[] = [];
		const maxVisible = 5;

		lines.push("┌" + "─".repeat(width) + "┐");

		for (let i = 0; i < Math.min(this.autocompleteItems.length, maxVisible); i++) {
			const item = this.autocompleteItems[i];
			const prefix = i === this.autocompleteIndex ? "▶ " : "  ";
			const label = truncateToWidth(item.label, width - 2);
			lines.push("│" + prefix + label + " ".repeat(width - visibleWidth(prefix + label) - 1) + "│");
		}

		lines.push("└" + "─".repeat(width) + "┘");

		return lines;
	}

	handleInput(data: string): void {
		// Handle autocomplete navigation
		if (this.showAutocomplete) {
			if (matchesKey(data, Key.up)) {
				this.autocompleteIndex = Math.max(0, this.autocompleteIndex - 1);
				return;
			}
			if (matchesKey(data, Key.down)) {
				this.autocompleteIndex = Math.min(this.autocompleteItems.length - 1, this.autocompleteIndex + 1);
				return;
			}
			if (matchesKey(data, Key.enter)) {
				// Select autocomplete item
				if (this.autocompleteItems[this.autocompleteIndex]) {
					const item = this.autocompleteItems[this.autocompleteIndex];
					this.insertAutocompleteItem(item);
				}
				return;
			}
			if (matchesKey(data, Key.escape)) {
				this.showAutocomplete = false;
				return;
			}
		}

		// Handle regular input
		if (matchesKey(data, Key.enter)) {
			if (this.disableSubmit) {
				this.insertText("\n");
			} else {
				const submitText = this.text;
				this.onSubmit?.(submitText);
			}
			return;
		}

		if (matchesKey(data, Key.escape)) {
			this.showAutocomplete = false;
			return;
		}

		if (matchesKey(data, Key.backspace)) {
			this.handleBackspace();
			return;
		}

		if (matchesKey(data, Key.ctrl("a"))) {
			this.cursorX = 0;
			return;
		}

		if (matchesKey(data, Key.ctrl("e"))) {
			const lines = this.text.split("\n");
			this.cursorX = lines[this.cursorY]?.length || 0;
			return;
		}

		if (matchesKey(data, Key.ctrl("k"))) {
			this.deleteToEndOfLine();
			return;
		}

		if (matchesKey(data, Key.ctrl("w"))) {
			this.deleteWordBackward();
			return;
		}

		if (matchesKey(data, Key.left)) {
			this.cursorX = Math.max(0, this.cursorX - 1);
			return;
		}

		if (matchesKey(data, Key.right)) {
			const lines = this.text.split("\n");
			const maxX = lines[this.cursorY]?.length || 0;
			this.cursorX = Math.min(maxX, this.cursorX + 1);
			return;
		}

		if (matchesKey(data, Key.up)) {
			this.cursorY = Math.max(0, this.cursorY - 1);
			this.clampCursor();
			return;
		}

		if (matchesKey(data, Key.down)) {
			const maxY = this.text.split("\n").length - 1;
			this.cursorY = Math.min(maxY, this.cursorY + 1);
			this.clampCursor();
			return;
		}

		if (matchesKey(data, Key.tab)) {
			if (this.autocompleteProvider) {
				this.updateAutocomplete();
			}
			return;
		}

		// Regular character input
		if (data.length === 1 && !data.startsWith("\x1b")) {
			this.insertText(data);
		}
	}

	/**
	 * Insert text at cursor
	 */
	private insertText(text: string): void {
		const lines = this.text.split("\n");
		const line = lines[this.cursorY];
		const before = line.slice(0, this.cursorX);
		const after = line.slice(this.cursorX);
		lines[this.cursorY] = before + text + after;
		this.text = lines.join("\n");
		this.cursorX += text.length;
		this.onChange?.(this.text);

		// Update autocomplete
		if (this.autocompleteProvider) {
			this.updateAutocomplete();
		}
	}

	/**
	 * Handle backspace
	 */
	private handleBackspace(): void {
		if (this.cursorX > 0) {
			// Delete character before cursor
			const lines = this.text.split("\n");
			const line = lines[this.cursorY];
			lines[this.cursorY] = line.slice(0, this.cursorX - 1) + line.slice(this.cursorX);
			this.text = lines.join("\n");
			this.cursorX--;
		} else if (this.cursorY > 0) {
			// Join with previous line
			const lines = this.text.split("\n");
			const prevLineLength = lines[this.cursorY - 1].length;
			lines[this.cursorY - 1] += lines[this.cursorY];
			lines.splice(this.cursorY, 1);
			this.text = lines.join("\n");
			this.cursorY--;
			this.cursorX = prevLineLength;
		}
		this.onChange?.(this.text);

		// Update autocomplete
		if (this.autocompleteProvider) {
			this.updateAutocomplete();
		}
	}

	/**
	 * Delete to end of line
	 */
	private deleteToEndOfLine(): void {
		const lines = this.text.split("\n");
		lines[this.cursorY] = lines[this.cursorY].slice(0, this.cursorX);
		this.text = lines.join("\n");
		this.onChange?.(this.text);
	}

	/**
	 * Delete word backward
	 */
	private deleteWordBackward(): void {
		const lines = this.text.split("\n");
		let line = lines[this.cursorY];

		// Find start of word
		let endX = this.cursorX;
		while (endX > 0 && line[endX - 1] === " ") endX--;
		while (endX > 0 && line[endX - 1] !== " ") endX--;

		line = line.slice(0, endX) + line.slice(this.cursorX);
		lines[this.cursorY] = line;
		this.text = lines.join("\n");
		this.cursorX = endX;
		this.onChange?.(this.text);
	}

	/**
	 * Clamp cursor to valid position
	 */
	private clampCursor(): void {
		const lines = this.text.split("\n");
		const maxX = lines[this.cursorY]?.length || 0;
		this.cursorX = Math.min(maxX, this.cursorX);
	}

	/**
	 * Update autocomplete suggestions
	 */
	private updateAutocomplete(): void {
		if (!this.autocompleteProvider) {
			this.showAutocomplete = false;
			return;
		}

		const lines = this.text.split("\n");
		const currentLine = lines[this.cursorY];
		const beforeCursor = currentLine?.slice(0, this.cursorX) || "";

		this.autocompleteItems = this.autocompleteProvider.getSuggestions(beforeCursor);

		if (this.autocompleteItems.length > 0) {
			this.showAutocomplete = true;
			this.autocompleteIndex = 0;
		} else {
			this.showAutocomplete = false;
		}
	}

	/**
	 * Insert autocomplete item
	 */
	private insertAutocompleteItem(item: AutocompleteItem): void {
		const lines = this.text.split("\n");
		const currentLine = lines[this.cursorY];
		const beforeCursor = currentLine?.slice(0, this.cursorX) || "";

		// Find where to start replacement (from last / or space)
		let startIdx = beforeCursor.lastIndexOf("/");
		if (startIdx === -1) startIdx = beforeCursor.lastIndexOf(" ");
		if (startIdx === -1) startIdx = 0;
		else startIdx++; // Include the delimiter

		// Replace from start to cursor
		const afterCursor = currentLine?.slice(this.cursorX) || "";
		lines[this.cursorY] = beforeCursor.slice(0, startIdx) + item.value + afterCursor;
		this.text = lines.join("\n");
		this.cursorX = startIdx + item.value.length;

		this.showAutocomplete = false;
		this.onChange?.(this.text);
	}

	// Focusable interface
	get focused(): boolean {
		return this._focused;
	}

	set focused(value: boolean) {
		this._focused = value;
		if (!value) {
			this.showAutocomplete = false;
		}
	}
}