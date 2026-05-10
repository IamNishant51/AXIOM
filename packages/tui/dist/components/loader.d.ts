/**
 * Loader Component - Animated loading spinner
 * Axiom TUI
 */
import type { Component, TUI } from "../tui.js";
/**
 * Loader component - animated spinner with message
 */
export declare class Loader implements Component {
    private message;
    private spinnerColor;
    private messageColor;
    private frame;
    private interval?;
    private tui?;
    constructor(tui: TUI, spinnerColor?: (str: string) => string, messageColor?: (str: string) => string, message?: string);
    /**
     * Start the loader animation
     */
    start(): void;
    /**
     * Stop the loader
     */
    stop(): void;
    /**
     * Set message
     */
    setMessage(message: string): void;
    invalidate(): void;
    render(width: number): string[];
}
/**
 * Cancellable loader with Escape key handling
 */
export declare class CancellableLoader extends Loader {
    private _aborted;
    private abortSignal?;
    constructor(tui: TUI, spinnerColor: (str: string) => string, messageColor: (str: string) => string, message: string);
    /**
     * Get abort signal
     */
    get signal(): AbortSignal;
    /**
     * Check if aborted
     */
    get aborted(): boolean;
    /**
     * Abort callback
     */
    onAbort?: () => void;
    /**
     * Handle input - listen for Escape
     */
    handleInput(data: string): void;
    invalidate(): void;
}
//# sourceMappingURL=loader.d.ts.map