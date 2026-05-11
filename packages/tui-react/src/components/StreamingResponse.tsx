/**
 * StreamingResponse Component - Enhanced with OpenClaude-style animations
 * Real-time streaming text with glimmer effect, stalled detection, and token counter
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  useCallback,
} from "react";
import { Box, Text } from "ink";
import { useTheme, resolveColor, parseRGB, interpolateColor, toRGBColor, ERROR_RED } from "../theme/index.js";

export interface StreamChunk {
  type: "text" | "thinking" | "tool_call" | "tool_result" | "tool_output";
  content: string;
  toolName?: string;
  timestamp?: number;
}

export interface StreamingResponseProps {
  initialContent?: string;
  isStreaming?: boolean;
  onComplete?: () => void;
  showCursor?: boolean;
  style?: "plain" | "markdown" | "code";
  showGlimmer?: boolean;
  showStalledIndicator?: boolean;
  stalledIntensity?: number;
}

// Calculate string width (simple ASCII approximation)
function stringWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    // Full-width characters
    if (char >= "一" && char <= "鿿") {
      width += 2;
    } else if (char >= "＀" && char <= "￯") {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

// GlimmerMessage - Text with shimmer effect
export const GlimmerMessage = memo<{
  message: string;
  messageColor: string;
  shimmerColor: string;
  glimmerIndex: number;
  stalledIntensity: number;
}>(({ message, messageColor, shimmerColor, glimmerIndex, stalledIntensity }) => {
  const messageWidth = stringWidth(message);

  // Error red interpolation for stalled state
  let displayColor = messageColor;
  if (stalledIntensity > 0) {
    const baseRGB = parseRGB(messageColor);
    if (baseRGB) {
      const interpolated = interpolateColor(baseRGB, ERROR_RED, stalledIntensity);
      displayColor = toRGBColor(interpolated);
    }
  }

  // Glimmer effect - split message into before/shimmer/after
  const shimmerStart = glimmerIndex - 1;
  const shimmerEnd = glimmerIndex + 1;

  if (shimmerStart >= messageWidth || shimmerEnd < 0 || message === "") {
    return (
      <Text color={displayColor}>
        {message}
      </Text>
    );
  }

  const clampedStart = Math.max(0, shimmerStart);
  let before = "";
  let shim = "";
  let after = "";
  let colPos = 0;

  // Simple character-by-character parsing
  for (const char of message) {
    const charWidth = char >= "一" && char <= "鿿" ? 2 : 1;
    if (colPos + charWidth <= clampedStart) {
      before += char;
    } else if (colPos > shimmerEnd) {
      after += char;
    } else {
      shim += char;
    }
    colPos += charWidth;
  }

  return (
    <>
      {before && <Text color={displayColor}>{before}</Text>}
      {shim && <Text color={shimmerColor}>{shim}</Text>}
      {after && <Text color={displayColor}>{after}</Text>}
    </>
  );
});

GlimmerMessage.displayName = "GlimmerMessage";

// SpinnerGlyph - Animated spinner character
const SpinnerGlyph = memo<{
  frame: number;
  messageColor: string;
  stalledIntensity: number;
}>(({ frame, messageColor, stalledIntensity }) => {
  const theme = useTheme();
  const SPINNER_FRAMES = [
    "⠋",
    "⠙",
    "⠹",
    "⠸",
    "⠼",
    "⠴",
    "⠦",
    "⠧",
    "⠇",
    "⠏",
  ];
  const fullFrames = [...SPINNER_FRAMES, ...[...SPINNER_FRAMES].reverse()];
  const spinnerChar = fullFrames[frame % fullFrames.length];

  let displayColor = messageColor;
  if (stalledIntensity > 0) {
    const baseRGB = parseRGB(messageColor);
    if (baseRGB) {
      const interpolated = interpolateColor(baseRGB, ERROR_RED, stalledIntensity);
      displayColor = toRGBColor(interpolated);
    }
  }

  return (
    <Box flexWrap="wrap" height={1} width={2}>
      <Text color={displayColor}>{spinnerChar}</Text>
    </Box>
  );
});

SpinnerGlyph.displayName = "SpinnerGlyph";

export const StreamingResponse: React.FC<StreamingResponseProps> = ({
  initialContent = "",
  isStreaming = false,
  onComplete,
  showCursor = true,
  style = "plain",
  showGlimmer = true,
  showStalledIndicator = true,
  stalledIntensity = 0,
}) => {
  const theme = useTheme();
  const [displayedContent, setDisplayedContent] = useState(initialContent);
  const [isComplete, setIsComplete] = useState(!isStreaming);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [glimmerIndex, setGlimmerIndex] = useState(-100);
  const [time, setTime] = useState(0);

  const contentRef = useRef(initialContent);
  const indexRef = useRef(initialContent.length);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Animation frame for glimmer effect
  useEffect(() => {
    if (!isStreaming || isComplete) {
      setGlimmerIndex(-100);
      return;
    }

    const glimmerSpeed = 200;
    const messageWidth = stringWidth(displayedContent);
    const cycleLength = messageWidth + 20;

    const animate = () => {
      setTime((prev) => {
        const newTime = prev + 50;
        const position = Math.floor(newTime / glimmerSpeed);
        const index = messageWidth + 10 - (position % cycleLength);
        setGlimmerIndex(index);
        return newTime;
      });
      animationRef.current = setTimeout(animate, 50);
    };

    animationRef.current = setTimeout(animate, 50);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isStreaming, isComplete, displayedContent]);

  // Update ref when initialContent changes
  useEffect(() => {
    contentRef.current = initialContent;
    setDisplayedContent(initialContent);
    indexRef.current = initialContent.length;
    setIsComplete(!isStreaming);
  }, [initialContent, isStreaming]);

  // Cursor blink effect
  useEffect(() => {
    if (!isStreaming || isComplete) return;

    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [isStreaming, isComplete]);

  // Typing effect
  useEffect(() => {
    if (isComplete || !isStreaming) return;

    const typeNext = () => {
      const remaining = contentRef.current.slice(indexRef.current);

      if (!remaining) {
        setIsComplete(true);
        setCursorVisible(true);
        setGlimmerIndex(-100);
        onComplete?.();
        return;
      }

      // Type faster for streaming - 1-3 chars at a time
      const chunkSize =
        remaining.length > 50 ? 5 : remaining.length > 20 ? 3 : 1;
      const chunk = remaining.slice(0, chunkSize);

      indexRef.current += chunkSize;
      setDisplayedContent((prev) => prev + chunk);

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

  // Render content with glimmer effect
  const renderContent = () => {
    if (style === "markdown") {
      const lines = displayedContent.split("\n");
      return (
        <Box flexDirection="column">
          {lines.map((line, i) => (
            <Text key={i} color={theme.colors.text}>
              {showGlimmer && i === lines.length - 1 ? (
                <GlimmerMessage
                  message={line || " "}
                  messageColor={theme.colors.text}
                  shimmerColor={theme.colors.claudeShimmer}
                  glimmerIndex={glimmerIndex}
                  stalledIntensity={stalledIntensity}
                />
              ) : (
                line || " "
              )}
            </Text>
          ))}
        </Box>
      );
    }

    return showGlimmer ? (
      <GlimmerMessage
        message={displayedContent}
        messageColor={theme.colors.text}
        shimmerColor={theme.colors.claudeShimmer}
        glimmerIndex={glimmerIndex}
        stalledIntensity={stalledIntensity}
      />
    ) : (
      <Text color={theme.colors.text}>{displayedContent}</Text>
    );
  };

  return (
    <Box flexDirection="column">
      {renderContent()}
      {showCursor && isStreaming && !isComplete && (
        <Text
          color={cursorVisible ? theme.colors.cursor : "transparent"}
        >
          █
        </Text>
      )}
    </Box>
  );
};

// Streaming thinking component with shimmer effect
export const StreamingThinking: React.FC<{
  thinking: string;
  isStreaming?: boolean;
  isExpanded?: boolean;
  showShimmer?: boolean;
  thinkingIntensity?: number;
}> = ({
  thinking,
  isStreaming = false,
  isExpanded = true,
  showShimmer = true,
  thinkingIntensity = 0,
}) => {
  const theme = useTheme();

  if (!isExpanded) {
    return (
      <Box flexDirection="row" alignItems="center">
        <Text color={theme.colors.secondary}>▶</Text>
        <Text color={theme.colors.inactive}> Reasoning</Text>
      </Box>
    );
  }

  // Calculate thinking shimmer color
  let thinkingColor = theme.colors.inactive;
  if (showShimmer && thinkingIntensity > 0) {
    const fromRGB = { r: 153, g: 153, b: 153 };
    const toRGB = { r: 193, g: 193, b: 193 };
    const interpolated = interpolateColor(fromRGB, toRGB, thinkingIntensity);
    thinkingColor = toRGBColor(interpolated);
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box
        flexDirection="row"
        alignItems="center"
        borderStyle="round"
        borderColor={theme.colors.inactive}
        paddingX={1}
      >
        <Text color={theme.colors.secondary}>◉</Text>
        <Text color={theme.colors.inactive}> Reasoning</Text>
        {isStreaming && (
          <Text color={thinkingColor}> ●</Text>
        )}
      </Box>
      <Box paddingLeft={2} flexDirection="column" marginTop={1}>
        <Text color={theme.colors.inactive} italic>
          {thinking}
        </Text>
      </Box>
    </Box>
  );
};

// Enhanced spinner row with OpenClaude-style animations
export const EnhancedSpinnerRow: React.FC<{
  message: string;
  mode: "thinking" | "requesting" | "tool-use" | "responding" | "tool-input";
  isStreaming?: boolean;
  tokens?: number;
  elapsed?: string;
  thinkingText?: string;
  thinkingIntensity?: number;
  stalledIntensity?: number;
  reducedMotion?: boolean;
}> = ({
  message,
  mode = "responding",
  isStreaming = true,
  tokens = 0,
  elapsed = "",
  thinkingText = "",
  thinkingIntensity = 0,
  stalledIntensity = 0,
  reducedMotion = false,
}) => {
  const theme = useTheme();
  const [time, setTime] = useState(0);
  const [frame, setFrame] = useState(0);

  // Animation frame
  useEffect(() => {
    if (reducedMotion || !isStreaming) return;

    const animate = () => {
      setTime((prev) => prev + 50);
      setFrame((prev) => prev + 1);
    };

    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, [isStreaming, reducedMotion]);

  // Calculate glimmer
  const messageWidth = stringWidth(message);
  const glimmerSpeed = mode === "requesting" ? 50 : 200;
  const cycleLength = messageWidth + 20;
  const glimmerIndex = reducedMotion
    ? -100
    : cycleLength + 10 - (Math.floor(time / glimmerSpeed) % cycleLength);

  // Thinking shimmer
  let thinkingColor = theme.colors.inactive;
  if (thinkingIntensity > 0) {
    const fromRGB = { r: 153, g: 153, b: 153 };
    const toRGB = { r: 193, g: 193, b: 193 };
    const interpolated = interpolateColor(fromRGB, toRGB, thinkingIntensity);
    thinkingColor = toRGBColor(interpolated);
  }

  // Stalled color
  let messageColor = theme.colors.claude;
  if (stalledIntensity > 0) {
    const baseRGB = parseRGB(theme.colors.claude);
    if (baseRGB) {
      const interpolated = interpolateColor(baseRGB, ERROR_RED, stalledIntensity);
      messageColor = toRGBColor(interpolated);
    }
  }

  return (
    <Box flexDirection="row" flexWrap="wrap" alignItems="center">
      {/* Spinner */}
      {isStreaming && (
        <>
          <SpinnerGlyph
            frame={frame}
            messageColor={theme.colors.claude}
            stalledIntensity={stalledIntensity}
          />
          <Text> </Text>
        </>
      )}

      {/* Message with glimmer */}
      <Text color={messageColor}>
        {message}
      </Text>
      <Text color={theme.colors.inactive}>…</Text>

      {/* Status info */}
      {thinkingText && (
        <Text color={thinkingColor}>
          {" "}({thinkingText})
        </Text>
      )}

      {elapsed && (
        <Text dimColor>
          {" · "}{elapsed}
        </Text>
      )}

      {tokens > 0 && (
        <Box flexDirection="row">
          <Text dimColor>↓ </Text>
          <Text dimColor>{Math.round(tokens / 4)} tokens</Text>
        </Box>
      )}
    </Box>
  );
};

export default StreamingResponse;