/**
 * StatusBar - Enhanced with OpenClaude-style animations
 * Persistent status display with token counter and smooth animations
 */

import React, { useState, useEffect, useRef, memo } from "react";
import { Box, Text } from "ink";
import { useTheme, resolveColor, parseRGB, interpolateColor, toRGBColor, ERROR_RED } from "../theme/index.js";
import { useAnimationFrame, useTokenCounterAnimation } from "../utils/animation.js";

export interface StatusBarProps {
  model?: string;
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  connectionStatus?: "connected" | "disconnected" | "connecting";
  memoryLoaded?: boolean;
  memoryFiles?: string[];
  mcpServers?: string[];
  isProcessing?: boolean;
  toolName?: string;
  reducedMotion?: boolean;
  onToggleInfo?: () => void;
}

// Animated spinner glyph
const SpinnerGlyph = memo<{ reducedMotion: boolean }>(({ reducedMotion }) => {
  const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const [frame, setFrame] = useState(0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
      setTime((prev) => prev + 120);
    }, 120);

    return () => clearInterval(interval);
  }, [reducedMotion]);

  if (reducedMotion) {
    const isDim = Math.floor(time / 2000) % 2 === 1;
    return (
      <Box flexWrap="wrap" height={1} width={2}>
        <Text dimColor={isDim}>●</Text>
      </Box>
    );
  }

  return (
    <Box flexWrap="wrap" height={1} width={2}>
      <Text>{SPINNER_FRAMES[frame]}</Text>
    </Box>
  );
});

SpinnerGlyph.displayName = "SpinnerGlyph";

// Stalled indicator - pulsing when tokens stop
const StalledIndicator = memo<{
  intensity: number;
  reducedMotion: boolean;
}>(({ intensity, reducedMotion }) => {
  const theme = useTheme();

  if (intensity === 0 || reducedMotion) return null;

  // Interpolate to red
  const baseRGB = parseRGB(theme.colors.error);
  if (!baseRGB) return null;

  const interpolated = interpolateColor(baseRGB, ERROR_RED, Math.min(intensity, 1));
  const color = toRGBColor(interpolated);

  return (
    <Text color={color}> ●</Text>
  );
});

StalledIndicator.displayName = "StalledIndicator";

// Token counter with animation
const AnimatedTokenCounter = memo<{
  tokens: number;
  reducedMotion: boolean;
}>(({ tokens, reducedMotion }) => {
  const [time, setTime] = useState(0);
  const displayedTokens = useTokenCounterAnimation(tokens, reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => setTime((prev) => prev + 50), 50);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  return (
    <Text dimColor>↓ {displayedTokens} tokens</Text>
  );
});

AnimatedTokenCounter.displayName = "AnimatedTokenCounter";

// Elapsed time formatter
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  model = "minimax-m2.5-free",
  totalTokens = 0,
  inputTokens = 0,
  outputTokens = 0,
  connectionStatus = "connected",
  memoryLoaded = false,
  memoryFiles = [],
  mcpServers = [],
  isProcessing = false,
  toolName,
  reducedMotion = false,
}) => {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stalledIntensity, setStalledIntensity] = useState(0);
  const [lastTokenTime, setLastTokenTime] = useState(Date.now());

  const processingStartRef = useRef<number | null>(null);
  const lastTokenRef = useRef(totalTokens);
  const lastUpdateRef = useRef(Date.now());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Track elapsed time during processing
  useEffect(() => {
    if (isProcessing && !processingStartRef.current) {
      processingStartRef.current = Date.now();
    } else if (!isProcessing) {
      processingStartRef.current = null;
    }

    const interval = setInterval(() => {
      if (processingStartRef.current) {
        setElapsedMs(Date.now() - processingStartRef.current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // Stalled detection
  useEffect(() => {
    if (totalTokens > lastTokenRef.current) {
      lastTokenRef.current = totalTokens;
      setLastTokenTime(Date.now());
      setStalledIntensity(0);
    }

    const checkStalled = () => {
      const timeSinceLastToken = Date.now() - lastTokenTime;
      if (timeSinceLastToken > 3000 && isProcessing) {
        const intensity = Math.min((timeSinceLastToken - 3000) / 2000, 1);
        setStalledIntensity(intensity);
      }
    };

    const interval = setInterval(checkStalled, 500);
    return () => clearInterval(interval);
  }, [totalTokens, lastTokenTime, isProcessing]);

  // Connection status
  const getConnectionDisplay = () => {
    switch (connectionStatus) {
      case "connected":
        return { icon: "●", color: theme.colors.success };
      case "connecting":
        return { icon: "◐", color: theme.colors.warning };
      case "disconnected":
        return { icon: "○", color: theme.colors.error };
    }
  };

  const conn = getConnectionDisplay();

  // Render memory files
  const renderMemoryFiles = () => {
    if (memoryFiles.length === 0) return null;
    const displayFiles = memoryFiles.slice(0, 3);
    const remaining = memoryFiles.length - 3;
    return (
      <Box flexDirection="row">
        <Text color={theme.colors.inactive}>Memory: </Text>
        {displayFiles.map((file, i) => (
          <Text key={i} color={theme.colors.accent}>
            {file}
          </Text>
        ))}
        {remaining > 0 && (
          <Text color={theme.colors.inactive}> +{remaining} more</Text>
        )}
      </Box>
    );
  };

  // Render MCP servers
  const renderMcpServers = () => {
    if (mcpServers.length === 0) return null;
    return (
      <Box flexDirection="row">
        <Text color={theme.colors.inactive}>MCP: </Text>
        {mcpServers.map((server, i) => (
          <Text key={i} color={theme.colors.secondary}>
            {server}
          </Text>
        ))}
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      {/* Main status bar */}
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <Box flexDirection="row" alignItems="center">
          {/* Model */}
          <Text color={theme.colors.primary}>{model}</Text>
          <Text color={theme.colors.inactive}> | </Text>

          {/* Connection status */}
          <Text color={conn.color}>{conn.icon}</Text>
          <Text color={theme.colors.inactive}> </Text>

          {/* Processing status */}
          {isProcessing ? (
            <Box flexDirection="row" alignItems="center">
              <SpinnerGlyph reducedMotion={reducedMotion} />
              <Text color={theme.colors.inactive}> </Text>
              {toolName ? (
                <Text color={theme.colors.secondary}>{toolName}</Text>
              ) : (
                <Text color={theme.colors.inactive}>Working</Text>
              )}
              <StalledIndicator
                intensity={stalledIntensity}
                reducedMotion={reducedMotion}
              />

              {/* Elapsed time */}
              {elapsedMs > 0 && (
                <Text dimColor> · {formatDuration(elapsedMs)}</Text>
              )}

              {/* Token counter */}
              {totalTokens > 0 && (
                <AnimatedTokenCounter
                  tokens={totalTokens}
                  reducedMotion={reducedMotion}
                />
              )}
            </Box>
          ) : (
            <Text color={theme.colors.inactive}>idle</Text>
          )}
        </Box>

        <Box flexDirection="row" alignItems="center">
          {/* Memory indicator */}
          {memoryLoaded && (
            <>
              <Text color={theme.colors.accent}>◆</Text>
              <Text color={theme.colors.inactive}> Memory</Text>
              <Text color={theme.colors.inactive}> | </Text>
            </>
          )}

          {/* Time */}
          <Text color={theme.colors.inactive}>
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </Box>
      </Box>

      {/* Expanded details */}
      {showDetails && (
        <Box flexDirection="column" marginTop={1} paddingLeft={2}>
          <Box flexDirection="row">
            <Text color={theme.colors.inactive}>Tokens: </Text>
            <Text color={theme.colors.text}>{totalTokens}</Text>
            <Text color={theme.colors.inactive}> (</Text>
            <Text color={theme.colors.text}>{inputTokens}</Text>
            <Text color={theme.colors.inactive}>, </Text>
            <Text color={theme.colors.text}>{outputTokens}</Text>
            <Text color={theme.colors.inactive}>)</Text>
          </Box>
          {elapsedMs > 0 && (
            <Text color={theme.colors.inactive}>
              Duration: {formatDuration(elapsedMs)}
            </Text>
          )}
          {renderMemoryFiles()}
          {renderMcpServers()}
        </Box>
      )}

      {/* Help hint */}
      <Text dimColor color={theme.colors.subtle}>
        [S] status
      </Text>
    </Box>
  );
};

// Compact status for inline display
export const CompactStatus: React.FC<{
  processing?: boolean;
  toolName?: string;
  reducedMotion?: boolean;
}> = ({ processing = false, toolName, reducedMotion = false }) => {
  const theme = useTheme();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!processing || reducedMotion) return;
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 10);
    }, 120);
    return () => clearInterval(interval);
  }, [processing, reducedMotion]);

  if (!processing) return null;

  const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  return (
    <Box flexDirection="row" alignItems="center">
      <Text color={theme.colors.claude}>
        {reducedMotion ? "●" : SPINNER_FRAMES[frame]}
      </Text>
      <Text color={theme.colors.inactive}> </Text>
      {toolName ? (
        <Text color={theme.colors.secondary}>{toolName}</Text>
      ) : (
        <Text color={theme.colors.inactive}>Working...</Text>
      )}
    </Box>
  );
};

export default StatusBar;