/**
 * Spacer Component - Empty lines for vertical spacing
 * Axiom TUI
 */
/**
 * Spacer component - adds empty vertical space
 */
export class Spacer {
    lines;
    constructor(lines = 1) {
        this.lines = lines;
    }
    /**
     * Set number of lines
     */
    setLines(lines) {
        this.lines = lines;
    }
    invalidate() {
        // Nothing to invalidate
    }
    render(width) {
        return Array(this.lines).fill(" ".repeat(width));
    }
}
//# sourceMappingURL=spacer.js.map