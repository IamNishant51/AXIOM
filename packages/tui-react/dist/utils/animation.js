/**
 * Animation Hooks for TUI Components
 * Based on OpenClaude patterns with 50ms animation frame
 */
import { useRef, useState, useEffect, useCallback } from "react";
// Use setInterval for Node.js environment
// Animation frame hook - returns [ref, time] where time increments at interval
export function useAnimationFrame(reducedMotion = false, interval = 50) {
    const [time, setTime] = useState(0);
    const ref = useRef(null);
    const lastTimeRef = useRef(performance.now());
    useEffect(() => {
        if (reducedMotion) {
            setTime(0);
            return;
        }
        // Use setInterval for Node.js compatibility
        const tick = () => {
            const now = performance.now();
            const elapsed = now - lastTimeRef.current;
            if (elapsed >= interval) {
                setTime((prev) => prev + elapsed);
                lastTimeRef.current = now;
            }
        };
        const intervalId = setInterval(tick, interval);
        return () => clearInterval(intervalId);
    }, [reducedMotion, interval]);
    return [ref, time];
}
export function useStalledAnimation(time, currentResponseLength, hasActiveTools = false, reducedMotion = false) {
    const lastTokenTime = useRef(time);
    const lastResponseLength = useRef(currentResponseLength);
    const mountTime = useRef(time);
    const stalledIntensityRef = useRef(0);
    const lastSmoothTime = useRef(time);
    // Reset timer when new tokens arrive
    if (currentResponseLength > lastResponseLength.current) {
        lastTokenTime.current = time;
        lastResponseLength.current = currentResponseLength;
        stalledIntensityRef.current = 0;
        lastSmoothTime.current = time;
    }
    // Derive time since last token
    let timeSinceLastToken;
    if (hasActiveTools) {
        timeSinceLastToken = 0;
        lastTokenTime.current = time;
    }
    else if (currentResponseLength > 0) {
        timeSinceLastToken = time - lastTokenTime.current;
    }
    else {
        timeSinceLastToken = time - mountTime.current;
    }
    // Calculate stalled intensity
    const isStalled = timeSinceLastToken > 3000 && !hasActiveTools;
    const intensity = isStalled
        ? Math.min((timeSinceLastToken - 3000) / 2000, 1)
        : 0;
    // Smooth transition
    if (!reducedMotion && (intensity > 0 || stalledIntensityRef.current > 0)) {
        const dt = time - lastSmoothTime.current;
        if (dt >= 50) {
            const steps = Math.floor(dt / 50);
            let current = stalledIntensityRef.current;
            for (let i = 0; i < steps; i++) {
                const diff = intensity - current;
                if (Math.abs(diff) < 0.01) {
                    current = intensity;
                    break;
                }
                current += diff * 0.1;
            }
            stalledIntensityRef.current = current;
            lastSmoothTime.current = time;
        }
    }
    else {
        stalledIntensityRef.current = intensity;
        lastSmoothTime.current = time;
    }
    return {
        isStalled,
        stalledIntensity: reducedMotion ? intensity : stalledIntensityRef.current,
    };
}
// Glimmer animation hook for text shimmer effect
export function useGlimmerAnimation(time, messageWidth, mode = "normal", isStalled = false) {
    const glimmerSpeed = mode === "requesting" ? 50 : 200;
    const cycleLength = messageWidth + 20;
    const cyclePosition = Math.floor(time / glimmerSpeed);
    if (isStalled)
        return -100;
    return mode === "requesting"
        ? cyclePosition % cycleLength - 10
        : messageWidth + 10 - (cyclePosition % cycleLength);
}
// Token counter animation - smooth increment
export function useTokenCounterAnimation(currentResponseLength, reducedMotion = false) {
    const tokenCounterRef = useRef(currentResponseLength);
    const gap = currentResponseLength - tokenCounterRef.current;
    if (reducedMotion) {
        tokenCounterRef.current = currentResponseLength;
    }
    else if (gap > 0) {
        let increment;
        if (gap < 70) {
            increment = 3;
        }
        else if (gap < 200) {
            increment = Math.max(8, Math.ceil(gap * 0.15));
        }
        else {
            increment = 50;
        }
        tokenCounterRef.current = Math.min(tokenCounterRef.current + increment, currentResponseLength);
    }
    return tokenCounterRef.current;
}
// Thinking shimmer animation
export function useThinkingShimmer(time) {
    const THINKING_DELAY_MS = 3000;
    const THINKING_GLOW_PERIOD_S = 2;
    if (time < THINKING_DELAY_MS)
        return 0;
    const thinkingElapsedSec = (time - THINKING_DELAY_MS) / 1000;
    return (Math.sin((thinkingElapsedSec * Math.PI * 2) / THINKING_GLOW_PERIOD_S) + 1) / 2;
}
// Debounced callback
export function useDebouncedCallback(callback, delay) {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    return debouncedCallback;
}
