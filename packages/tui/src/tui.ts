/**
 * Core TUI - Terminal User Interface with differential rendering
 * Axiom TUI
 */

import { performance } from "node:perf_hooks";
import type { Terminal } from "./terminal.js";
import { visibleWidth, sliceWithWidth } from "./utils.js";

/**
 * Component interface
 */
export interface Component {
	render(width: number): string[];
	handleInput?(data: string): void;
	wantsKeyRelease?: boolean;
	invalidate(): void;
}

/**
 * Interface for components that can receive focus
 */
export interface Focusable {
	focused: boolean;
}

/**
 * Cursor position marker
 */
export const CURSOR_MARKER = "\x1b_pi:c\x07";

/**
 * Check if component is focusable
 */
export function isFocusable(component: Component | null): component is Component & { focused: boolean } {
	return component !== null && "focused" in component;
}

/**
 * Overlay anchor positions
 */
export type OverlayAnchor =
	| "center"
	| "top-left"
	| "top-right"
	| "bottom-left"
	| "bottom-right"
	| "top-center"
	| "bottom-center"
	| "left-center"
	| "right-center";

/**
 * Overlay margin
 */
export interface OverlayMargin {
	top?: number;
	right?: number;
	bottom?: number;
	left?: number;
}

/**
 * Size value - absolute or percentage
 */
export type SizeValue = number | `${number}%`;

/**
 * Parse size value
 */
function parseSizeValue(value: SizeValue | undefined, referenceSize: number): number | undefined {
	if (value === undefined) return undefined;
	if (typeof value === "number") return value;
	const match = value.match(/^(\d+(?:\.\d+)?)%$/);
	if (match) {
		return Math.floor((referenceSize * parseFloat(match[1])) / 100);
	}
	return undefined;
}

/**
 * Overlay options
 */
export interface OverlayOptions {
	width?: SizeValue;
	minWidth?: number;
	maxHeight?: SizeValue;
	anchor?: OverlayAnchor;
	offsetX?: number;
	offsetY?: number;
	row?: SizeValue;
	col?: SizeValue;
	margin?: OverlayMargin | number;
	visible?: (termWidth: number, termHeight: number) => boolean;
	nonCapturing?: boolean;
}

/**
 * Overlay handle
 */
export interface OverlayHandle {
	hide(): void;
	setHidden(hidden: boolean): void;
	isHidden(): boolean;
	focus(): void;
	unfocus(): void;
	isFocused(): boolean;
}

/**
 * Container - component that contains other components
 */
export class Container implements Component {
	children: Component[] = [];

	addChild(component: Component): void {
		this.children.push(component);
	}

	removeChild(component: Component): void {
		const index = this.children.indexOf(component);
		if (index !== -1) {
			this.children.splice(index, 1);
		}
	}

	clear(): void {
		this.children = [];
	}

	invalidate(): void {
		for (const child of this.children) {
			child.invalidate?.();
		}
	}

	render(width: number): string[] {
		const lines: string[] = [];
		for (const child of this.children) {
			lines.push(...child.render(width));
		}
		return lines;
	}
}

/**
 * Main TUI class
 */
export class TUI {
	private children: Component[] = [];
	private focusIndex = -1;
	private overlayStack: Array<{ component: Component; handle: OverlayHandle; options: OverlayOptions }> = [];
	private lastRendered: string[] = [];
	private running = false;
	private frameCallback?: () => void;

	constructor(private terminal: Terminal) {}

	/**
	 * Add a child component
	 */
	addChild(component: Component): void {
		this.children.push(component);
		this.requestRender();
	}

	/**
	 * Remove a child component
	 */
	removeChild(component: Component): void {
		const index = this.children.indexOf(component);
		if (index !== -1) {
			this.children.splice(index, 1);
			this.requestRender();
		}
	}

	/**
	 * Start the TUI
	 */
	start(): void {
		this.running = true;
		this.terminal.start(
			(data) => this.handleInput(data),
			() => this.handleResize(),
		);
		this.terminal.hideCursor();
		this.render();
	}

	/**
	 * Stop the TUI
	 */
	stop(): void {
		this.running = false;
		this.terminal.showCursor();
		this.terminal.stop();
	}

	/**
	 * Request a re-render
	 */
	requestRender(): void {
		if (!this.running) return;
		this.render();
	}

	/**
	 * Show an overlay
	 */
	showOverlay(component: Component, options: OverlayOptions = {}): OverlayHandle {
		const handle: OverlayHandle = {
			hide: () => this.hideOverlay(),
			setHidden: (hidden: boolean) => {
				// Implementation
			},
			isHidden: () => false,
			focus: () => {
				// Focus the overlay
			},
			unfocus: () => {
				// Unfocus
			},
			isFocused: () => this.overlayStack.length > 0,
		};

		this.overlayStack.push({ component, handle, options });
		this.requestRender();

		return handle;
	}

	/**
	 * Hide topmost overlay
	 */
	hideOverlay(): void {
		if (this.overlayStack.length > 0) {
			this.overlayStack.pop();
			this.requestRender();
		}
	}

	/**
	 * Check if overlay is active
	 */
	hasOverlay(): boolean {
		return this.overlayStack.length > 0;
	}

	/**
	 * Debug callback
	 */
	onDebug?: () => void;

	/**
	 * Handle input
	 */
	private handleInput(data: string): void {
		// Check overlays first
		if (this.overlayStack.length > 0) {
			const overlay = this.overlayStack[this.overlayStack.length - 1];
			const focusedComponent = overlay.component;
			if (focusedComponent.handleInput) {
				focusedComponent.handleInput(data);
				return;
			}
		}

		// Check focused child
		if (this.focusIndex >= 0 && this.focusIndex < this.children.length) {
			const child = this.children[this.focusIndex];
			if (child.handleInput) {
				child.handleInput(data);
				return;
			}
		}

		// Default: pass to last child if it handles input
		if (this.children.length > 0) {
			const lastChild = this.children[this.children.length - 1];
			if (lastChild.handleInput) {
				lastChild.handleInput(data);
			}
		}
	}

	/**
	 * Handle resize
	 */
	private handleResize(): void {
		this.render();
	}

	/**
	 * Render the UI
	 */
	private render(): void {
		const width = this.terminal.columns;
		const height = this.terminal.rows;

		// Build render tree
		const renderTree = this.buildRenderTree();

		// Render all components
		const newLines: string[] = [];
		for (const node of renderTree) {
			const lines = node.component.render(node.width);
			newLines.push(...lines);
		}

		// Differential render
		this.diffRender(this.lastRendered, newLines);
		this.lastRendered = newLines;
	}

	/**
	 * Build render tree with positions
	 */
	private buildRenderTree(): Array<{ component: Component; width: number }> {
		return this.children.map((child) => ({
			component: child,
			width: this.terminal.columns,
		}));
	}

	/**
	 * Differential rendering
	 */
	private diffRender(oldLines: string[], newLines: string[]): void {
		// First render or size change - full render
		if (oldLines.length === 0 || this.terminal.columns !== this.terminal.columns) {
			this.fullRender(newLines);
			return;
		}

		// Simple diff - find first change and render from there
		let firstChange = -1;
		for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
			if (oldLines[i] !== newLines[i]) {
				firstChange = i;
				break;
			}
		}

		if (firstChange === -1) {
			// No changes
			return;
		}

		// Clear from first change to end
		this.terminal.write("\x1b[" + firstChange + ";1H");
		this.terminal.clearFromCursor();

		// Render new lines from first change
		for (let i = firstChange; i < newLines.length; i++) {
			this.terminal.write("\x1b[" + (i + 1) + ";1H");
			this.terminal.clearLine();
			this.terminal.write(newLines[i] + "\r\n");
		}

		// Clear any remaining old lines
		if (newLines.length < oldLines.length) {
			for (let i = newLines.length; i < oldLines.length; i++) {
				this.terminal.write("\x1b[" + (i + 1) + ";1H");
				this.terminal.clearLine();
			}
		}
	}

	/**
	 * Full render
	 */
	private fullRender(lines: string[]): void {
		this.terminal.clearScreen();
		this.terminal.write(lines.join("\r\n"));
	}
}

/**
 * Export utilities
 */
export { visibleWidth, truncateToWidth, wrapTextWithAnsi } from "./utils.js";
export type { Terminal };
export { ProcessTerminal } from "./terminal.js";