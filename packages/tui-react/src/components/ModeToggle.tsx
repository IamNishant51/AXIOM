/**
 * Mode Toggle Component - Chat vs Build mode switcher
 */

import React from "react";
import { Box, Text } from "ink";

export type AgentMode = "chat" | "code";

interface ModeToggleProps {
  activeMode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ activeMode, onModeChange }) => {
  return (
    <Box flexDirection="row" alignItems="center">
      <Text
        color={activeMode === "chat" ? "white" : "gray"}
        bold={activeMode === "chat"}
      >
        {activeMode === "chat" ? "[Chat]" : " Chat "}
      </Text>
      <Text dimColor> | </Text>
      <Text
        color={activeMode === "code" ? "white" : "gray"}
        bold={activeMode === "code"}
      >
        {activeMode === "code" ? "[Build]" : " Build "}
      </Text>
    </Box>
  );
};

export default ModeToggle;