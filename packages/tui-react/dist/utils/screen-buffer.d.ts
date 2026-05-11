/**
 * Screen Buffer - Virtual terminal screen management
 * Provides efficient cell-based rendering with diffing
 */
export interface Cell {
    char: string;
    foreground: string;
    background: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    blink: boolean;
    inverse: boolean;
}
export interface Position {
    x: number;
    y: number;
}
export interface Cursor {
    position: Position;
    visible: boolean;
    color: string;
    blink: boolean;
}
export interface ScreenRegion {
    start: Position;
    end: Position;
}
export interface DiffResult {
    cells: Map<string, Cell>;
    scrollLines: number;
    cursorMoved: boolean;
    newCursorPosition: Position;
}
/**
 * Create empty cell
 */
export declare function createEmptyCell(): Cell;
/**
 * Compare two cells
 */
export declare function cellsEqual(a: Cell, b: Cell): boolean;
/**
 * Screen Buffer - Manages terminal screen state
 */
export declare class ScreenBuffer {
    private width;
    private height;
    private cells;
    private cursor;
    private cursorMoved;
    private dirty;
    private dirtyRegion;
    constructor(width?: number, height?: number);
    /**
     * Create empty screen
     */
    private createEmptyScreen;
    /**
     * Resize screen
     */
    resize(width: number, height: number): void;
    /**
     * Mark screen as dirty (needs redraw)
     */
    markDirty(): void;
    /**
     * Mark specific region as dirty
     */
    markDirtyRegion(start: Position, end: Position): void;
    /**
     * Check if screen is dirty
     */
    isDirty(): boolean;
    /**
     * Get dirty region
     */
    getDirtyRegion(): ScreenRegion | null;
    /**
     * Clear dirty flag
     */
    clearDirty(): void;
    /**
     * Set cell at position
     */
    setCell(x: number, y: number, cell: Cell): void;
    /**
     * Get cell at position
     */
    getCell(x: number, y: number): Cell | null;
    /**
     * Write string at position
     */
    writeString(x: number, y: number, str: string, style?: Partial<Cell>): void;
    /**
     * Move cursor
     */
    moveCursor(x: number, y: number): void;
    /**
     * Get cursor
     */
    getCursor(): Cursor;
    /**
     * Show/hide cursor
     */
    setCursorVisible(visible: boolean): void;
    /**
     * Clear screen
     */
    clear(): void;
    /**
     * Scroll screen up by n lines
     */
    scrollUp(lines?: number): void;
    /**
     * Get line at y
     */
    getLine(y: number): Cell[];
    /**
     * Compare with another buffer and return diff
     */
    diff(other: ScreenBuffer): DiffResult;
    /**
     * Generate ANSI output for changed region
     */
    toAnsiString(region?: ScreenRegion): string;
    /**
     * Full render to string
     */
    toString(): string;
}
/**
 * Screen Pool - Manages multiple screen buffers
 */
export declare class ScreenPool {
    private pool;
    private maxSize;
    constructor(maxSize?: number);
    /**
     * Get or create buffer
     */
    acquire(width?: number, height?: number): ScreenBuffer;
    /**
     * Release buffer back to pool
     */
    release(buffer: ScreenBuffer): void;
    /**
     * Clear pool
     */
    clear(): void;
}
/**
 * Scrollback Buffer - Stores screen history
 */
export declare class ScrollbackBuffer {
    private lines;
    private maxLines;
    constructor(maxLines?: number);
    /**
     * Add line to history
     */
    push(line: string): void;
    /**
     * Add multiple lines
     */
    pushLines(lines: string[]): void;
    /**
     * Get line at index
     */
    getLine(index: number): string | null;
    /**
     * Get last n lines
     */
    getLastLines(count: number): string[];
    /**
     * Get total lines
     */
    get length(): number;
    /**
     * Clear buffer
     */
    clear(): void;
    /**
     * Search lines
     */
    search(pattern: RegExp): {
        index: number;
        line: string;
    }[];
}
//# sourceMappingURL=screen-buffer.d.ts.map