/**
 * Spacer Component - Empty lines for vertical spacing
 * Axiom TUI
 */
import type { Component } from "../tui.js";
/**
 * Spacer component - adds empty vertical space
 */
export declare class Spacer implements Component {
    private lines;
    constructor(lines?: number);
    /**
     * Set number of lines
     */
    setLines(lines: number): void;
    invalidate(): void;
    render(width: number): string[];
}
//# sourceMappingURL=spacer.d.ts.map