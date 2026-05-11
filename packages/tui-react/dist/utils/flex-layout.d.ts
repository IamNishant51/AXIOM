/**
 * Yoga-inspired Flexbox Layout for Terminal
 * Provides flexbox-like layout calculations for terminal UI
 */
export type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";
export type FlexJustify = "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
export type FlexAlign = "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
export type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
export interface FlexStyle {
    direction?: FlexDirection;
    justify?: FlexJustify;
    align?: FlexAlign;
    wrap?: FlexWrap;
    gap?: number;
    width?: number | string;
    height?: number | string;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | string;
}
export interface LayoutItem {
    id: string;
    style?: FlexStyle;
    children?: LayoutItem[];
    content?: string;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}
export interface LayoutResult {
    x: number;
    y: number;
    width: number;
    height: number;
    children?: LayoutResult[];
}
export interface ContainerSize {
    width: number;
    height: number;
}
/**
 * Calculate flex layout
 */
export declare function calculateFlexLayout(items: LayoutItem[], containerSize: ContainerSize, style?: FlexStyle): LayoutResult[];
/**
 * Layout engine class
 */
export declare class LayoutEngine {
    private containerWidth;
    private containerHeight;
    private items;
    constructor(width?: number, height?: number);
    /**
     * Set container size
     */
    setContainerSize(width: number, height: number): void;
    /**
     * Add item to layout
     */
    addItem(id: string, style: FlexStyle, children?: LayoutItem[]): LayoutResult;
    /**
     * Get item layout
     */
    getItem(id: string): LayoutResult | undefined;
    /**
     * Remove item
     */
    removeItem(id: string): void;
    /**
     * Calculate flex layout for multiple items
     */
    calculate(items: LayoutItem[], style?: FlexStyle): LayoutResult[];
}
export declare const FlexLayout: {
    /**
     * Create a row layout
     */
    row: (items: LayoutItem[], gap?: number) => LayoutResult[];
    /**
     * Create a column layout
     */
    column: (items: LayoutItem[], gap?: number) => LayoutResult[];
    /**
     * Center content
     */
    center: (item: LayoutItem, containerWidth: number, containerHeight: number) => LayoutResult;
    /**
     * Fill container
     */
    fill: (width: number, height: number) => LayoutResult;
};
//# sourceMappingURL=flex-layout.d.ts.map