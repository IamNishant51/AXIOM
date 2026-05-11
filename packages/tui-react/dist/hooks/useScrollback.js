/**
 * useScrollback - Hook for message history/scrollback management
 * Handles virtual scrolling and search within conversation
 */
import { useState, useCallback, useRef, useMemo } from "react";
export function useScrollback(options = {}) {
    const { maxItems = 1000, onSearch } = options;
    const [items, setItems] = useState([]);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
    const searchIndexRef = useRef(new Map());
    // Add new item to scrollback
    const addItem = useCallback((item) => {
        const id = `scrollback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newItem = {
            id,
            data: item,
            timestamp: Date.now(),
        };
        setItems((prev) => {
            const updated = [...prev, newItem];
            // Trim if exceeding max
            if (updated.length > maxItems) {
                return updated.slice(-maxItems);
            }
            return updated;
        });
        // Reset search index on new item
        searchIndexRef.current.clear();
        return id;
    }, [maxItems]);
    // Update existing item
    const updateItem = useCallback((id, update) => {
        setItems((prev) => prev.map((item) => item.id === id
            ? { ...item, data: { ...item.data, ...update } }
            : item));
    }, []);
    // Remove item
    const removeItem = useCallback((id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);
    // Clear all items
    const clear = useCallback(() => {
        setItems([]);
        setSearchResults([]);
        setSearchQuery("");
        searchIndexRef.current.clear();
    }, []);
    // Search within scrollback
    const search = useCallback((query) => {
        if (!query) {
            setSearchResults([]);
            return [];
        }
        // Check cache
        if (searchIndexRef.current.has(query)) {
            const cached = searchIndexRef.current.get(query);
            setSearchResults(cached);
            setCurrentSearchIndex(0);
            return cached;
        }
        // Use custom search or default
        let results;
        if (onSearch) {
            results = onSearch(query, items);
        }
        else {
            // Default search - search in all string fields
            results = items
                .map((item, index) => {
                const itemStr = JSON.stringify(item.data);
                return itemStr.toLowerCase().includes(query.toLowerCase())
                    ? index
                    : -1;
            })
                .filter((i) => i >= 0);
        }
        // Cache results
        searchIndexRef.current.set(query, results);
        setSearchResults(results);
        setCurrentSearchIndex(0);
        return results;
    }, [items, onSearch]);
    // Navigate search results
    const nextSearchResult = useCallback(() => {
        if (searchResults.length === 0)
            return;
        const nextIndex = (currentSearchIndex + 1) % searchResults.length;
        setCurrentSearchIndex(nextIndex);
        setScrollPosition(searchResults[nextIndex]);
    }, [searchResults, currentSearchIndex]);
    const prevSearchResult = useCallback(() => {
        if (searchResults.length === 0)
            return;
        const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
        setCurrentSearchIndex(prevIndex);
        setScrollPosition(searchResults[prevIndex]);
    }, [searchResults, currentSearchIndex]);
    // Get visible items based on scroll position
    const getVisibleItems = useCallback((viewportSize) => {
        const start = Math.max(0, scrollPosition - 5);
        const end = Math.min(items.length, scrollPosition + viewportSize + 5);
        return items.slice(start, end).map((item, index) => ({
            ...item,
            actualIndex: start + index,
        }));
    }, [items, scrollPosition]);
    // Scroll navigation
    const scrollUp = useCallback((amount = 1) => {
        setScrollPosition((prev) => Math.max(0, prev - amount));
    }, []);
    const scrollDown = useCallback((amount = 1) => {
        setScrollPosition((prev) => Math.min(items.length - 1, prev + amount));
    }, []);
    const scrollToTop = useCallback(() => {
        setScrollPosition(0);
    }, []);
    const scrollToBottom = useCallback(() => {
        setScrollPosition(Math.max(0, items.length - 1));
    }, []);
    const scrollToIndex = useCallback((index) => {
        setScrollPosition(Math.max(0, Math.min(items.length - 1, index)));
    }, [items.length]);
    // Computed values
    const stats = useMemo(() => ({
        totalItems: items.length,
        searchMatches: searchResults.length,
        currentMatch: searchResults.length > 0 ? currentSearchIndex + 1 : 0,
    }), [items.length, searchResults.length, currentSearchIndex]);
    return {
        // Items
        items,
        addItem,
        updateItem,
        removeItem,
        clear,
        // Search
        search,
        searchQuery,
        setSearchQuery,
        searchResults,
        currentSearchIndex,
        nextSearchResult,
        prevSearchResult,
        // Scrolling
        scrollPosition,
        scrollUp,
        scrollDown,
        scrollToTop,
        scrollToBottom,
        scrollToIndex,
        getVisibleItems,
        // Stats
        stats,
    };
}
export default useScrollback;
