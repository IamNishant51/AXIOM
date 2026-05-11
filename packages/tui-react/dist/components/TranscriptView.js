/**
 * TranscriptView - Scrollable message history with search
 * Like Claude Code's transcript mode (Ctrl+O)
 */
import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";
// Virtualized message list - only renders visible messages
export const TranscriptView = ({ messages, onExit, }) => {
    const theme = useTheme();
    const [scrollPosition, setScrollPosition] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMode, setSearchMode] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
    const containerHeight = 20; // Approximate visible lines
    const visibleStart = Math.max(0, scrollPosition - 5);
    const visibleEnd = Math.min(messages.length, scrollPosition + containerHeight + 5);
    const visibleMessages = messages.slice(visibleStart, visibleEnd);
    // Search functionality
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }
        const results = [];
        const lowerQuery = searchQuery.toLowerCase();
        messages.forEach((msg, index) => {
            if (msg.content.toLowerCase().includes(lowerQuery)) {
                results.push(index);
            }
        });
        setSearchResults(results);
        setCurrentSearchIndex(0);
    }, [searchQuery, messages]);
    // Keyboard navigation
    useInput((input, key) => {
        if (searchMode) {
            // Search mode controls
            if (key.escape) {
                setSearchMode(false);
                setSearchQuery("");
            }
            else if (key.return) {
                // Next search result
                if (searchResults.length > 0) {
                    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
                    setCurrentSearchIndex(nextIndex);
                    setScrollPosition(searchResults[nextIndex]);
                }
            }
            else if (input === "n") {
                // Next result (n key)
                if (searchResults.length > 0) {
                    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
                    setCurrentSearchIndex(nextIndex);
                    setScrollPosition(searchResults[nextIndex]);
                }
            }
            else if (input === "N" || input === "p") {
                // Previous result (shift+n or p)
                if (searchResults.length > 0) {
                    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
                    setCurrentSearchIndex(prevIndex);
                    setScrollPosition(searchResults[prevIndex]);
                }
            }
            else if (key.backspace) {
                setSearchQuery((prev) => prev.slice(0, -1));
            }
            else if (input && input.length === 1) {
                setSearchQuery((prev) => prev + input);
            }
            return;
        }
        // Navigation mode
        if (key.escape && onExit) {
            onExit();
        }
        else if (input === "/") {
            setSearchMode(true);
            setSearchQuery("");
        }
        else if (key.upArrow || input === "k") {
            // Scroll up
            setScrollPosition((prev) => Math.max(0, prev - 1));
        }
        else if (key.downArrow || input === "j") {
            // Scroll down
            setScrollPosition((prev) => Math.min(messages.length - 1, prev + 1));
        }
        else if (key.pageUp || input === "u") {
            // Half page up
            setScrollPosition((prev) => Math.max(0, prev - 10));
        }
        else if (key.pageDown || input === "d") {
            // Half page down
            setScrollPosition((prev) => Math.min(messages.length - 1, prev + 10));
        }
        else if (input === "g") {
            // Go to top
            setScrollPosition(0);
        }
        else if (input === "G") {
            // Go to bottom
            setScrollPosition(messages.length - 1);
        }
    });
    // Render a single message
    const renderMessage = (msg, index) => {
        const isSearchResult = searchResults.includes(index);
        const isCurrentResult = searchResults[currentSearchIndex] === index;
        return (React.createElement(Box, { key: msg.id, flexDirection: "column", marginBottom: 1, borderStyle: isCurrentResult ? "bold" : undefined, borderColor: isCurrentResult ? theme.colors.primary : undefined },
            React.createElement(Box, { flexDirection: "row" },
                React.createElement(Text, { bold: true, color: msg.role === "user" ? theme.colors.primary : theme.colors.accent }, msg.role === "user" ? "❯" : "○"),
                React.createElement(Text, { color: theme.colors.textMuted }, " "),
                React.createElement(Text, { bold: true, color: isSearchResult ? theme.colors.accent : theme.colors.textDim }, msg.role === "user" ? "You" : "Axiom"),
                msg.timestamp && (React.createElement(Text, { color: theme.colors.textMuted },
                    " ",
                    "[",
                    new Date(msg.timestamp).toLocaleTimeString(),
                    "]")),
                isSearchResult && (React.createElement(Text, { color: theme.colors.accent },
                    " (match ",
                    searchResults.indexOf(index) + 1,
                    "/",
                    searchResults.length,
                    ")"))),
            React.createElement(Box, { paddingLeft: 2, flexDirection: "column" },
                React.createElement(Text, { color: theme.colors.textDim },
                    msg.content.slice(0, 200),
                    msg.content.length > 200 ? "..." : ""))));
    };
    return (React.createElement(Box, { flexDirection: "column", height: "100%" },
        React.createElement(Box, { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: theme.colors.primary }, "Transcript"),
            React.createElement(Text, { color: theme.colors.textMuted }, searchMode ? (React.createElement(React.Fragment, null,
                "/",
                searchQuery,
                searchResults.length > 0 && ` (${currentSearchIndex + 1}/${searchResults.length})`)) : ("[/ search, j/k scroll, g/G top/bottom]"))),
        React.createElement(Box, { flexDirection: "column", overflow: "hidden" }, visibleMessages.map((msg, i) => renderMessage(msg, visibleStart + i))),
        React.createElement(Box, { flexDirection: "row", marginTop: 1 },
            React.createElement(Text, { dimColor: true, color: theme.colors.textMuted },
                "Position: ",
                scrollPosition + 1,
                "/",
                messages.length),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "[\u2191\u2193 scroll, Esc exit]"))));
};
export default TranscriptView;
