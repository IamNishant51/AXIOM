/**
 * StreamedText Component - Typing effect with no layout jitter
 * Renders text with configurable character/word-by-character delay
 */
import React, { useState, useEffect, useRef } from "react";
import { Text, Box } from "ink";
import { useTheme } from "../theme/index.js";
const SPEED_CONFIGS = {
    fast: { charDelay: 5, wordDelay: 30, chunkSize: 3 },
    normal: { charDelay: 15, wordDelay: 80, chunkSize: 2 },
    slow: { charDelay: 35, wordDelay: 150, chunkSize: 1 },
};
export const StreamedText = ({ text, speed = "normal", mode = "character", showCursor = false, onComplete, style = "plain", }) => {
    const theme = useTheme();
    const config = SPEED_CONFIGS[speed];
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const [cursorVisible, setCursorVisible] = useState(true);
    const textRef = useRef(text);
    const indexRef = useRef(0);
    const timeoutRef = useRef(null);
    // Update ref when text changes
    useEffect(() => {
        textRef.current = text;
        // Reset when text changes
        if (text !== displayedText) {
            setDisplayedText("");
            setIsComplete(false);
            indexRef.current = 0;
        }
    }, [text, displayedText]);
    // Cursor blink effect
    useEffect(() => {
        if (!showCursor || isComplete)
            return;
        const cursorInterval = setInterval(() => {
            setCursorVisible((prev) => !prev);
        }, 530); // Classic cursor blink rate
        return () => clearInterval(cursorInterval);
    }, [showCursor, isComplete]);
    // Typing effect
    useEffect(() => {
        if (isComplete || !textRef.current)
            return;
        const typeNext = () => {
            const remaining = textRef.current.slice(indexRef.current);
            if (!remaining) {
                setIsComplete(true);
                onComplete?.();
                return;
            }
            if (mode === "word") {
                // Find next word boundary
                const spaceIndex = remaining.search(/\s/);
                const nextIndex = spaceIndex === -1 ? remaining.length : spaceIndex + 1;
                const chunk = remaining.slice(0, nextIndex);
                indexRef.current += nextIndex;
                setDisplayedText((prev) => prev + chunk);
                timeoutRef.current = setTimeout(typeNext, nextIndex === remaining.length ? config.charDelay : config.wordDelay);
            }
            else {
                // Character-by-character with configurable chunk
                const chunk = remaining.slice(0, config.chunkSize);
                indexRef.current += config.chunkSize;
                setDisplayedText((prev) => prev + chunk);
                timeoutRef.current = setTimeout(typeNext, config.charDelay * config.chunkSize);
            }
        };
        timeoutRef.current = setTimeout(typeNext, config.charDelay);
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isComplete, mode, config]);
    // Direct render if complete or no streaming
    const renderContent = () => {
        if (style === "code") {
            return (React.createElement(Box, { flexDirection: "column", paddingLeft: 0 }, displayedText.split("\n").map((line, i) => (React.createElement(Text, { key: i, color: theme.colors.text }, line || " ")))));
        }
        if (style === "markdown") {
            // Simple markdown-like rendering
            const lines = displayedText.split("\n");
            return (React.createElement(Box, { flexDirection: "column" }, lines.map((line, i) => {
                // Code block detection
                if (line.startsWith("```")) {
                    return (React.createElement(Text, { key: i, color: theme.colors.textDim }, line));
                }
                // Headers
                if (line.startsWith("# ")) {
                    return (React.createElement(Text, { key: i, bold: true, color: theme.colors.text }, line.slice(2)));
                }
                if (line.startsWith("## ")) {
                    return (React.createElement(Text, { key: i, bold: true, color: theme.colors.primary }, line.slice(3)));
                }
                // Bullet points
                if (line.startsWith("- ") || line.startsWith("* ")) {
                    return (React.createElement(Box, { key: i },
                        React.createElement(Text, { color: theme.colors.accent },
                            theme.typography.bullet,
                            " "),
                        React.createElement(Text, { color: theme.colors.text }, line.slice(2))));
                }
                // Default
                return (React.createElement(Text, { key: i, color: theme.colors.text }, line || " "));
            })));
        }
        // Plain text
        return React.createElement(Text, { color: theme.colors.text }, displayedText);
    };
    return (React.createElement(Box, null,
        renderContent(),
        showCursor && !isComplete && (React.createElement(Text, { color: cursorVisible ? theme.colors.cursor : "transparent" }, "\u2588"))));
};
// Convenience component for instant text (no animation)
export const StaticText = ({ children, color, bold }) => {
    const theme = useTheme();
    return (React.createElement(Text, { bold: bold, color: color || theme.colors.text }, children));
};
export default StreamedText;
