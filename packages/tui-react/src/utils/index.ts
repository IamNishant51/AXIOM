/**
 * TUI React Utilities
 * Export all utility modules
 */

// Screen buffer utilities
export {
	ScreenBuffer,
	ScreenPool,
	ScrollbackBuffer,
	createEmptyCell,
	cellsEqual,
	type Cell,
	type Position,
	type Cursor,
	type ScreenRegion,
	type DiffResult,
} from "./screen-buffer.js";

// Frame management
export {
	FrameManager,
	AnimationController,
	CursorAnimator,
	Easing,
	type FrameConfig,
	type FrameStats,
	type FrameCallback,
} from "./frame-manager.js";

// Flexbox layout
export {
	LayoutEngine,
	FlexLayout,
	calculateFlexLayout,
	type FlexStyle,
	type LayoutItem,
	type LayoutResult,
	type ContainerSize,
	type FlexDirection,
	type FlexJustify,
	type FlexAlign,
	type FlexWrap,
} from "./flex-layout.js";

// Clipboard
export {
	copyToClipboard,
	readFromClipboard,
	isClipboardAvailable,
	copyToSelection,
	type ClipboardResult,
} from "./clipboard.js";