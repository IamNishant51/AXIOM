/**
 * Loader Component - Animated loading spinner
 * Axiom TUI
 */
import { matchesKey, Key } from "../keys.js";
/**
 * Loader component - animated spinner with message
 */
export class Loader {
    message;
    spinnerColor;
    messageColor;
    frame = 0;
    interval;
    tui;
    constructor(tui, spinnerColor = (s) => s, messageColor = (s) => s, message = "Loading...") {
        this.tui = tui;
        this.spinnerColor = spinnerColor;
        this.messageColor = messageColor;
        this.message = message;
    }
    /**
     * Start the loader animation
     */
    start() {
        this.frame = 0;
        this.interval = setInterval(() => {
            this.frame++;
            this.tui?.requestRender();
        }, 100);
    }
    /**
     * Stop the loader
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }
    /**
     * Set message
     */
    setMessage(message) {
        this.message = message;
    }
    invalidate() {
        // Nothing to invalidate
    }
    render(width) {
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
    _aborted = false;
    abortSignal;
    constructor(tui, spinnerColor, messageColor, message) {
        super(tui, spinnerColor, messageColor, message);
    }
    /**
     * Get abort signal
     */
    get signal() {
        if (!this.abortSignal) {
            this.abortSignal = new AbortController().signal;
        }
        return this.abortSignal;
    }
    /**
     * Check if aborted
     */
    get aborted() {
        return this._aborted;
    }
    /**
     * Abort callback
     */
    onAbort;
    /**
     * Handle input - listen for Escape
     */
    handleInput(data) {
        if (matchesKey(data, Key.escape)) {
            this._aborted = true;
            if (this.abortSignal && "abort" in this.abortSignal) {
                this.abortSignal.abort();
            }
            this.onAbort?.();
            this.stop();
        }
    }
    invalidate() {
        // Nothing
    }
}
//# sourceMappingURL=loader.js.map