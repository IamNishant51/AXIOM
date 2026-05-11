/**
 * StreamingResponse Component - Real-time streaming text
 * Character-by-character streaming with no layout jitter
 */
import React, { useState, useEffect, useRef, memo } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";
// Memoized to prevent re-renders
const StreamedContent = memo(({ content, style, theme }) => {
    if (style === "markdown") {
        const lines = content.split("\n");
        return (React.createElement(Box, { flexDirection: "column" }, lines.map((line, i) => (React.createElement(Text, { key: i, color: theme.colors.text }, line || " ")))));
    }
    return React.createElement(Text, { color: theme.colors.text }, content);
});
StreamedContent.displayName = "StreamedContent";
export const StreamingResponse = ({ initialContent = "", isStreaming = false, onComplete, showCursor = true, style = "plain", }) => {
    const theme = useTheme();
    const [displayedContent, setDisplayedContent] = useState(initialContent);
    const [isComplete, setIsComplete] = useState(!isStreaming);
    const [cursorVisible, setCursorVisible] = useState(true);
    const contentRef = useRef(initialContent);
    const indexRef = useRef(initialContent.length);
    const timeoutRef = useRef(null);
    // Update ref when initialContent changes
    useEffect(() => {
        contentRef.current = initialContent;
        setDisplayedContent(initialContent);
        indexRef.current = initialContent.length;
        setIsComplete(!isStreaming);
    }, [initialContent, isStreaming]);
    // Cursor blink effect
    useEffect(() => {
        if (!isStreaming || isComplete)
            return;
        const interval = setInterval(() => {
            setCursorVisible((prev) => !prev);
        }, 530);
        return () => clearInterval(interval);
    }, [isStreaming, isComplete]);
    // Typing effect
    useEffect(() => {
        if (isComplete || !isStreaming)
            return;
        const typeNext = () => {
            const remaining = contentRef.current.slice(indexRef.current);
            if (!remaining) {
                setIsComplete(true);
                setCursorVisible(true);
                onComplete?.();
                return;
            }
            // Type faster for streaming - 1-3 chars at a time for smooth but fast feel
            const chunkSize = remaining.length > 50 ? 5 : remaining.length > 20 ? 3 : 1;
            const chunk = remaining.slice(0, chunkSize);
            indexRef.current += chunkSize;
            setDisplayedContent((prev) => prev + chunk);
            // Variable speed based on content
            const delay = chunkSize * 8;
            timeoutRef.current = setTimeout(typeNext, delay);
        };
        timeoutRef.current = setTimeout(typeNext, 50);
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isComplete, isStreaming, onComplete]);
    // If not streaming and has content, render immediately
    const renderContent = () => {
        if (!isStreaming && displayedContent) {
            return React.createElement(StreamedContent, { content: displayedContent, style: style, theme: theme });
        }
        // Streaming mode
        return React.createElement(StreamedContent, { content: displayedContent, style: style, theme: theme });
    };
    return (React.createElement(Box, { flexDirection: "column" },
        renderContent(),
        showCursor && isStreaming && !isComplete && (React.createElement(Text, { color: cursorVisible ? theme.colors.cursor : "transparent" }, "\u2588"))));
};
// Streaming thinking component with distinctive styling
export const StreamingThinking = ({ thinking, isStreaming = false, isExpanded = true }) => {
    const theme = useTheme();
    if (!isExpanded) {
        return (React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { color: theme.colors.secondary }, "\u25B6"),
            React.createElement(Text, { color: theme.colors.textMuted }, " Reasoning")));
    }
    return (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
        React.createElement(Box, { flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { color: theme.colors.secondary }, "\u25BC"),
            React.createElement(Text, { color: theme.colors.textMuted }, " Reasoning"),
            isStreaming && (React.createElement(Text, { color: theme.colors.textMuted }, " "))),
        React.createElement(Box, { paddingLeft: 2, flexDirection: "column", marginTop: 1 },
            React.createElement(Text, { color: theme.colors.textDim, italic: true }, thinking))));
};
export default StreamingResponse;
