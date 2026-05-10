/**
 * SelectList Component - Interactive selection list
 * Axiom TUI
 */

import type { Component } from "../tui.js";
import { matchesKey, Key } from "../keys.js";
import { truncateToWidth, visibleWidth } from "../utils.js";

/**
 * Select item
 */
export interface SelectItem {
	value: string;
	label: string;
	description?: string;
}

/**
 * Select list theme
 */
export interface SelectListTheme {
	selectedPrefix: (text: string) => string;
	selectedText: (text: string) => string;
	description: (text: string) => string;
	scrollInfo: (text: string) => string;
	noMatch: (text: string) => string;
}

/**
 * Select list layout options
 */
export interface SelectListLayoutOptions {
	maxWidth?: number;
	align?: "left" | "center" | "right";
}

/**
 * Truncate primary context
 */
export interface SelectListTruncatePrimaryContext {
	text: string;
	width: number;
}

/**
 * Select list component - interactive list for selection
 */
export class SelectList implements Component {
	private items: SelectItem[];
	private maxVisible: number;
	private theme: SelectListTheme;
	private selectedIndex = 0;
	private filter = "";

	public onSelect?: (item: SelectItem) => void;
	public onCancel?: () => void;
	public onSelectionChange?: (item: SelectItem) => void;

	constructor(items: SelectItem[], maxVisible: number = 10, theme: SelectListTheme) {
		this.items = items;
		this.maxVisible = maxVisible;
		this.theme = theme;
	}

	/**
	 * Set filter
	 */
	setFilter(filter: string): void {
		this.filter = filter.toLowerCase();
		this.selectedIndex = 0;
	}

	invalidate(): void {
		// Nothing to invalidate
	}

	render(width: number): string[] {
		// Filter items
		const filteredItems = this.filter
			? this.items.filter((item) => item.label.toLowerCase().includes(this.filter) || item.value.toLowerCase().includes(this.filter))
			: this.items;

		if (filteredItems.length === 0) {
			return [this.theme.noMatch("No matches")];
		}

		// Clamp selected index
		this.selectedIndex = Math.min(filteredItems.length - 1, Math.max(0, this.selectedIndex));

		const lines: string[] = [];
		const effectiveWidth = width - 2; // Leave space for borders

		// Top border
		lines.push("┌" + "─".repeat(effectiveWidth) + "┐");

		// Calculate visible range
		let startIdx = 0;
		if (filteredItems.length > this.maxVisible) {
			startIdx = Math.max(0, this.selectedIndex - Math.floor(this.maxVisible / 2));
			startIdx = Math.min(filteredItems.length - this.maxVisible, startIdx);
		}

		// Render visible items
		for (let i = 0; i < this.maxVisible && startIdx + i < filteredItems.length; i++) {
			const item = filteredItems[startIdx + i];
			const isSelected = startIdx + i === this.selectedIndex;

			const prefix = isSelected ? this.theme.selectedPrefix("▶ ") : "  ";
			const label = truncateToWidth(item.label, effectiveWidth - 2);

			let line = prefix + label;

			// Add description
			if (item.description && isSelected) {
				const desc = truncateToWidth(item.description, effectiveWidth - 4);
				line += "\n  " + this.theme.description(desc);
			}

			// Pad to width
			const visibleLen = visibleWidth(line);
			if (visibleLen < effectiveWidth) {
				line += " ".repeat(effectiveWidth - visibleLen);
			}

			const selectedText = isSelected ? this.theme.selectedText(line) : line;
			lines.push("│" + selectedText + "│");
		}

		// Bottom border
		lines.push("└" + "─".repeat(effectiveWidth) + "┘");

		// Scroll info
		if (filteredItems.length > this.maxVisible) {
			const scrollInfo = `${startIdx + 1}-${Math.min(startIdx + this.maxVisible, filteredItems.length)} of ${filteredItems.length}`;
			lines.push(this.theme.scrollInfo(scrollInfo));
		}

		// Notify selection change
		if (filteredItems[this.selectedIndex]) {
			this.onSelectionChange?.(filteredItems[this.selectedIndex]);
		}

		return lines;
	}

	handleInput(data: string): void {
		// Filter items first
		const filteredItems = this.filter
			? this.items.filter((item) => item.label.toLowerCase().includes(this.filter) || item.value.toLowerCase().includes(this.filter))
			: this.items;

		if (matchesKey(data, Key.up)) {
			this.selectedIndex = Math.max(0, this.selectedIndex - 1);
			return;
		}

		if (matchesKey(data, Key.down)) {
			this.selectedIndex = Math.min(filteredItems.length - 1, this.selectedIndex + 1);
			return;
		}

		if (matchesKey(data, Key.enter)) {
			if (filteredItems[this.selectedIndex]) {
				this.onSelect?.(filteredItems[this.selectedIndex]);
			}
			return;
		}

		if (matchesKey(data, Key.escape)) {
			this.onCancel?.();
			return;
		}
	}
}