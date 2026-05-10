/**
 * Terminal interface and implementations
 * Axiom TUI
 */
import * as readline from "node:readline";
import * as process from "node:process";
/**
 * Process-based terminal - uses stdin/stdout
 */
export class ProcessTerminal {
    rl;
    _columns = 80;
    _rows = 24;
    onInputCallback;
    onResizeCallback;
    start(onInput, onResize) {
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
        process.stdin.on("data", (data) => {
            const str = data.toString("utf-8");
            onInput(str);
        });
        // Handle resize
        process.on("resize", () => {
            this.updateSize();
            onResize();
        });
    }
    stop() {
        this.rl?.close();
        process.stdin.setRawMode(false);
    }
    write(data) {
        process.stdout.write(data);
    }
    get columns() {
        return this._columns;
    }
    get rows() {
        return this._rows;
    }
    moveBy(lines) {
        if (lines > 0) {
            this.write(`\x1b[${lines}B`);
        }
        else if (lines < 0) {
            this.write(`\x1b[${Math.abs(lines)}A`);
        }
    }
    hideCursor() {
        this.write("\x1b[?25l");
    }
    showCursor() {
        this.write("\x1b[?25h");
    }
    clearLine() {
        this.write("\x1b[2K");
    }
    clearFromCursor() {
        this.write("\x1b[J");
    }
    clearScreen() {
        this.write("\x1b[2J\x1b[H");
    }
    updateSize() {
        this._columns = process.stdout.columns || 80;
        this._rows = process.stdout.rows || 24;
    }
}
//# sourceMappingURL=terminal.js.map