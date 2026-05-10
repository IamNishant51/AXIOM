/**
 * Loader Component - Animated loading spinner
 * Axiom TUI
 */

import type { Component, TUI } from "../tui.js";
import { matchesKey, Key } from "../keys.js";

/**
 * Loader component - animated spinner with message
 */
export class Loader implements Component {
	private message: string;
	private spinnerColor: (str: string) => string;
	private messageColor: (str: string) => string;
	private frame = 0;
	private interval?: NodeJS.Timeout;
	private tui?: TUI;

	constructor(
		tui: TUI,
		spinnerColor: (str: string) => string = (s) => s,
		messageColor: (str: string) => string = (s) => s,
		message: string = "Loading...",
	) {
		this.tui = tui;
		this.spinnerColor = spinnerColor;
		this.messageColor = messageColor;
		this.message = message;
	}

	/**
	 * Start the loader animation
	 */
	start(): void {
		this.frame = 0;
		this.interval = setInterval(() => {
			this.frame++;
			this.tui?.requestRender();
		}, 100);
	}

	/**
	 * Stop the loader
	 */
	stop(): void {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}

	/**
	 * Set message
	 */
	setMessage(message: string): void {
		this.message = message;
	}

	invalidate(): void {
		// Nothing to invalidate
	}

	render(width: number): string[] {
		const spinners = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
		const spinner = spinners[this.frame % spinners.length];
		const spinnerStr = this.spinnerColor(spinner);
		const messageStr = this.messageColor(this.message);

		// Center the loader
		const content = `${spinnerStr} ${messageStr}`;
		const padding = Math.max(0, Math.floor((width - content.length) / 2));
		return [" ".repeat(padding) + content];
	}
}

/**
 * Cancellable loader with Escape key handling
 */
export class CancellableLoader extends Loader {
	private _aborted = false;
	private abortSignal?: AbortSignal;

	constructor(
		tui: TUI,
		spinnerColor: (str: string) => string,
		messageColor: (str: string) => string,
		message: string,
	) {
		super(tui, spinnerColor, messageColor, message);
	}

	/**
	 * Get abort signal
	 */
	get signal(): AbortSignal {
		if (!this.abortSignal) {
			this.abortSignal = new AbortController().signal;
		}
		return this.abortSignal;
	}

	/**
	 * Check if aborted
	 */
	get aborted(): boolean {
		return this._aborted;
	}

	/**
	 * Abort callback
	 */
	onAbort?: () => void;

	/**
	 * Handle input - listen for Escape
	 */
	handleInput(data: string): void {
		if (matchesKey(data, Key.escape)) {
			this._aborted = true;
			if (this.abortSignal && "abort" in this.abortSignal) {
				(this.abortSignal as any).abort();
			}
			this.onAbort?.();
			this.stop();
		}
	}

	invalidate(): void {
		// Nothing
	}
}