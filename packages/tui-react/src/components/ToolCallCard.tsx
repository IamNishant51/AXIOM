/**
 * Tool Call Card Component
 * Shows tool execution status with results
 */

import React from "react";
import { Box, Text } from "ink";

interface ToolCall {
  id: string;
  name: string;
  args?: Record<string, unknown>;
  result?: string;
  error?: string;
  running?: boolean;
}

interface ToolCallCardProps {
  toolCall: ToolCall;
  compact?: boolean;
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolCall, compact = false }) => {
  if (compact) {
    return (
      <Box flexDirection="row" alignItems="center">
        {toolCall.running ? (
          <Text color="yellow">⚡</Text>
        ) : toolCall.error ? (
          <Text color="red">✕</Text>
        ) : (
          <Text color="green">✓</Text>
        )}
        <Text> </Text>
        <Text bold color="cyan">{toolCall.name}</Text>
        {toolCall.result && (
          <Text dimColor>
            {" "}({(toolCall.result as string).length} chars)
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={toolCall.error ? "red" : toolCall.running ? "yellow" : "gray"}
      paddingX={1}
      paddingY={0}
      marginY={0}
    >
      <Box flexDirection="row" alignItems="center">
        {toolCall.running ? (
          <Text color="yellow">⚡</Text>
        ) : toolCall.error ? (
          <Text color="red">✕</Text>
        ) : (
          <Text color="green">✓</Text>
        )}
        <Text> </Text>
        <Text bold color="cyan">{toolCall.name}</Text>
        {toolCall.args && (
          <Text dimColor>
            {" "}{formatArgsSummary(toolCall.args)}
          </Text>
        )}
      </Box>

      {toolCall.result && !toolCall.error && (
        <Box paddingLeft={2} marginTop={0}>
          <Text dimColor>
            {toolCall.result.length > 200 ? toolCall.result.slice(0, 200) + "..." : toolCall.result}
          </Text>
        </Box>
      )}

      {toolCall.error && (
        <Box paddingLeft={2} marginTop={0}>
          <Text color="red">
            {toolCall.error.length > 200 ? toolCall.error.slice(0, 200) + "..." : toolCall.error}
          </Text>
        </Box>
      )}
    </Box>
  );
};

function formatArgsSummary(args: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(args)) {
    if (key === "content") {
      parts.push("content: " + (typeof value === "string" ? `${value.length} chars` : String(value)));
    } else if (key === "path") {
      parts.push(String(value));
    } else if (key === "command") {
      const cmd = String(value);
      parts.push(cmd.length > 40 ? cmd.slice(0, 40) + "..." : cmd);
    } else {
      const v = String(value);
      parts.push(`${key}: ${v.length > 30 ? v.slice(0, 30) + "..." : v}`);
    }
  }
  return parts.join(" · ");
}

interface ToolCallListProps {
  toolCalls: ToolCall[];
  compact?: boolean;
}

export const ToolCallList: React.FC<ToolCallListProps> = ({ toolCalls, compact = false }) => {
  if (toolCalls.length === 0) return null;

  return (
    <Box flexDirection="column" marginY={0}>
      {toolCalls.map((tc) => (
        <ToolCallCard key={tc.id} toolCall={tc} compact={compact} />
      ))}
    </Box>
  );
};

export default ToolCallCard;