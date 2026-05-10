/**
 * Terminal interface and implementations
 * Axiom TUI
 */
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
export declare class ProcessTerminal implements Terminal {
    private rl?;
    private _columns;
    private _rows;
    private onInputCallback?;
    private onResizeCallback?;
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
    private updateSize;
}
//# sourceMappingURL=terminal.d.ts.map