/**
 * Box Component - Container with padding and optional background
 * Axiom TUI
 */

import type { Component } from "../tui.js";

/**
 * Box component - applies padding and background to children
 */
export class Box implements Component {
	private paddingX: number;
	private paddingY: number;
	private backgroundFn?: (text: string) => string;
	private children: Component[] = [];

	constructor(paddingX: number = 1, paddingY: number = 1, backgroundFn?: (text: string) => string) {
		this.paddingX = paddingX;
		this.paddingY = paddingY;
		this.backgroundFn = backgroundFn;
	}

	/**
	 * Add child component
	 */
	addChild(component: Component): void {
		this.children.push(component);
	}

	/**
	 * Remove child component
	 */
	removeChild(component: Component): void {
		const index = this.children.indexOf(component);
		if (index !== -1) {
			this.children.splice(index, 1);
		}
	}

	/**
	 * Set background function
	 */
	setBgFn(fn: (text: string) => string): void {
		this.backgroundFn = fn;
	}

	invalidate(): void {
		for (const child of this.children) {
			child.invalidate?.();
		}
	}

	render(width: number): string[] {
		const lines: string[] = [];

		// Add vertical padding
		for (let i = 0; i < this.paddingY; i++) {
			lines.push(" ".repeat(width));
		}

		// Render children with horizontal padding
		for (const child of this.children) {
			const childLines = child.render(width - this.paddingX * 2);
			for (const line of childLines) {
				const paddedLine = " ".repeat(this.paddingX) + line + " ".repeat(this.paddingX);
				const finalLine = this.backgroundFn ? this.backgroundFn(paddedLine) : paddedLine;
				lines.push(finalLine);
			}
		}

		// Add vertical padding at bottom
		for (let i = 0; i < this.paddingY; i++) {
			lines.push(" ".repeat(width));
		}

		return lines;
	}
}