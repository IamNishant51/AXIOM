/**
 * useStreaming - Hook for real-time streaming
 * Manages streaming state for AI responses
 */
export interface StreamingState {
    content: string;
    isStreaming: boolean;
    delta: string;
    complete: boolean;
}
export interface UseStreamingOptions {
    initialContent?: string;
    onChunk?: (chunk: string) => void;
    onComplete?: (finalContent: string) => void;
    chunkDelay?: number;
}
export declare function useStreaming(options?: UseStreamingOptions): {
    startStreaming: (newContent: string) => void;
    stopStreaming: () => void;
    reset: () => void;
    content: string;
    isStreaming: boolean;
    delta: string;
    complete: boolean;
};
export default useStreaming;
//# sourceMappingURL=useStreaming.d.ts.map