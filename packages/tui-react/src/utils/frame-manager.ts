/**
 * Frame Manager - Frame-based rendering system
 * Manages 60fps rendering with dirty region optimization
 */

import { ScreenBuffer, createEmptyCell, type DiffResult, type Position } from "./screen-buffer.js";

// Node.js fallback for animation frame functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requestAnimationFrame: any = (cb: () => void) => setTimeout(cb, 16);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cancelAnimationFrame: any = (id: any) => clearTimeout(id);

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
export class FrameManager {
	private running: boolean = false;
	private frame: number = 0;
	private lastFrameTime: number = 0;
	private frameInterval: number;
	private config: FrameConfig;
	private callbacks: Set<FrameCallback>;
	private stats: FrameStats;
	private currentBuffer: ScreenBuffer;
	private previousBuffer: ScreenBuffer;
	private animationFrameId: number | null = null;

	constructor(config: Partial<FrameConfig> = {}) {
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
	start(): void {
		if (this.running) return;
		this.running = true;
		this.lastFrameTime = performance.now();
		this.loop();
	}

	/**
	 * Stop the frame loop
	 */
	stop(): void {
		this.running = false;
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	/**
	 * Main frame loop
	 */
	private loop = (): void => {
		if (!this.running) return;

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
	private renderFrame(): void {
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
	subscribe(callback: FrameCallback): () => void {
		this.callbacks.add(callback);
		return () => this.callbacks.delete(callback);
	}

	/**
	 * Mark current frame as dirty
	 */
	markDirty(): void {
		this.currentBuffer.markDirty();
	}

	/**
	 * Get current frame number
	 */
	getFrame(): number {
		return this.frame;
	}

	/**
	 * Get current stats
	 */
	getStats(): FrameStats {
		return { ...this.stats };
	}

	/**
	 * Get current buffer
	 */
	getBuffer(): ScreenBuffer {
		return this.currentBuffer;
	}

	/**
	 * Force a frame render
	 */
	forceRender(): void {
		this.currentBuffer.markDirty();
		this.renderFrame();
	}
}

/**
 * Animation Controller - Manages timed animations
 */
export class AnimationController {
	private animations: Map<string, AnimationState>;
	private lastTime: number;

	constructor() {
		this.animations = new Map();
		this.lastTime = performance.now();
	}

	/**
	 * Create an animation
	 */
	create(
		id: string,
		duration: number,
		easing: (t: number) => number = (t) => t
	): AnimationState {
		const state: AnimationState = {
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
	update(): void {
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
	getValue(id: string): number | null {
		const animation = this.animations.get(id);
		return animation?.value ?? null;
	}

	/**
	 * Cancel animation
	 */
	cancel(id: string): void {
		this.animations.delete(id);
	}

	/**
	 * Check if animation exists
	 */
	has(id: string): boolean {
		return this.animations.has(id);
	}

	/**
	 * Clear all animations
	 */
	clear(): void {
		this.animations.clear();
	}
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
export const Easing = {
	linear: (t: number) => t,
	easeIn: (t: number) => t * t,
	easeOut: (t: number) => t * (2 - t),
	easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
	spring: (t: number) => 1 - Math.cos(t * Math.PI * 4) * Math.exp(-t * 6),
	bounce: (t: number) => {
		const n1 = 7.5625;
		const d1 = 2.75;
		if (t < 1 / d1) return n1 * t * t;
		if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
		if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
		return n1 * (t -= 2.625 / d1) * t + 0.984375;
	},
};

/**
 * Cursor animator - Manages cursor blink animation
 */
export class CursorAnimator {
	private visible: boolean = true;
	private interval: number;
	private lastToggle: number;
	private animationFrameId: number | null = null;
	private running: boolean = false;

	constructor(blinkRate: number = 530) {
		this.interval = blinkRate;
		this.lastToggle = performance.now();
	}

	/**
	 * Start cursor animation
	 */
	start(onToggle: (visible: boolean) => void): void {
		if (this.running) return;
		this.running = true;
		this.loop(onToggle);
	}

	/**
	 * Stop cursor animation
	 */
	stop(): void {
		this.running = false;
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	/**
	 * Animation loop
	 */
	private loop(onToggle: (visible: boolean) => void): void {
		if (!this.running) return;

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
	isVisible(): boolean {
		return this.visible;
	}

	/**
	 * Reset blink timer
	 */
	reset(): void {
		this.visible = true;
		this.lastToggle = performance.now();
	}
}