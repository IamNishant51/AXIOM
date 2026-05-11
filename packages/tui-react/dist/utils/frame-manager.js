/**
 * Frame Manager - Frame-based rendering system
 * Manages 60fps rendering with dirty region optimization
 */
import { ScreenBuffer } from "./screen-buffer.js";
// Node.js fallback for animation frame functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requestAnimationFrame = (cb) => setTimeout(cb, 16);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cancelAnimationFrame = (id) => clearTimeout(id);
/**
 * Frame Manager - Handles efficient frame-based rendering
 */
export class FrameManager {
    running = false;
    frame = 0;
    lastFrameTime = 0;
    frameInterval;
    config;
    callbacks;
    stats;
    currentBuffer;
    previousBuffer;
    animationFrameId = null;
    constructor(config = {}) {
        this.config = {
            targetFPS: config.targetFPS ?? 60,
            enableDirtyOptimization: config.enableDirtyOptimization ?? true,
            enableCursorOptimization: config.enableCursorOptimization ?? true,
        };
        this.frameInterval = 1000 / this.config.targetFPS;
        this.callbacks = new Set();
        this.stats = {
            fps: 0,
            frameTime: 0,
            dirtyCells: 0,
            skippedFrames: 0,
        };
        this.currentBuffer = new ScreenBuffer();
        this.previousBuffer = new ScreenBuffer();
    }
    /**
     * Start the frame loop
     */
    start() {
        if (this.running)
            return;
        this.running = true;
        this.lastFrameTime = performance.now();
        this.loop();
    }
    /**
     * Stop the frame loop
     */
    stop() {
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    /**
     * Main frame loop
     */
    loop = () => {
        if (!this.running)
            return;
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        if (elapsed >= this.frameInterval) {
            this.renderFrame();
            this.lastFrameTime = now - (elapsed % this.frameInterval);
        }
        this.animationFrameId = requestAnimationFrame(this.loop);
    };
    /**
     * Render a single frame
     */
    renderFrame() {
        const frameStart = performance.now();
        // Calculate diff
        const diff = this.currentBuffer.diff(this.previousBuffer);
        this.stats.dirtyCells = diff.cells.size;
        // Check if we should skip this frame (no changes)
        if (this.config.enableDirtyOptimization && diff.cells.size === 0 && !diff.cursorMoved) {
            this.stats.skippedFrames++;
            return;
        }
        // Notify callbacks
        for (const callback of this.callbacks) {
            callback(this.frame, { ...this.stats });
        }
        // Update previous buffer
        this.previousBuffer = this.currentBuffer;
        this.currentBuffer = new ScreenBuffer();
        // Calculate frame time
        const frameTime = performance.now() - frameStart;
        this.stats.frameTime = frameTime;
        this.stats.fps = 1000 / (frameTime || 1);
        this.frame++;
    }
    /**
     * Subscribe to frame updates
     */
    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }
    /**
     * Mark current frame as dirty
     */
    markDirty() {
        this.currentBuffer.markDirty();
    }
    /**
     * Get current frame number
     */
    getFrame() {
        return this.frame;
    }
    /**
     * Get current stats
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get current buffer
     */
    getBuffer() {
        return this.currentBuffer;
    }
    /**
     * Force a frame render
     */
    forceRender() {
        this.currentBuffer.markDirty();
        this.renderFrame();
    }
}
/**
 * Animation Controller - Manages timed animations
 */
export class AnimationController {
    animations;
    lastTime;
    constructor() {
        this.animations = new Map();
        this.lastTime = performance.now();
    }
    /**
     * Create an animation
     */
    create(id, duration, easing = (t) => t) {
        const state = {
            id,
            duration,
            easing,
            startTime: performance.now(),
            value: 0,
            completed: false,
        };
        this.animations.set(id, state);
        return state;
    }
    /**
     * Update animations
     */
    update() {
        const now = performance.now();
        for (const [id, animation] of this.animations) {
            const elapsed = now - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            animation.value = animation.easing(progress);
            if (progress >= 1) {
                animation.completed = true;
                this.animations.delete(id);
            }
        }
        this.lastTime = now;
    }
    /**
     * Get animation value
     */
    getValue(id) {
        const animation = this.animations.get(id);
        return animation?.value ?? null;
    }
    /**
     * Cancel animation
     */
    cancel(id) {
        this.animations.delete(id);
    }
    /**
     * Check if animation exists
     */
    has(id) {
        return this.animations.has(id);
    }
    /**
     * Clear all animations
     */
    clear() {
        this.animations.clear();
    }
}
/**
 * Easing functions
 */
export const Easing = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    spring: (t) => 1 - Math.cos(t * Math.PI * 4) * Math.exp(-t * 6),
    bounce: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1)
            return n1 * t * t;
        if (t < 2 / d1)
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1)
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
};
/**
 * Cursor animator - Manages cursor blink animation
 */
export class CursorAnimator {
    visible = true;
    interval;
    lastToggle;
    animationFrameId = null;
    running = false;
    constructor(blinkRate = 530) {
        this.interval = blinkRate;
        this.lastToggle = performance.now();
    }
    /**
     * Start cursor animation
     */
    start(onToggle) {
        if (this.running)
            return;
        this.running = true;
        this.loop(onToggle);
    }
    /**
     * Stop cursor animation
     */
    stop() {
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    /**
     * Animation loop
     */
    loop(onToggle) {
        if (!this.running)
            return;
        const now = performance.now();
        if (now - this.lastToggle >= this.interval) {
            this.visible = !this.visible;
            onToggle(this.visible);
            this.lastToggle = now;
        }
        this.animationFrameId = requestAnimationFrame(() => this.loop(onToggle));
    }
    /**
     * Get current visibility
     */
    isVisible() {
        return this.visible;
    }
    /**
     * Reset blink timer
     */
    reset() {
        this.visible = true;
        this.lastToggle = performance.now();
    }
}
