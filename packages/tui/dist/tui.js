/**
 * Core TUI - Terminal User Interface with differential rendering
 * Axiom TUI
 */
/**
 * Cursor position marker
 */
export const CURSOR_MARKER = "\x1b_pi:c\x07";
/**
 * Check if component is focusable
 */
export function isFocusable(component) {
    return component !== null && "focused" in component;
}
/**
 * Parse size value
 */
function parseSizeValue(value, referenceSize) {
    if (value === undefined)
        return undefined;
    if (typeof value === "number")
        return value;
    const match = value.match(/^(\d+(?:\.\d+)?)%$/);
    if (match) {
        return Math.floor((referenceSize * parseFloat(match[1])) / 100);
    }
    return undefined;
}
/**
 * Container - component that contains other components
 */
export class Container {
    children = [];
    addChild(component) {
        this.children.push(component);
    }
    removeChild(component) {
        const index = this.children.indexOf(component);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }
    clear() {
        this.children = [];
    }
    invalidate() {
        for (const child of this.children) {
            child.invalidate?.();
        }
    }
    render(width) {
        const lines = [];
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
    terminal;
    children = [];
    focusIndex = -1;
    overlayStack = [];
    lastRendered = [];
    running = false;
    frameCallback;
    constructor(terminal) {
        this.terminal = terminal;
    }
    /**
     * Add a child component
     */
    addChild(component) {
        this.children.push(component);
        this.requestRender();
    }
    /**
     * Remove a child component
     */
    removeChild(component) {
        const index = this.children.indexOf(component);
        if (index !== -1) {
            this.children.splice(index, 1);
            this.requestRender();
        }
    }
    /**
     * Start the TUI
     */
    start() {
        this.running = true;
        this.terminal.start((data) => this.handleInput(data), () => this.handleResize());
        this.terminal.hideCursor();
        this.render();
    }
    /**
     * Stop the TUI
     */
    stop() {
        this.running = false;
        this.terminal.showCursor();
        this.terminal.stop();
    }
    /**
     * Request a re-render
     */
    requestRender() {
        if (!this.running)
            return;
        this.render();
    }
    /**
     * Show an overlay
     */
    showOverlay(component, options = {}) {
        const handle = {
            hide: () => this.hideOverlay(),
            setHidden: (hidden) => {
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
    hideOverlay() {
        if (this.overlayStack.length > 0) {
            this.overlayStack.pop();
            this.requestRender();
        }
    }
    /**
     * Check if overlay is active
     */
    hasOverlay() {
        return this.overlayStack.length > 0;
    }
    /**
     * Debug callback
     */
    onDebug;
    /**
     * Handle input
     */
    handleInput(data) {
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
    handleResize() {
        this.render();
    }
    /**
     * Render the UI
     */
    render() {
        const width = this.terminal.columns;
        const height = this.terminal.rows;
        // Build render tree
        const renderTree = this.buildRenderTree();
        // Render all components
        const newLines = [];
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
    buildRenderTree() {
        return this.children.map((child) => ({
            component: child,
            width: this.terminal.columns,
        }));
    }
    /**
     * Differential rendering
     */
    diffRender(oldLines, newLines) {
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
    fullRender(lines) {
        this.terminal.clearScreen();
        this.terminal.write(lines.join("\r\n"));
    }
}
/**
 * Export utilities
 */
export { visibleWidth, truncateToWidth, wrapTextWithAnsi } from "./utils.js";
export { ProcessTerminal } from "./terminal.js";
//# sourceMappingURL=tui.js.map