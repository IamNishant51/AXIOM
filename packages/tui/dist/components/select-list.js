/**
 * SelectList Component - Interactive selection list
 * Axiom TUI
 */
import { matchesKey, Key } from "../keys.js";
import { truncateToWidth, visibleWidth } from "../utils.js";
/**
 * Select list component - interactive list for selection
 */
export class SelectList {
    items;
    maxVisible;
    theme;
    selectedIndex = 0;
    filter = "";
    onSelect;
    onCancel;
    onSelectionChange;
    constructor(items, maxVisible = 10, theme) {
        this.items = items;
        this.maxVisible = maxVisible;
        this.theme = theme;
    }
    /**
     * Set filter
     */
    setFilter(filter) {
        this.filter = filter.toLowerCase();
        this.selectedIndex = 0;
    }
    invalidate() {
        // Nothing to invalidate
    }
    render(width) {
        // Filter items
        const filteredItems = this.filter
            ? this.items.filter((item) => item.label.toLowerCase().includes(this.filter) || item.value.toLowerCase().includes(this.filter))
            : this.items;
        if (filteredItems.length === 0) {
            return [this.theme.noMatch("No matches")];
        }
        // Clamp selected index
        this.selectedIndex = Math.min(filteredItems.length - 1, Math.max(0, this.selectedIndex));
        const lines = [];
        const effectiveWidth = width - 2; // Leave space for borders
        // Top border
        lines.push("┌" + "─".repeat(effectiveWidth) + "┐");
        // Calculate visible range
        let startIdx = 0;
        if (filteredItems.length > this.maxVisible) {
            startIdx = Math.max(0, this.selectedIndex - Math.floor(this.maxVisible / 2));
            startIdx = Math.min(filteredItems.length - this.maxVisible, startIdx);
        }
        // Render visible items
        for (let i = 0; i < this.maxVisible && startIdx + i < filteredItems.length; i++) {
            const item = filteredItems[startIdx + i];
            const isSelected = startIdx + i === this.selectedIndex;
            const prefix = isSelected ? this.theme.selectedPrefix("▶ ") : "  ";
            const label = truncateToWidth(item.label, effectiveWidth - 2);
            let line = prefix + label;
            // Add description
            if (item.description && isSelected) {
                const desc = truncateToWidth(item.description, effectiveWidth - 4);
                line += "\n  " + this.theme.description(desc);
            }
            // Pad to width
            const visibleLen = visibleWidth(line);
            if (visibleLen < effectiveWidth) {
                line += " ".repeat(effectiveWidth - visibleLen);
            }
            const selectedText = isSelected ? this.theme.selectedText(line) : line;
            lines.push("│" + selectedText + "│");
        }
        // Bottom border
        lines.push("└" + "─".repeat(effectiveWidth) + "┘");
        // Scroll info
        if (filteredItems.length > this.maxVisible) {
            const scrollInfo = `${startIdx + 1}-${Math.min(startIdx + this.maxVisible, filteredItems.length)} of ${filteredItems.length}`;
            lines.push(this.theme.scrollInfo(scrollInfo));
        }
        // Notify selection change
        if (filteredItems[this.selectedIndex]) {
            this.onSelectionChange?.(filteredItems[this.selectedIndex]);
        }
        return lines;
    }
    handleInput(data) {
        // Filter items first
        const filteredItems = this.filter
            ? this.items.filter((item) => item.label.toLowerCase().includes(this.filter) || item.value.toLowerCase().includes(this.filter))
            : this.items;
        if (matchesKey(data, Key.up)) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            return;
        }
        if (matchesKey(data, Key.down)) {
            this.selectedIndex = Math.min(filteredItems.length - 1, this.selectedIndex + 1);
            return;
        }
        if (matchesKey(data, Key.enter)) {
            if (filteredItems[this.selectedIndex]) {
                this.onSelect?.(filteredItems[this.selectedIndex]);
            }
            return;
        }
        if (matchesKey(data, Key.escape)) {
            this.onCancel?.();
            return;
        }
    }
}
//# sourceMappingURL=select-list.js.map