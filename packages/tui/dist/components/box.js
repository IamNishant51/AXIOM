/**
 * Box Component - Container with padding and optional background
 * Axiom TUI
 */
/**
 * Box component - applies padding and background to children
 */
export class Box {
    paddingX;
    paddingY;
    backgroundFn;
    children = [];
    constructor(paddingX = 1, paddingY = 1, backgroundFn) {
        this.paddingX = paddingX;
        this.paddingY = paddingY;
        this.backgroundFn = backgroundFn;
    }
    /**
     * Add child component
     */
    addChild(component) {
        this.children.push(component);
    }
    /**
     * Remove child component
     */
    removeChild(component) {
        const index = this.children.indexOf(component);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }
    /**
     * Set background function
     */
    setBgFn(fn) {
        this.backgroundFn = fn;
    }
    invalidate() {
        for (const child of this.children) {
            child.invalidate?.();
        }
    }
    render(width) {
        const lines = [];
        // Add vertical padding
        for (let i = 0; i < this.paddingY; i++) {
            lines.push(" ".repeat(width));
        }
        // Render children with horizontal padding
        for (const child of this.children) {
            const childLines = child.render(width - this.paddingX * 2);
            for (const line of childLines) {
                const paddedLine = " ".repeat(this.paddingX) + line + " ".repeat(this.paddingX);
                const finalLine = this.backgroundFn ? this.backgroundFn(paddedLine) : paddedLine;
                lines.push(finalLine);
            }
        }
        // Add vertical padding at bottom
        for (let i = 0; i < this.paddingY; i++) {
            lines.push(" ".repeat(width));
        }
        return lines;
    }
}
//# sourceMappingURL=box.js.map