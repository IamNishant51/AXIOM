/**
 * Spacer Component - Empty lines for vertical spacing
 * Axiom TUI
 */

import type { Component } from "../tui.js";

/**
 * Spacer component - adds empty vertical space
 */
export class Spacer implements Component {
	constructor(private lines: number = 1) {}

	/**
	 * Set number of lines
	 */
	setLines(lines: number): void {
		this.lines = lines;
	}

	invalidate(): void {
		// Nothing to invalidate
	}

	render(width: number): string[] {
		return Array(this.lines).fill(" ".repeat(width));
	}
}