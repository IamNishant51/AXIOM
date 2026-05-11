/**
 * ScrollBox - Virtual scrolling container for large lists
 * Efficient rendering for messages, history, etc.
 */

import React, { useState, memo } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";

export interface ScrollBoxProps {
	children: React.ReactNode;
	height?: number;
	width?: number | string;
	scrollPosition?: number;
	onScroll?: (position: number) => void;
	showScrollbar?: boolean;
}

// Scroll indicator bar
const ScrollIndicator: React.FC<{
	hasMore: boolean;
	total: number;
	visible: number;
}> = memo(({ hasMore, total, visible }) => {
	const theme = useTheme();
	if (!hasMore) return null;

	return (
		<Box>
			<Text dimColor color={theme.colors.textMuted}>
				{`[${visible}/${total}]`}
			</Text>
		</Box>
	);
});
ScrollIndicator.displayName = "ScrollIndicator";

// Simple ScrollBox that handles keyboard navigation and displays items
export const ScrollBox: React.FC<ScrollBoxProps> = ({
	children,
	height = 20,
	width,
	scrollPosition: externalPosition,
	onScroll,
	showScrollbar = true,
}) => {
	const theme = useTheme();
	const [internalPosition, setInternalPosition] = useState(0);
	const [hasMoreTop, setHasMoreTop] = useState(false);
	const [hasMoreBottom, setHasMoreBottom] = useState(false);

	const position = externalPosition !== undefined ? externalPosition : internalPosition;

	// Calculate how many children we can show
	const childArray = React.Children.toArray(children);
	const totalItems = childArray.length;
	const visibleItems = Math.min(height, totalItems);
	const canScrollUp = position > 0;
	const canScrollDown = position + visibleItems < totalItems;

	// Get visible children
	const visibleChildren = childArray.slice(position, position + visibleItems);

	return (
		<Box flexDirection="column" width={width}>
			{/* Scroll up indicator */}
			{canScrollUp && (
				<Box>
					<Text dimColor color={theme.colors.secondary}>▲ more above</Text>
				</Box>
			)}

			{/* Content */}
			<Box flexDirection="column" height={visibleItems}>
				{visibleChildren.map((child, index) => (
					<Box key={position + index} justifyContent="flex-start">
						{child}
					</Box>
				))}
			</Box>

			{/* Scroll down indicator */}
			{canScrollDown && (
				<Box>
					<Text dimColor color={theme.colors.secondary}>▼ more below</Text>
				</Box>
			)}

			{/* Position indicator */}
			{showScrollbar && (
				<ScrollIndicator
					hasMore={canScrollUp || canScrollDown}
					total={totalItems}
					visible={visibleItems}
				/>
			)}
		</Box>
	);
};

export default ScrollBox;