/**
 * Frame Manager - Frame-based rendering system
 * Manages 60fps rendering with dirty region optimization
 */
import { ScreenBuffer } from "./screen-buffer.js";
export interface FrameConfig {
    targetFPS: number;
    enableDirtyOptimization: boolean;
    enableCursorOptimization: boolean;
}
export interface FrameStats {
    fps: number;
    frameTime: number;
    dirtyCells: number;
    skippedFrames: number;
}
export type FrameCallback = (frame: number, stats: FrameStats) => void;
/**
 * Frame Manager - Handles efficient frame-based rendering
 */
export declare class FrameManager {
    private running;
    private frame;
    private lastFrameTime;
    private frameInterval;
    private config;
    private callbacks;
    private stats;
    private currentBuffer;
    private previousBuffer;
    private animationFrameId;
    constructor(config?: Partial<FrameConfig>);
    /**
     * Start the frame loop
     */
    start(): void;
    /**
     * Stop the frame loop
     */
    stop(): void;
    /**
     * Main frame loop
     */
    private loop;
    /**
     * Render a single frame
     */
    private renderFrame;
    /**
     * Subscribe to frame updates
     */
    subscribe(callback: FrameCallback): () => void;
    /**
     * Mark current frame as dirty
     */
    markDirty(): void;
    /**
     * Get current frame number
     */
    getFrame(): number;
    /**
     * Get current stats
     */
    getStats(): FrameStats;
    /**
     * Get current buffer
     */
    getBuffer(): ScreenBuffer;
    /**
     * Force a frame render
     */
    forceRender(): void;
}
/**
 * Animation Controller - Manages timed animations
 */
export declare class AnimationController {
    private animations;
    private lastTime;
    constructor();
    /**
     * Create an animation
     */
    create(id: string, duration: number, easing?: (t: number) => number): AnimationState;
    /**
     * Update animations
     */
    update(): void;
    /**
     * Get animation value
     */
    getValue(id: string): number | null;
    /**
     * Cancel animation
     */
    cancel(id: string): void;
    /**
     * Check if animation exists
     */
    has(id: string): boolean;
    /**
     * Clear all animations
     */
    clear(): void;
}
interface AnimationState {
    id: string;
    duration: number;
    easing: (t: number) => number;
    startTime: number;
    value: number;
    completed: boolean;
}
/**
 * Easing functions
 */
export declare const Easing: {
    linear: (t: number) => number;
    easeIn: (t: number) => number;
    easeOut: (t: number) => number;
    easeInOut: (t: number) => number;
    spring: (t: number) => number;
    bounce: (t: number) => number;
};
/**
 * Cursor animator - Manages cursor blink animation
 */
export declare class CursorAnimator {
    private visible;
    private interval;
    private lastToggle;
    private animationFrameId;
    private running;
    constructor(blinkRate?: number);
    /**
     * Start cursor animation
     */
    start(onToggle: (visible: boolean) => void): void;
    /**
     * Stop cursor animation
     */
    stop(): void;
    /**
     * Animation loop
     */
    private loop;
    /**
     * Get current visibility
     */
    isVisible(): boolean;
    /**
     * Reset blink timer
     */
    reset(): void;
}
export {};
//# sourceMappingURL=frame-manager.d.ts.map