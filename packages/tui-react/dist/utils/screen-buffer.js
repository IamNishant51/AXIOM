/**
 * Screen Buffer - Virtual terminal screen management
 * Provides efficient cell-based rendering with diffing
 */
/**
 * Create empty cell
 */
export function createEmptyCell() {
    return {
        char: " ",
        foreground: "",
        background: "",
        bold: false,
        italic: false,
        underline: false,
        blink: false,
        inverse: false,
    };
}
/**
 * Compare two cells
 */
export function cellsEqual(a, b) {
    return (a.char === b.char &&
        a.foreground === b.foreground &&
        a.background === b.background &&
        a.bold === b.bold &&
        a.italic === b.italic &&
        a.underline === b.underline &&
        a.blink === b.blink &&
        a.inverse === b.inverse);
}
/**
 * Screen Buffer - Manages terminal screen state
 */
export class ScreenBuffer {
    width;
    height;
    cells;
    cursor;
    cursorMoved = false;
    dirty;
    dirtyRegion;
    constructor(width = 80, height = 24) {
        this.width = width;
        this.height = height;
        this.cells = this.createEmptyScreen();
        this.cursor = {
            position: { x: 0, y: 0 },
            visible: true,
            color: "#60A5FA",
            blink: true,
        };
        this.dirty = false;
        this.dirtyRegion = null;
    }
    /**
     * Create empty screen
     */
    createEmptyScreen() {
        const screen = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(createEmptyCell());
            }
            screen.push(row);
        }
        return screen;
    }
    /**
     * Resize screen
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.cells = this.createEmptyScreen();
        this.markDirty();
    }
    /**
     * Mark screen as dirty (needs redraw)
     */
    markDirty() {
        this.dirty = true;
        this.dirtyRegion = {
            start: { x: 0, y: 0 },
            end: { x: this.width, y: this.height },
        };
    }
    /**
     * Mark specific region as dirty
     */
    markDirtyRegion(start, end) {
        this.dirty = true;
        if (!this.dirtyRegion) {
            this.dirtyRegion = { start, end };
        }
        else {
            this.dirtyRegion.start.x = Math.min(this.dirtyRegion.start.x, start.x);
            this.dirtyRegion.start.y = Math.min(this.dirtyRegion.start.y, start.y);
            this.dirtyRegion.end.x = Math.max(this.dirtyRegion.end.x, end.x);
            this.dirtyRegion.end.y = Math.max(this.dirtyRegion.end.y, end.y);
        }
    }
    /**
     * Check if screen is dirty
     */
    isDirty() {
        return this.dirty;
    }
    /**
     * Get dirty region
     */
    getDirtyRegion() {
        return this.dirtyRegion;
    }
    /**
     * Clear dirty flag
     */
    clearDirty() {
        this.dirty = false;
        this.dirtyRegion = null;
    }
    /**
     * Set cell at position
     */
    setCell(x, y, cell) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return;
        this.cells[y][x] = cell;
        this.markDirtyRegion({ x, y }, { x: x + 1, y: y + 1 });
    }
    /**
     * Get cell at position
     */
    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return null;
        return this.cells[y][x];
    }
    /**
     * Write string at position
     */
    writeString(x, y, str, style) {
        for (let i = 0; i < str.length; i++) {
            const cell = style ? { ...createEmptyCell(), ...style } : createEmptyCell();
            cell.char = str[i];
            this.setCell(x + i, y, cell);
        }
    }
    /**
     * Move cursor
     */
    moveCursor(x, y) {
        this.cursor.position = { x, y };
        this.cursorMoved = true;
    }
    /**
     * Get cursor
     */
    getCursor() {
        return this.cursor;
    }
    /**
     * Show/hide cursor
     */
    setCursorVisible(visible) {
        this.cursor.visible = visible;
    }
    /**
     * Clear screen
     */
    clear() {
        this.cells = this.createEmptyScreen();
        this.markDirty();
    }
    /**
     * Scroll screen up by n lines
     */
    scrollUp(lines = 1) {
        for (let i = 0; i < lines; i++) {
            this.cells.shift();
            this.cells.push([]);
            for (let x = 0; x < this.width; x++) {
                this.cells[this.height - 1].push(createEmptyCell());
            }
        }
        this.markDirty();
    }
    /**
     * Get line at y
     */
    getLine(y) {
        if (y < 0 || y >= this.height)
            return [];
        return [...this.cells[y]];
    }
    /**
     * Compare with another buffer and return diff
     */
    diff(other) {
        const cells = new Map();
        let scrollLines = 0;
        let cursorMoved = this.cursorMoved;
        // Compare cells
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const thisCell = this.cells[y][x];
                const otherCell = other.getCell(x, y);
                if (otherCell && !cellsEqual(thisCell, otherCell)) {
                    cells.set(`${x},${y}`, otherCell);
                }
            }
        }
        cursorMoved = cursorMoved || !(this.cursor.position.x === other.getCursor().position.x &&
            this.cursor.position.y === other.getCursor().position.y);
        return {
            cells,
            scrollLines,
            cursorMoved,
            newCursorPosition: other.getCursor().position,
        };
    }
    /**
     * Generate ANSI output for changed region
     */
    toAnsiString(region) {
        const reg = region || this.dirtyRegion || {
            start: { x: 0, y: 0 },
            end: { x: this.width, y: this.height },
        };
        let output = "";
        const cursor = this.getCursor();
        for (let y = reg.start.y; y < reg.end.y && y < this.height; y++) {
            output += `\x1b[${y + 1};${reg.start.x + 1}H`; // Move to position
            let lineOutput = "";
            for (let x = reg.start.x; x < reg.end.x && x < this.width; x++) {
                const cell = this.cells[y][x];
                lineOutput += cell.char;
            }
            // Trim trailing spaces
            lineOutput = lineOutput.replace(/\s+$/, "");
            if (lineOutput || y < this.height - 1) {
                output += lineOutput + "\r\n";
            }
        }
        return output;
    }
    /**
     * Full render to string
     */
    toString() {
        let output = "";
        for (let y = 0; y < this.height; y++) {
            let row = "";
            for (let x = 0; x < this.width; x++) {
                row += this.cells[y][x].char;
            }
            output += row + "\n";
        }
        return output;
    }
}
/**
 * Screen Pool - Manages multiple screen buffers
 */
export class ScreenPool {
    pool;
    maxSize;
    constructor(maxSize = 2) {
        this.maxSize = maxSize;
        this.pool = [];
    }
    /**
     * Get or create buffer
     */
    acquire(width, height) {
        if (this.pool.length > 0) {
            return this.pool.shift();
        }
        return new ScreenBuffer(width, height);
    }
    /**
     * Release buffer back to pool
     */
    release(buffer) {
        if (this.pool.length < this.maxSize) {
            buffer.clear();
            this.pool.push(buffer);
        }
    }
    /**
     * Clear pool
     */
    clear() {
        this.pool = [];
    }
}
/**
 * Scrollback Buffer - Stores screen history
 */
export class ScrollbackBuffer {
    lines;
    maxLines;
    constructor(maxLines = 10000) {
        this.lines = [];
        this.maxLines = maxLines;
    }
    /**
     * Add line to history
     */
    push(line) {
        this.lines.push(line);
        if (this.lines.length > this.maxLines) {
            this.lines.shift();
        }
    }
    /**
     * Add multiple lines
     */
    pushLines(lines) {
        for (const line of lines) {
            this.push(line);
        }
    }
    /**
     * Get line at index
     */
    getLine(index) {
        if (index < 0 || index >= this.lines.length)
            return null;
        return this.lines[index];
    }
    /**
     * Get last n lines
     */
    getLastLines(count) {
        return this.lines.slice(-count);
    }
    /**
     * Get total lines
     */
    get length() {
        return this.lines.length;
    }
    /**
     * Clear buffer
     */
    clear() {
        this.lines = [];
    }
    /**
     * Search lines
     */
    search(pattern) {
        const results = [];
        for (let i = 0; i < this.lines.length; i++) {
            if (pattern.test(this.lines[i])) {
                results.push({ index: i, line: this.lines[i] });
            }
        }
        return results;
    }
}
