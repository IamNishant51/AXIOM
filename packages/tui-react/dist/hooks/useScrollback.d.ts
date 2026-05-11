/**
 * useScrollback - Hook for message history/scrollback management
 * Handles virtual scrolling and search within conversation
 */
export interface ScrollbackItem<T = any> {
    id: string;
    data: T;
    timestamp?: number;
}
export interface UseScrollbackOptions<T> {
    maxItems?: number;
    onSearch?: (query: string, items: ScrollbackItem<T>[]) => number[];
}
export declare function useScrollback<T>(options?: UseScrollbackOptions<T>): {
    items: ScrollbackItem<T>[];
    addItem: (item: T) => string;
    updateItem: (id: string, update: Partial<T>) => void;
    removeItem: (id: string) => void;
    clear: () => void;
    search: (query: string) => number[];
    searchQuery: string;
    setSearchQuery: import("react").Dispatch<import("react").SetStateAction<string>>;
    searchResults: number[];
    currentSearchIndex: number;
    nextSearchResult: () => void;
    prevSearchResult: () => void;
    scrollPosition: number;
    scrollUp: (amount?: number) => void;
    scrollDown: (amount?: number) => void;
    scrollToTop: () => void;
    scrollToBottom: () => void;
    scrollToIndex: (index: number) => void;
    getVisibleItems: (viewportSize: number) => {
        actualIndex: number;
        id: string;
        data: T;
        timestamp?: number;
    }[];
    stats: {
        totalItems: number;
        searchMatches: number;
        currentMatch: number;
    };
};
export default useScrollback;
//# sourceMappingURL=useScrollback.d.ts.map