/**
 * Terminal interface and implementations
 * Axiom TUI
 */

import * as readline from "node:readline";
import * as process from "node:process";

/**
 * Terminal interface - abstracts terminal operations
 */
export interface Terminal {
	start(onInput: (data: string) => void, onResize: () => void): void;
	stop(): void;
	write(data: string): void;
	get columns(): number;
	get rows(): number;
	moveBy(lines: number): void;
	hideCursor(): void;
	showCursor(): void;
	clearLine(): void;
	clearFromCursor(): void;
	clearScreen(): void;
}

/**
 * Process-based terminal - uses stdin/stdout
 */
export class ProcessTerminal implements Terminal {
	private rl?: readline.Interface;
	private _columns = 80;
	private _rows = 24;
	private onInputCallback?: (data: string) => void;
	private onResizeCallback?: () => void;

	start(onInput: (data: string) => void, onResize: () => void): void {
		this.onInputCallback = onInput;
		this.onResizeCallback = onResize;

		// Get initial terminal size
		this.updateSize();

		// Set up readline
		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: true,
			crlfDelay: Infinity,
		});

		// Enable raw mode-like behavior
		process.stdin.setRawMode(true);

		// Handle input
		process.stdin.on("data", (data: Buffer) => {
			const str = data.toString("utf-8");
			onInput(str);
		});

		// Handle resize
		process.on("resize", () => {
			this.updateSize();
			onResize();
		});
	}

	stop(): void {
		this.rl?.close();
		process.stdin.setRawMode(false);
	}

	write(data: string): void {
		process.stdout.write(data);
	}

	get columns(): number {
		return this._columns;
	}

	get rows(): number {
		return this._rows;
	}

	moveBy(lines: number): void {
		if (lines > 0) {
			this.write(`\x1b[${lines}B`);
		} else if (lines < 0) {
			this.write(`\x1b[${Math.abs(lines)}A`);
		}
	}

	hideCursor(): void {
		this.write("\x1b[?25l");
	}

	showCursor(): void {
		this.write("\x1b[?25h");
	}

	clearLine(): void {
		this.write("\x1b[2K");
	}

	clearFromCursor(): void {
		this.write("\x1b[J");
	}

	clearScreen(): void {
		this.write("\x1b[2J\x1b[H");
	}

	private updateSize(): void {
		this._columns = process.stdout.columns || 80;
		this._rows = process.stdout.rows || 24;
	}
}