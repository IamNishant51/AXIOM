/**
 * Activity Indicator Component
 * Shows current agent activity state
 */

import React from "react";
import { Box, Text } from "ink";

type ActivityKind = "thinking" | "generating" | "tool" | "idle" | "error";

interface Activity {
  kind: ActivityKind;
  tool?: string;
  target?: string;
  chars?: number;
  error?: string;
}

interface ActivityIndicatorProps {
  activity: Activity;
  compact?: boolean;
}

const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  thinking: "Thinking",
  generating: "Generating",
  tool: "Executing",
  idle: "Ready",
  error: "Error"
};

const ACTIVITY_SYMBOLS: Record<ActivityKind, string> = {
  thinking: "◯",
  generating: "◉",
  tool: "⚡",
  idle: "○",
  error: "⚠"
};

const ACTIVITY_COLORS: Record<ActivityKind, string> = {
  thinking: "cyan",
  generating: "green",
  tool: "yellow",
  idle: "gray",
  error: "red"
};

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  activity,
  compact = false
}) => {
  if (compact) {
    return (
      <Text color={ACTIVITY_COLORS[activity.kind]}>
        {ACTIVITY_SYMBOLS[activity.kind]} {ACTIVITY_LABELS[activity.kind]}
        {activity.tool && ` ${activity.tool}`}
      </Text>
    );
  }

  return (
    <Box flexDirection="row" alignItems="center">
      <Text color={ACTIVITY_COLORS[activity.kind]}>
        {ACTIVITY_SYMBOLS[activity.kind]}
      </Text>
      <Text> </Text>
      <Text bold> {ACTIVITY_LABELS[activity.kind]}</Text>

      {activity.tool && (
        <>
          <Text> </Text>
          <Text color="cyan">{activity.tool}</Text>
        </>
      )}

      {activity.target && (
        <>
          <Text dimColor>: </Text>
          <Text dimColor>
            {activity.target.length > 40 ? activity.target.slice(0, 40) + "..." : activity.target}
          </Text>
        </>
      )}

      {activity.kind === "generating" && activity.chars !== undefined && (
        <>
          <Text dimColor> (</Text>
          <Text dimColor>{activity.chars} chars)</Text>
        </>
      )}

      {activity.kind === "error" && activity.error && (
        <>
          <Text> </Text>
          <Text color="red">
            {activity.error.length > 60 ? activity.error.slice(0, 60) + "..." : activity.error}
          </Text>
        </>
      )}
    </Box>
  );
};

export default ActivityIndicator;