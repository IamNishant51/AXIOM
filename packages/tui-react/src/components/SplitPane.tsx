/**
 * SplitPane - Split view with resizable panes
 * Left: Context (files, task, chat), Right: Live execution
 */

import React, { useState, useCallback, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";

export type SplitDirection = "horizontal" | "vertical";

export interface SplitPaneProps {
	children: [React.ReactNode, React.ReactNode];
	direction?: SplitDirection;
	defaultSplit?: number; // 0-100 percentage
	minSize?: number; // minimum size percentage
	maxSize?: number; // maximum size percentage
}

export const SplitPane: React.FC<SplitPaneProps> = ({
	children,
	direction = "horizontal",
	defaultSplit = 50,
	minSize = 20,
	maxSize = 80,
}) => {
	const theme = useTheme();
	const [splitPosition, setSplitPosition] = useState(defaultSplit);
	const [activePane, setActivePane] = useState<0 | 1>(1);
	const [isResizing, setIsResizing] = useState(false);

	// Tab to switch focus between panes
	useInput((input, key) => {
		if (key.tab) {
			setActivePane((prev) => (prev === 0 ? 1 : 0));
			return;
		}

		// Arrow keys to resize
		if (isResizing) {
			if (direction === "horizontal") {
				if (key.leftArrow || input === "h") {
					setSplitPosition((prev) => Math.max(minSize, prev - 2));
				} else if (key.rightArrow || input === "l") {
					setSplitPosition((prev) => Math.min(maxSize, prev + 2));
				}
			} else {
				if (key.upArrow || input === "k") {
					setSplitPosition((prev) => Math.max(minSize, prev - 2));
				} else if (key.downArrow || input === "j") {
					setSplitPosition((prev) => Math.min(maxSize, prev + 2));
				}
			}

			if (key.escape) {
				setIsResizing(false);
			}
			return;
		}

		// Start resizing with \ or |
		if (input === "\\" || input === "|") {
			setIsResizing(true);
		}
	});

	// Divider component
	const renderDivider = () => {
		const isVertical = direction === "vertical";

		if (isVertical) {
			return (
				<Box flexDirection="column" width={3}>
					{Array.from({ length: 20 }).map((_, i) => (
						<Text key={i} color={theme.colors.borderDim}>
							│
						</Text>
					))}
				</Box>
			);
		}

		// Horizontal divider
		const dividerChar = isResizing ? "█" : "─";
		return (
			<Box flexDirection="row" height={1}>
				<Text color={isResizing ? theme.colors.accent : theme.colors.borderDim}>
					{dividerChar.repeat(40)}
				</Text>
			</Box>
		);
	};

	// Pane wrapper with focus indicator
	const wrapPane = (content: React.ReactNode, paneIndex: 0 | 1) => {
		const isActive = activePane === paneIndex;

		return (
			<Box
				flexDirection="column"
				borderStyle={isActive ? "bold" : undefined}
				borderColor={isActive ? theme.colors.primary : undefined}
			>
				{isActive && (
					<Box marginBottom={1}>
						<Text bold color={theme.colors.primary}>
							{paneIndex === 0 ? "◀ Context" : "▶ Output"}
						</Text>
					</Box>
				)}
				{content}
			</Box>
		);
	};

	// Render based on direction
	if (direction === "horizontal") {
		// Left | Right
		const leftWidth = Math.round((splitPosition / 100) * 80); // Account for divider

		return (
			<Box flexDirection="row">
				<Box width={leftWidth}>
					{wrapPane(children[0], 0)}
				</Box>
				{renderDivider()}
				<Box flexGrow={1}>
					{wrapPane(children[1], 1)}
				</Box>
			</Box>
		);
	}

	// Vertical (Top | Bottom)
	const topHeight = Math.round((splitPosition / 100) * 10);

	return (
		<Box flexDirection="column">
			<Box height={topHeight}>
				{wrapPane(children[0], 0)}
			</Box>
			{renderDivider()}
			<Box flexGrow={1}>
				{wrapPane(children[1], 1)}
			</Box>
		</Box>
	);
};

// Tab container for switching between views
export interface TabItem {
	id: string;
	label: string;
	content: React.ReactNode;
}

export interface TabContainerProps {
	tabs: TabItem[];
	defaultTab?: string;
	onChange?: (tabId: string) => void;
}

export const TabContainer: React.FC<TabContainerProps> = ({
	tabs,
	defaultTab,
	onChange,
}) => {
	const theme = useTheme();
	const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

	const handleTabChange = useCallback((tabId: string) => {
		setActiveTab(tabId);
		onChange?.(tabId);
	}, [onChange]);

	// Tab navigation
	useInput((input, key) => {
		const currentIndex = tabs.findIndex((t) => t.id === activeTab);

		if (key.leftArrow || input === "h") {
			const newIndex = Math.max(0, currentIndex - 1);
			handleTabChange(tabs[newIndex].id);
		} else if (key.rightArrow || input === "l") {
			const newIndex = Math.min(tabs.length - 1, currentIndex + 1);
			handleTabChange(tabs[newIndex].id);
		}
	});

	const activeContent = tabs.find((t) => t.id === activeTab)?.content;

	return (
		<Box flexDirection="column">
			{/* Tab bar */}
			<Box flexDirection="row" marginBottom={1}>
				{tabs.map((tab) => (
					<Box key={tab.id} flexDirection="row" marginRight={2}>
						<Text
							bold={activeTab === tab.id}
							color={activeTab === tab.id ? theme.colors.primary : theme.colors.textMuted}
						>
							{activeTab === tab.id ? "▸" : " "}
						</Text>
						<Text
							bold={activeTab === tab.id}
							color={activeTab === tab.id ? theme.colors.text : theme.colors.textMuted}
						>
							{tab.label}
						</Text>
					</Box>
				))}
			</Box>

			{/* Tab content */}
			<Box flexDirection="column">
				{activeContent}
			</Box>
		</Box>
	);
};

export default SplitPane;