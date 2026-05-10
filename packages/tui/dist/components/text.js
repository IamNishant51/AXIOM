/**
 * Text Component - Multi-line text display with word wrapping
 * Axiom TUI
 */
import { visibleWidth, truncateToWidth } from "../utils.js";
/**
 * Text component - displays multi-line text with word wrapping
 */
export class Text {
    text;
    paddingX;
    paddingY;
    backgroundFn;
    cachedLines;
    constructor(text, options = {}) {
        this.text = text;
        this.paddingX = options.paddingX ?? 1;
        this.paddingY = options.paddingY ?? 1;
        this.backgroundFn = options.backgroundFn;
    }
    /**
     * Set text content
     */
    setText(text) {
        if (this.text !== text) {
            this.text = text;
            this.cachedLines = undefined;
        }
    }
    /**
     * Set background function
     */
    setBackgroundFn(fn) {
        this.backgroundFn = fn;
        this.cachedLines = undefined;
    }
    invalidate() {
        this.cachedLines = undefined;
    }
    render(width) {
        // Add horizontal padding
        const effectiveWidth = width - this.paddingX * 2;
        if (effectiveWidth <= 0)
            return [];
        // Word wrap text
        const wrapped = this.wrapText(this.text, effectiveWidth);
        // Apply padding
        const padding = " ".repeat(this.paddingX);
        const lines = [];
        // Add vertical padding
        for (let i = 0; i < this.paddingY; i++) {
            lines.push(padding + " ".repeat(effectiveWidth) + padding);
        }
        // Add content
        for (const line of wrapped) {
            const truncated = truncateToWidth(line, effectiveWidth);
            const content = this.backgroundFn ? this.backgroundFn(truncated) : truncated;
            lines.push(padding + content + padding);
        }
        // Add vertical padding at bottom
        for (let i = 0; i < this.paddingY; i++) {
            lines.push(padding + " ".repeat(effectiveWidth) + padding);
        }
        return lines;
    }
    /**
     * Word wrap text to fit width
     */
    wrapText(text, width) {
        if (width <= 0)
            return [];
        const lines = [];
        const paragraphs = text.split("\n");
        for (const paragraph of paragraphs) {
            if (!paragraph.trim()) {
                lines.push("");
                continue;
            }
            const words = paragraph.split(/(\s+)/);
            let currentLine = "";
            let currentWidth = 0;
            for (const word of words) {
                const wordWidth = visibleWidth(word);
                if (currentWidth + wordWidth > width && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = word;
                    currentWidth = wordWidth;
                }
                else {
                    currentLine += word;
                    currentWidth += wordWidth;
                }
            }
            if (currentLine.length > 0) {
                lines.push(currentLine);
            }
        }
        return lines;
    }
}
//# sourceMappingURL=text.js.map