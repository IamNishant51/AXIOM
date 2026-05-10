/**
 * Panel Component - Premium container with Unicode borders
 * Uses rounded box-drawing characters for elegant framing
 */

import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "../theme/index.js";

export interface PanelProps {
  children: React.ReactNode;
  title?: string;
  padding?: number;
  borderStyle?: "rounded" | "none";
  minHeight?: number;
  flexGrow?: number;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  title,
  padding = 1,
  borderStyle = "rounded",
  minHeight = 0,
  flexGrow = 0,
}) => {
  const theme = useTheme();
  const { borders, spacing, colors } = theme;

  if (borderStyle === "none") {
    return (
      <Box flexGrow={flexGrow} minHeight={minHeight}>
        <Box paddingLeft={padding} paddingRight={padding} paddingTop={padding}>
          {children}
        </Box>
      </Box>
    );
  }

  // Calculate dimensions for proper border rendering
  const paddingX = spacing.md;
  const paddingY = spacing.sm;

  return (
    <Box flexDirection="column" flexGrow={flexGrow} minHeight={minHeight}>
      {/* Top border */}
      <Box>
        <Text bold color={colors.border}>
          {borders.topLeft}
        </Text>
        {title && (
          <>
            <Text color={colors.textDim}>{" ".repeat(1)}</Text>
            <Text bold color={colors.text}>
              {title}
            </Text>
            <Text color={colors.textDim}>{" ".repeat(1)}</Text>
          </>
        )}
        <Text color={colors.border}>{borders.top.repeat(40)}</Text>
        <Text bold color={colors.border}>
          {borders.topRight}
        </Text>
      </Box>

      {/* Content with side borders */}
      <Box flexGrow={1}>
        <Text bold color={colors.border}>
          {borders.left}
        </Text>
        <Box flexGrow={1} paddingX={paddingX} paddingY={paddingY} flexDirection="column">
          {children}
        </Box>
        <Text bold color={colors.border}>
          {borders.right}
        </Text>
      </Box>

      {/* Bottom border */}
      <Box>
        <Text bold color={colors.border}>
          {borders.bottomLeft}
        </Text>
        <Text color={colors.border}>{borders.bottom.repeat(42)}</Text>
        <Text bold color={colors.border}>
          {borders.bottomRight}
        </Text>
      </Box>
    </Box>
  );
};

export default Panel;