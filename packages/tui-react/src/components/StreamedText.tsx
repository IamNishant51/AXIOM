/**
 * StreamedText Component - Typing effect with no layout jitter
 * Renders text with configurable character/word-by-character delay
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Text, Box } from "ink";
import { useTheme } from "../theme/index.js";

export interface StreamedTextProps {
  text: string;
  speed?: "fast" | "normal" | "slow";
  mode?: "character" | "word";
  showCursor?: boolean;
  onComplete?: () => void;
  style?: "plain" | "code" | "markdown";
}

interface StreamConfig {
  charDelay: number;
  wordDelay: number;
  chunkSize: number;
}

const SPEED_CONFIGS: Record<string, StreamConfig> = {
  fast: { charDelay: 5, wordDelay: 30, chunkSize: 3 },
  normal: { charDelay: 15, wordDelay: 80, chunkSize: 2 },
  slow: { charDelay: 35, wordDelay: 150, chunkSize: 1 },
};

export const StreamedText: React.FC<StreamedTextProps> = ({
  text,
  speed = "normal",
  mode = "character",
  showCursor = false,
  onComplete,
  style = "plain",
}) => {
  const theme = useTheme();
  const config = SPEED_CONFIGS[speed];

  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  const textRef = useRef(text);
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!showCursor || isComplete) return;

    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530); // Classic cursor blink rate

    return () => clearInterval(cursorInterval);
  }, [showCursor, isComplete]);

  // Typing effect
  useEffect(() => {
    if (isComplete || !textRef.current) return;

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

        timeoutRef.current = setTimeout(
          typeNext,
          nextIndex === remaining.length ? config.charDelay : config.wordDelay
        );
      } else {
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
      return (
        <Box flexDirection="column" paddingLeft={0}>
          {displayedText.split("\n").map((line, i) => (
            <Text key={i} color={theme.colors.text}>
              {line || " "}
            </Text>
          ))}
        </Box>
      );
    }

    if (style === "markdown") {
      // Simple markdown-like rendering
      const lines = displayedText.split("\n");
      return (
        <Box flexDirection="column">
          {lines.map((line, i) => {
            // Code block detection
            if (line.startsWith("```")) {
              return (
                <Text key={i} color={theme.colors.textDim}>
                  {line}
                </Text>
              );
            }
            // Headers
            if (line.startsWith("# ")) {
              return (
                <Text key={i} bold color={theme.colors.text}>
                  {line.slice(2)}
                </Text>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <Text key={i} bold color={theme.colors.primary}>
                  {line.slice(3)}
                </Text>
              );
            }
            // Bullet points
            if (line.startsWith("- ") || line.startsWith("* ")) {
              return (
                <Box key={i}>
                  <Text color={theme.colors.accent}>{theme.typography.bullet} </Text>
                  <Text color={theme.colors.text}>{line.slice(2)}</Text>
                </Box>
              );
            }
            // Default
            return (
              <Text key={i} color={theme.colors.text}>
                {line || " "}
              </Text>
            );
          })}
        </Box>
      );
    }

    // Plain text
    return <Text color={theme.colors.text}>{displayedText}</Text>;
  };

  return (
    <Box>
      {renderContent()}
      {showCursor && !isComplete && (
        <Text color={cursorVisible ? theme.colors.cursor : "transparent"}>
          █
        </Text>
      )}
    </Box>
  );
};

// Convenience component for instant text (no animation)
export const StaticText: React.FC<{
  children: React.ReactNode;
  color?: string;
  bold?: boolean;
}> = ({ children, color, bold }) => {
  const theme = useTheme();
  return (
    <Text bold={bold} color={color || theme.colors.text}>
      {children}
    </Text>
  );
};

export default StreamedText;