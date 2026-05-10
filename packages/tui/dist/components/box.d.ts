/**
 * Box Component - Container with padding and optional background
 * Axiom TUI
 */
import type { Component } from "../tui.js";
/**
 * Box component - applies padding and background to children
 */
export declare class Box implements Component {
    private paddingX;
    private paddingY;
    private backgroundFn?;
    private children;
    constructor(paddingX?: number, paddingY?: number, backgroundFn?: (text: string) => string);
    /**
     * Add child component
     */
    addChild(component: Component): void;
    /**
     * Remove child component
     */
    removeChild(component: Component): void;
    /**
     * Set background function
     */
    setBgFn(fn: (text: string) => string): void;
    invalidate(): void;
    render(width: number): string[];
}
//# sourceMappingURL=box.d.ts.map