/**
 * useStreaming - Hook for real-time streaming
 * Manages streaming state for AI responses
 */
import { useState, useCallback, useRef, useEffect } from "react";
export function useStreaming(options = {}) {
    const { initialContent = "", onChunk, onComplete, chunkDelay = 20, } = options;
    const [state, setState] = useState({
        content: initialContent,
        isStreaming: false,
        delta: "",
        complete: true,
    });
    const contentRef = useRef(initialContent);
    const indexRef = useRef(initialContent.length);
    const timeoutRef = useRef(null);
    // Start streaming new content
    const startStreaming = useCallback((newContent) => {
        contentRef.current = "";
        indexRef.current = 0;
        setState({
            content: "",
            isStreaming: true,
            delta: "",
            complete: false,
        });
        const streamChunk = () => {
            const remaining = newContent.slice(indexRef.current);
            if (!remaining) {
                // Complete
                setState((prev) => ({
                    ...prev,
                    isStreaming: false,
                    complete: true,
                }));
                onComplete?.(contentRef.current);
                return;
            }
            // Variable chunk size for natural feel
            const chunkSize = remaining.length > 100 ? 8 : remaining.length > 50 ? 5 : 2;
            const chunk = remaining.slice(0, chunkSize);
            indexRef.current += chunkSize;
            contentRef.current += chunk;
            setState((prev) => ({
                ...prev,
                content: contentRef.current,
                delta: chunk,
            }));
            onChunk?.(chunk);
            // Schedule next chunk
            timeoutRef.current = setTimeout(streamChunk, chunkDelay);
        };
        // Start after small delay
        timeoutRef.current = setTimeout(streamChunk, 50);
    }, [onChunk, onComplete, chunkDelay]);
    // Stop streaming
    const stopStreaming = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setState((prev) => ({
            ...prev,
            isStreaming: false,
            complete: true,
        }));
    }, []);
    // Reset state
    const reset = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        contentRef.current = "";
        indexRef.current = 0;
        setState({
            content: "",
            isStreaming: false,
            delta: "",
            complete: true,
        });
    }, []);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    return {
        ...state,
        startStreaming,
        stopStreaming,
        reset,
    };
}
export default useStreaming;
