/**
 * Animation Hooks for TUI Components
 * Based on OpenClaude patterns with 50ms animation frame
 */
export declare function useAnimationFrame(reducedMotion?: boolean | null, interval?: number): [React.RefObject<HTMLElement | null>, number];
export interface StalledState {
    isStalled: boolean;
    stalledIntensity: number;
}
export declare function useStalledAnimation(time: number, currentResponseLength: number, hasActiveTools?: boolean, reducedMotion?: boolean): StalledState;
export declare function useGlimmerAnimation(time: number, messageWidth: number, mode?: "requesting" | "normal", isStalled?: boolean): number;
export declare function useTokenCounterAnimation(currentResponseLength: number, reducedMotion?: boolean): number;
export declare function useThinkingShimmer(time: number): number;
export declare function useDebouncedCallback<T extends (...args: any[]) => any>(callback: T, delay: number): T;
//# sourceMappingURL=animation.d.ts.map