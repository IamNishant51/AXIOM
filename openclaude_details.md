# OpenClaude UI/UX Detailed Analysis

This document details the UI/UX patterns, animations, and styling from OpenClaude that should be implemented in Axiom CLI.

---

## 1. Theme System

### Color Palette (Dark Theme)

```typescript
const darkTheme: Theme = {
  // Primary brand colors
  claude: 'rgb(215,119,87)',           // Claude orange (primary)
  claudeShimmer: 'rgb(235,159,127)',   // Lighter for shimmer effect
  claudeBlue_FOR_SYSTEM_SPINNER: 'rgb(147,165,255)',
  claudeBlueShimmer_FOR_SYSTEM_SPINNER: 'rgb(177,195,255)',

  // UI Colors
  autoAccept: 'rgb(175,135,255)',      // Electric violet
  permission: 'rgb(177,185,249)',      // Light blue-purple
  permissionShimmer: 'rgb(207,215,255)',
  planMode: 'rgb(72,150,140)',         // Muted sage green
  ide: 'rgb(71,130,200)',               // Muted blue
  promptBorder: 'rgb(136,136,136)',
  promptBorderShimmer: 'rgb(166,166,166)',

  // Text colors
  text: 'rgb(255,255,255)',            // White
  inverseText: 'rgb(0,0,0)',           // Black
  inactive: 'rgb(153,153,153)',        // Light gray
  inactiveShimmer: 'rgb(193,193,193)',
  subtle: 'rgb(80,80,80)',             // Dark gray

  // Semantic colors
  success: 'rgb(78,186,101)',          // Bright green
  error: 'rgb(255,107,128)',           // Bright red
  warning: 'rgb(255,193,7)',           // Bright amber
  merged: 'rgb(175,135,255)',          // Electric violet

  // Shimmer variants for animations
  warningShimmer: 'rgb(255,223,57)',

  // Diff colors
  diffAdded: 'rgb(34,92,43)',
  diffRemoved: 'rgb(122,41,54)',
  diffAddedDimmed: 'rgb(71,88,74)',
  diffRemovedDimmed: 'rgb(105,72,77)',
  diffAddedWord: 'rgb(56,166,96)',
  diffRemovedWord: 'rgb(179,89,107)',

  // Background colors
  background: 'rgb(0,204,204)',
  userMessageBackground: 'rgb(55,55,55)',
  userMessageBackgroundHover: 'rgb(70,70,70)',
  messageActionsBackground: 'rgb(44,50,62)',
  bashMessageBackgroundColor: 'rgb(65,60,65)',
  memoryBackgroundColor: 'rgb(55,65,70)',

  // Subagent colors
  red_FOR_SUBAGENTS_ONLY: 'rgb(220,38,38)',
  blue_FOR_SUBAGENTS_ONLY: 'rgb(37,99,235)',
  green_FOR_SUBAGENTS_ONLY: 'rgb(22,163,74)',
  yellow_FOR_SUBAGENTS_ONLY: 'rgb(202,138,4)',
  purple_FOR_SUBAGENTS_ONLY: 'rgb(147,51,234)',
  orange_FOR_SUBAGENTS_ONLY: 'rgb(234,88,12)',
  pink_FOR_SUBAGENTS_ONLY: 'rgb(219,39,119)',
  cyan_FOR_SUBAGENTS_ONLY: 'rgb(8,145,178)',
}
```

### Shimmer Colors Pattern

Each primary color has a corresponding "shimmer" variant that is lighter. Used for:
- Glimmer animation effect on messages
- Loading states
- Visual interest in idle states

### Theme Resolution System

```typescript
// Colors can be theme keys or raw colors
type ThemedColorProps = {
  borderColor?: keyof Theme | Color;
  backgroundColor?: keyof Theme | Color;
};

// Resolution happens at render time
function resolveColor(color: keyof Theme | Color | undefined, theme: Theme): Color | undefined {
  if (!color) return undefined;
  if (color.startsWith('rgb(') || color.startsWith('#') || color.startsWith('ansi256(') || color.startsWith('ansi:')) {
    return color as Color;
  }
  return theme[color as keyof Theme] as Color;
}
```

---

## 2. Spinner System

### SpinnerAnimationRow

The main animated spinner component with multiple features:

#### Core Features:
- **50ms animation frame** - high frequency updates for smooth animation
- **Token counter animation** - smooth incrementing token display
- **Stalled detection** - turns red after 3 seconds of no new tokens
- **Thinking status** - shows "(thinking)" or "(thought for Xs)" with shimmer
- **Verb rotation** - random verbs like "Reading", "Writing", "Thinking"
- **Glismmer effect** - light sweep across message text

#### Props:
```typescript
interface SpinnerAnimationRowProps {
  mode: SpinnerMode;              // 'thinking' | 'requesting' | 'tool-use' | 'responding' | 'tool-input'
  reducedMotion: boolean;
  hasActiveTools: boolean;
  responseLengthRef: RefObject<number>;

  // Message display
  message: string;
  messageColor: keyof Theme;
  shimmerColor: keyof Theme;
  overrideColor?: keyof Theme | null;

  // Timer refs
  loadingStartTimeRef: RefObject<number>;
  totalPausedMsRef: RefObject<number>;
  pauseStartTimeRef: RefObject<number | null>;

  // Display flags
  spinnerSuffix?: string | null;
  verbose: boolean;
  columns: number;

  // Teammate support
  hasRunningTeammates: boolean;
  teammateTokens: number;
  foregroundedTeammate: InProcessTeammateTaskState | undefined;
  leaderIsIdle?: boolean;

  // Thinking
  thinkingStatus: 'thinking' | number | null;
  effortSuffix: string;
}
```

#### Animation Details:

**Token Counter Animation:**
```typescript
// Smooth increment driven by 50ms clock
if (gap < 70) increment = 3;
else if (gap < 200) increment = Math.max(8, Math.ceil(gap * 0.15));
else increment = 50;
tokenCounterRef.current = Math.min(tokenCounterRef.current + increment, currentResponseLength);
```

**Stalled Animation:**
```typescript
// Starts showing red after 3 seconds of no new tokens
const isStalled = timeSinceLastToken > 3000 && !hasActiveTools;
const intensity = isStalled ? Math.min((timeSinceLastToken - 3000) / 2000, 1) : 0;

// Smooth transition with 50ms ticks
if (dt >= 50) {
  const steps = Math.floor(dt / 50);
  current += diff * 0.1;  // 10% lerp per tick
}
```

**Glimmer Effect:**
```typescript
const glimmerSpeed = mode === 'requesting' ? 50 : 200;
const glimmerMessageWidth = stringWidth(message);
const cycleLength = glimmerMessageWidth + 20;
const glimmerIndex = isStalled ? -100 :
  mode === 'requesting'
    ? cyclePosition % cycleLength - 10  // forward sweep
    : glimmerMessageWidth + 10 - cyclePosition % cycleLength;  // backward sweep
```

**Thinking Shimmer:**
```typescript
const THINKING_GLOW_PERIOD_S = 2;
const thinkingOpacity = (sin(elapsedSec * PI * 2 / GLOW_PERIOD) + 1) / 2;
```

### SpinnerGlyph

Animated character that rotates through frames:
```typescript
const SPINNER_FRAMES = [...DEFAULT_CHARACTERS, ...[...DEFAULT_CHARACTERS].reverse()];
// Default characters: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

// Frame calculation
const frame = Math.floor(time / 120) % SPINNER_FRAMES.length;
```

### Reduced Motion Support

```typescript
// Shows static ● character with 2-second dim cycle
const isDim = Math.floor(time / (REDUCED_MOTION_CYCLE_MS / 2)) % 2 === 1;
// 1 second visible, 1 second dim
```

---

## 3. GlimmerMessage Component

Text display with shimmer/sweep effect:

### Key Implementation:

```typescript
interface Props {
  message: string;
  mode: SpinnerMode;
  messageColor: keyof Theme;
  glimmerIndex: number;
  flashOpacity: number;
  shimmerColor: keyof Theme;
  stalledIntensity?: number;
}

// Grapheme segmentation for proper Unicode handling
import { getGraphemeSegmenter } from '../../utils/intl.js';
segments = [...getGraphemeSegmenter().segment(message)]
  .map(({ segment }) => ({ segment, width: stringWidth(segment) }));

// Three-part rendering: [before][shimmer][after]
const shimmerStart = glimmerIndex - 1;
const shimmerEnd = glimmerIndex + 1;
// Each part rendered with appropriate color
```

### Color Interpolation

```typescript
// Interpolate between two RGB colors based on intensity
function interpolateColor(from: RGB, to: RGB, intensity: number): RGB {
  return {
    r: from.r + (to.r - from.r) * intensity,
    g: from.g + (to.g - from.g) * intensity,
    b: from.b + (to.b - from.b) * intensity
  };
}

// Error red color
const ERROR_RED = { r: 171, g: 43, b: 63 };
```

---

## 4. StatusLine Component

Customizable status line that runs a command to generate output:

### Command Execution:

```typescript
interface StatusLineCommandInput {
  session_name?: string;
  model: { id: string; display_name: string };
  workspace: { current_dir: string; project_dir: string; added_dirs: string[] };
  version: string;
  output_style: { name: string };
  cost: {
    total_cost_usd: number;
    total_duration_ms: number;
    total_api_duration_ms: number;
    total_lines_added: number;
    total_lines_removed: number;
  };
  context_window: {
    total_input_tokens: number;
    total_output_tokens: number;
    context_window_size: number;
    current_usage: number;
    used_percentage: number;
    remaining_percentage: number;
  };
  // ... vim, agent, remote, worktree, rate_limits
}

// Debounced execution (300ms)
const scheduleUpdate = useCallback(() => {
  debounceTimerRef.current = setTimeout(doUpdate, 300);
}, [doUpdate]);
```

---

## 5. LogoV2 Component

The branding mascot "Clawd" with multiple poses:

### Clawd Anatomy:

```typescript
type ClawdPose = 'default' | 'arms-up' | 'look-left' | 'look-right';

const POSES: Record<ClawdPose, Segments> = {
  default: {
    r1L: ' ╭',
    r1E: '◌ ◌ ',   // Eyes
    r1R: '╮',
    r2L: ' ┆',
    r2R: '┆ '
  },
  // ... other poses
};

// ASCII Art Layout:
//  ╭◌ ◌ ╮
//  ┆ OC  ┆
//    ╰─◠─╯
```

### Layout Modes:

```typescript
type LayoutMode = 'compact' | 'full';

// Compact: single box with basic info
// Full: two-column layout with feeds (activity, whats new, onboarding)
```

---

## 6. Message System

### MessageRow Component

Handles rendering of individual messages with:
- Thinking block collapsing
- Tool use grouping
- Progress indicators
- Animation states

### Message Types:

```typescript
type RenderableMessage =
  | { type: 'user'; message: Message; isMeta?: boolean }
  | { type: 'assistant'; message: Message }
  | { type: 'grouped_tool_use'; messages: Message[]; toolName: string }
  | { type: 'collapsed_read_search'; messages: Message[]; displayMessage: string }
  | { type: 'system'; subtype: string; message?: Message }
```

### Virtual Scrolling

- **MAX_MESSAGES_WITHOUT_VIRTUALIZATION** = 200 (safety cap)
- **MAX_MESSAGES_TO_SHOW_IN_TRANSCRIPT_MODE** = 30
- UUID-based slicing to prevent content shifts on compaction

---

## 7. TextInput / VimTextInput

### Vim Mode Implementation

```typescript
type VimMode = 'INSERT' | 'VISUAL' | 'NORMAL';

// Key bindings:
// i - INSERT mode
// Escape - NORMAL mode
// h/j/k/l - navigation
// w/b - word movement
// 0/$ - line start/end
// dw - delete word
// dd - delete line
// :w - save and submit
```

### Input Features

- **History navigation** with ↑/↓
- **Search mode** with /
- **At-mention completion** for team
- **Slash commands** with palette
- **Paste handling** for images and text

---

## 8. Animation Hooks

### useAnimationFrame

```typescript
// Returns [ref, time] where time increments every 50ms
// When reducedMotion is enabled, returns null ref
// Allows smooth animations tied to terminal focus
```

### useStalledAnimation

```typescript
interface StalledState {
  isStalled: boolean;
  stalledIntensity: number;  // 0 to 1
}

// Detects when tokens stop flowing
// Intensity increases over 2 seconds after stall detection
// Smooth lerping for visual transition
```

### useShimmerAnimation

Used for text shimmer effects.

---

## 9. React Compiler Patterns

OpenClaude uses React Compiler for performance optimization:

```typescript
// Caching pattern with _c() compiler
function Component(t0) {
  const $ = _c(75);  // 75 slots for caching
  // Cache pattern:
  let t1;
  if ($[0] !== someValue) {
    t1 = computeSomething();
    $[0] = someValue;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
}
```

---

## 10. Key Visual Patterns

### Box Drawing Characters

```typescript
// For tables and borders
┌─┬─┐
│ │ │
├─┼─┤
└─┴─┘

// For dividers
────────────  // dimColor
═ ─ . ✗ ●    // various states
```

### Color Application

```typescript
// Role indicators
<Text bold color={isUser ? theme.primary : theme.accent}>
  {isUser ? '❯' : '○'}
</Text>

// Tool status
<Text dimColor>↓ {tokenCount} tokens</Text>
<Text dimColor>⏱ {elapsed}</Text>

// Thinking
<Box borderStyle="round" borderColor="inactive">
  <Text italic dimColor>{thinkingContent}</Text>
</Box>
```

### Spinner Modes Visual

```typescript
type SpinnerMode =
  | 'thinking'     // Purple dot, shimmer message
  | 'requesting'   // ↑ icon, forward shimmer
  | 'tool-use'     // ↓ icon, pulsing color
  | 'responding'   // ↓ icon, steady
  | 'tool-input';  // ↓ icon, editing state
```

---

## 11. Performance Considerations

### Rendering Optimizations

1. **OffscreenFreeze** - Caches DOM subtree for unchanged components
2. **memo()** on stable components
3. **useMemo()** for expensive computations in hot paths
4. **Refs for mutable state** - avoids re-renders
5. **Debounced status line** - 300ms debounce
6. **Virtual scrolling** - prevents DOM bloat

### Animation Performance

```typescript
// 50ms clock shared across components (vs separate timers)
// Reduces re-renders from ~20/second to ~1/second for non-animated content
// requestAnimationFrame equivalent: useAnimationFrame(50)
```

---

## 12. Accessibility

### Reduced Motion

```typescript
interface Settings {
  prefersReducedMotion?: boolean;
}

// When enabled:
// - Spinner shows static ● (dimming every 2s)
// - Glimmer effects disabled
// - All transitions instant
```

### Color Accessibility

- Daltonized themes for color-blind users
- High contrast ratios in both themes
- Shimmer uses lightness variation, not just hue

---

## 13. Implementation Notes for Axiom

### Priority Order

1. **Theme System** - Foundation for all visual elements
2. **Spinner Animation** - Core loading experience
3. **GlimmerMessage** - Text display with effects
4. **StatusLine** - Bottom status bar
5. **Message System** - Chat interface
6. **Logo/Mascot** - Branding element

### Key Differences from Current Implementation

1. **Animation frame rate**: OpenClaude uses 50ms, current uses 120ms
2. **Stalled detection**: OpenClaude has smooth transition to red
3. **Glismmer effect**: Character-by-character shimmer vs simple text
4. **Token counter**: Animated smooth increment vs static
5. **StatusLine**: Command-based rendering vs hardcoded
6. **Theme resolution**: Runtime resolution with caching
7. **React Compiler**: Uses compiler for optimizations

### Recommended Changes

1. Update `useAnimationFrame` to support 50ms interval
2. Add `stalledIntensity` state to spinner components
3. Implement `GlimmerMessage` with proper grapheme segmentation
4. Add shimmer color variants to theme
5. Create `StatusLine` with configurable command
6. Add `useStalledAnimation` hook
7. Update StatusBar to show tokens/elapsed with animation