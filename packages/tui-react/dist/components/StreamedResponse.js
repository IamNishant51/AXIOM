/**
 * StreamedResponse Component - Anti-jitter streaming output
 * Efficiently batches updates and renders content
 */
import React, { useState, useEffect, useRef, memo } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";
// Memoized static message component to prevent re-renders
const StaticMessage = memo(({ chunks, theme }) => (React.createElement(Box, { flexDirection: "column" }, chunks.map((chunk, index) => {
    if (chunk.type === "thinking") {
        return (React.createElement(Text, { key: index, color: theme.colors.textMuted, italic: true },
            "[Thinking] ",
            chunk.content));
    }
    if (chunk.type === "tool_call") {
        return (React.createElement(Text, { key: index, color: theme.colors.primary },
            "[",
            chunk.toolName || "tool",
            "...]"));
    }
    if (chunk.type === "tool_result") {
        return (React.createElement(Text, { key: index, color: theme.colors.textDim },
            "[",
            chunk.toolName || "tool",
            " done]"));
    }
    // Text content
    return (React.createElement(Text, { key: index, color: theme.colors.text }, chunk.content));
}))));
StaticMessage.displayName = "StaticMessage";
export const StreamedResponse = ({ chunks, isStreaming = false, showThinking = true, showToolCalls = true, onComplete, }) => {
    const theme = useTheme();
    const [displayedChunks, setDisplayedChunks] = useState([]);
    const [activeChunk, setActiveChunk] = useState(null);
    const lastChunkRef = useRef("");
    // Separate completed chunks from actively streaming one
    useEffect(() => {
        // Find the last complete chunks vs the currently streaming one
        if (chunks.length === 0) {
            setDisplayedChunks([]);
            setActiveChunk(null);
            return;
        }
        // If not streaming, all chunks are finalized
        if (!isStreaming) {
            setDisplayedChunks(chunks);
            setActiveChunk(null);
            onComplete?.();
            return;
        }
        // For streaming, keep all but the last as static, last one is active
        const completed = chunks.slice(0, -1);
        const active = chunks[chunks.length - 1];
        // Only update if there's a change to avoid re-renders
        const completedKey = JSON.stringify(completed.map((c) => c.content));
        if (completedKey !== lastChunkRef.current) {
            setDisplayedChunks(completed);
            lastChunkRef.current = completedKey;
        }
        setActiveChunk(active);
    }, [chunks, isStreaming, onComplete]);
    // Batch update timer to reduce re-renders during rapid streaming
    const [pendingContent, setPendingContent] = useState("");
    const flushTimeoutRef = useRef(null);
    useEffect(() => {
        if (!activeChunk)
            return;
        // For text chunks, update in batches of 50ms to reduce flicker
        if (activeChunk.type === "text") {
            if (flushTimeoutRef.current) {
                clearTimeout(flushTimeoutRef.current);
            }
            flushTimeoutRef.current = setTimeout(() => {
                setPendingContent(activeChunk.content);
            }, 50);
        }
        else {
            setPendingContent(activeChunk.content);
        }
        return () => {
            if (flushTimeoutRef.current) {
                clearTimeout(flushTimeoutRef.current);
            }
        };
    }, [activeChunk]);
    // Render completed chunks (only these re-render when finalized)
    const renderCompleted = () => {
        if (displayedChunks.length === 0)
            return null;
        return React.createElement(StaticMessage, { chunks: displayedChunks, theme: theme });
    };
    // Render active streaming chunk (this is the only component that updates during streaming)
    const renderActive = () => {
        if (!activeChunk || !isStreaming)
            return null;
        if (activeChunk.type === "thinking" && !showThinking)
            return null;
        if ((activeChunk.type === "tool_call" || activeChunk.type === "tool_result") && !showToolCalls)
            return null;
        if (activeChunk.type === "thinking") {
            return (React.createElement(Text, { color: theme.colors.textMuted, italic: true },
                "[Thinking] ",
                pendingContent || activeChunk.content));
        }
        if (activeChunk.type === "tool_call") {
            return (React.createElement(Text, { color: theme.colors.primary },
                "[",
                activeChunk.toolName || "tool",
                "...] ",
                pendingContent || ""));
        }
        if (activeChunk.type === "tool_result") {
            return (React.createElement(Text, { color: theme.colors.textDim },
                "[",
                activeChunk.toolName || "tool",
                " done] ",
                pendingContent || ""));
        }
        // Text chunk - render directly without Box wrapper to prevent jitter
        return React.createElement(Text, { color: theme.colors.text }, pendingContent || activeChunk.content);
    };
    return (React.createElement(Box, { flexDirection: "column" },
        renderCompleted(),
        renderActive()));
};
// Convenience component for complete, non-streaming content
export const StaticResponse = ({ children }) => {
    const theme = useTheme();
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Text, { color: theme.colors.text }, children)));
};
export default StreamedResponse;
