/**
 * Yoga-inspired Flexbox Layout for Terminal
 * Provides flexbox-like layout calculations for terminal UI
 */
/**
 * Calculate dimension value
 */
function calculateDimension(value, containerValue) {
    if (value === undefined || value === "auto" || value === "100%") {
        return "auto";
    }
    if (typeof value === "string" && value.endsWith("%")) {
        return (parseFloat(value) / 100) * containerValue;
    }
    if (typeof value === "number") {
        return value;
    }
    return "auto";
}
/**
 * Get numeric value or fallback
 */
function toNumber(value, fallback) {
    return value === "auto" ? fallback : value;
}
/**
 * Get max cross size of items (returns number)
 */
function getMaxCrossSize(items, isRow) {
    let max = 0;
    for (const item of items) {
        const size = isRow ? item.computedHeight : item.computedWidth;
        const numSize = toNumber(size, 0);
        if (numSize > max) {
            max = numSize;
        }
    }
    return max;
}
/**
 * Calculate flex layout
 */
export function calculateFlexLayout(items, containerSize, style = {}) {
    const { direction = "row", justify = "flex-start", align = "stretch", wrap = "nowrap", gap = 0, } = style;
    const isRow = direction === "row" || direction === "row-reverse";
    const isReverse = direction === "row-reverse" || direction === "column-reverse";
    // Convert items to flex items with computed sizes
    const flexItems = items.map((item) => {
        const itemStyle = item.style || {};
        const itemWidth = calculateDimension(itemStyle.width || item.maxWidth || item.minWidth || "auto", containerSize.width);
        const itemHeight = calculateDimension(itemStyle.height || item.maxHeight || item.minHeight || "auto", containerSize.height);
        return {
            id: item.id,
            style: itemStyle,
            computedWidth: itemWidth,
            computedHeight: itemHeight,
            grow: itemStyle.flexGrow || 0,
            shrink: itemStyle.flexShrink || 1,
            basis: calculateDimension(itemStyle.flexBasis || "auto", containerSize.width),
        };
    });
    // Calculate total flex basis
    let totalBasis = 0;
    let totalGrow = 0;
    flexItems.forEach((item) => {
        if (item.basis !== "auto") {
            totalBasis += item.basis;
        }
        totalGrow += item.grow;
    });
    // Main axis dimension
    const mainAxis = isRow ? containerSize.width : containerSize.height;
    const crossAxis = isRow ? containerSize.height : containerSize.width;
    // Calculate main sizes (respecting flex grow/shrink)
    flexItems.forEach((item) => {
        if (item.grow > 0 && totalGrow > 0 && totalBasis < mainAxis) {
            const freeSpace = mainAxis - totalBasis;
            const growAmount = (item.grow / totalGrow) * freeSpace;
            if (isRow) {
                item.computedWidth = toNumber(item.basis, 0) + growAmount;
            }
            else {
                item.computedHeight = toNumber(item.basis, 0) + growAmount;
            }
        }
        else {
            // Default size
            if (isRow && item.computedWidth === "auto") {
                item.computedWidth = 10; // Default width
            }
            else if (!isRow && item.computedHeight === "auto") {
                item.computedHeight = 1; // Default height
            }
        }
    });
    // Calculate positions
    const results = [];
    let mainPos = 0;
    let crossPos = 0;
    let lineStart = 0;
    for (let i = 0; i < flexItems.length; i++) {
        const item = flexItems[i];
        const itemMainSize = toNumber(isRow ? item.computedWidth : item.computedHeight, 0);
        const itemCrossSize = toNumber(isRow ? item.computedHeight : item.computedWidth, 0);
        // Check if we need to wrap
        if (wrap !== "nowrap" && mainPos + itemMainSize > mainAxis && mainPos > 0) {
            // Move to next line
            mainPos = 0;
            crossPos += getMaxCrossSize(flexItems.slice(lineStart, i), isRow);
            lineStart = i;
        }
        // Calculate position
        const pos = isReverse ? mainAxis - mainPos - itemMainSize : mainPos;
        const result = {
            x: isRow ? pos : crossPos,
            y: isRow ? crossPos : pos,
            width: isRow ? itemMainSize : itemCrossSize,
            height: isRow ? itemCrossSize : itemMainSize,
        };
        // Handle alignment on cross axis
        if (align === "center") {
            if (isRow) {
                result.y += (crossAxis - itemCrossSize) / 2;
            }
            else {
                result.x += (crossAxis - itemCrossSize) / 2;
            }
        }
        else if (align === "flex-end") {
            if (isRow) {
                result.y += crossAxis - itemCrossSize;
            }
            else {
                result.x += crossAxis - itemCrossSize;
            }
        }
        results.push(result);
        // Update main position
        mainPos += itemMainSize + gap;
    }
    return results;
}
/**
 * Layout engine class
 */
export class LayoutEngine {
    containerWidth;
    containerHeight;
    items;
    constructor(width = 80, height = 24) {
        this.containerWidth = width;
        this.containerHeight = height;
        this.items = new Map();
    }
    /**
     * Set container size
     */
    setContainerSize(width, height) {
        this.containerWidth = width;
        this.containerHeight = height;
    }
    /**
     * Add item to layout
     */
    addItem(id, style, children) {
        const layout = calculateFlexLayout(children || [
            {
                id,
                style,
                content: "",
            },
        ], { width: this.containerWidth, height: this.containerHeight }, style);
        const result = layout[0] || { x: 0, y: 0, width: 0, height: 0 };
        this.items.set(id, result);
        return result;
    }
    /**
     * Get item layout
     */
    getItem(id) {
        return this.items.get(id);
    }
    /**
     * Remove item
     */
    removeItem(id) {
        this.items.delete(id);
    }
    /**
     * Calculate flex layout for multiple items
     */
    calculate(items, style) {
        return calculateFlexLayout(items, { width: this.containerWidth, height: this.containerHeight }, style);
    }
}
// Flex helpers
export const FlexLayout = {
    /**
     * Create a row layout
     */
    row: (items, gap = 0) => {
        return calculateFlexLayout(items, { width: 80, height: 24 }, { direction: "row", gap });
    },
    /**
     * Create a column layout
     */
    column: (items, gap = 0) => {
        return calculateFlexLayout(items, { width: 80, height: 24 }, { direction: "column", gap });
    },
    /**
     * Center content
     */
    center: (item, containerWidth, containerHeight) => {
        const results = calculateFlexLayout([item], { width: containerWidth, height: containerHeight }, {
            justify: "center",
            align: "center",
        });
        return results[0] || { x: 0, y: 0, width: 0, height: 0 };
    },
    /**
     * Fill container
     */
    fill: (width, height) => {
        return { x: 0, y: 0, width, height };
    },
};
