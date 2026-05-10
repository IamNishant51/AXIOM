/**
 * Demo App - Complete showcase of premium TUI components
 * Run with: npx tsx src/Demo.tsx
 */

import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { setTheme, useTheme, defaultTheme, lightTheme } from "./theme/index.js";
import {
  Panel,
  SmoothSpinner,
  StreamedText,
  InteractiveMenu,
  Divider,
  Badge,
  Progress,
  Spacer,
  Cursor,
} from "./components/index.js";

// Main demo app
export const Demo: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [streamedMessage, setStreamedMessage] = useState("");
  const [menuIndex, setMenuIndex] = useState(0);

  const tabs = ["Welcome", "Components", "Interactive"];

  // Handle tab navigation
  useInput((input, key) => {
    if (key.leftArrow || input === "h") {
      setActiveTab((prev) => (prev > 0 ? prev - 1 : tabs.length - 1));
    }
    if (key.rightArrow || input === "l") {
      setActiveTab((prev) => (prev < tabs.length - 1 ? prev + 1 : 0));
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box flexDirection="row" justifyContent="center" marginBottom={1}>
        <Text bold color={theme.colors.primary}>
          ╔═══════════════════════════════════════════════════╗
        </Text>
      </Box>
      <Box flexDirection="row" justifyContent="center">
        <Text bold color={theme.colors.primary}>
          ║          Premium TUI React Demo              ║
        </Text>
      </Box>
      <Box flexDirection="row" justifyContent="center" marginBottom={1}>
        <Text bold color={theme.colors.primary}>
          ╚═══════════════════════════════════════════════════╝
        </Text>
      </Box>

      {/* Tab bar */}
      <Box flexDirection="row" marginBottom={1}>
        {tabs.map((tab, i) => (
          <Box key={i} marginRight={2}>
            <Text
              bold={activeTab === i}
              color={activeTab === i ? theme.colors.accent : theme.colors.textDim}
            >
              {activeTab === i ? `❯ ${tab}` : `  ${tab}`}
            </Text>
          </Box>
        ))}
        <Text color={theme.colors.textMuted}> [h/l or ←/→ to switch]</Text>
      </Box>

      <Divider />

      {/* Content based on active tab */}
      {activeTab === 0 && <WelcomeTab />}
      {activeTab === 1 && <ComponentsTab />}
      {activeTab === 2 && (
        <InteractiveTab selectedIndex={menuIndex} onSelect={(i) => setMenuIndex(i)} />
      )}

      <Spacer size={1} />
      <Divider />
      <Text color={theme.colors.textMuted}>
        Press q or Ctrl+C to exit
      </Text>
    </Box>
  );
};

// Welcome tab content
const WelcomeTab: React.FC = () => {
  const theme = useTheme();

  return (
    <Box flexDirection="column" paddingY={1}>
      <Text bold color={theme.colors.text}>
        Welcome to Premium TUI React
      </Text>
      <Spacer size={1} />
      <Text color={theme.colors.textDim}>
        A collection of premium, minimalist terminal UI components
      </Text>
      <Text color={theme.colors.textDim}>
        built with React and Ink for Node.js applications.
      </Text>
      <Spacer size={2} />

      <Text color={theme.colors.text}>
        Features:
      </Text>
      <Text color={theme.colors.textDim}>  • Unicode rounded borders</Text>
      <Text color={theme.colors.textDim}>  • Smooth 60fps animations</Text>
      <Text color={theme.colors.textDim}>  • Streaming text with typing effects</Text>
      <Text color={theme.colors.textDim}>  • Keyboard-driven interactive menus</Text>
      <Text color={theme.colors.textDim}>  • Flexible layout system</Text>
      <Text color={theme.colors.textDim}>  • Easy-to-swap theming</Text>
      <Spacer size={2} />

      <Panel title="Getting Started">
        <Text color={theme.colors.text}>
          {"Install: npm install @axiom/tui-react"}
        </Text>
        <Text color={theme.colors.textDim}>
          {"Import: Panel, SmoothSpinner from '@axiom/tui-react'"}
        </Text>
      </Panel>
    </Box>
  );
};

// Components showcase tab
const ComponentsTab: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Loading spinner */}
      <Panel title="SmoothSpinner">
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={theme.colors.text}>Small: </Text>
            <SmoothSpinner size="small" label="loading" />
          </Box>
          <Box marginBottom={1}>
            <Text color={theme.colors.text}>Medium: </Text>
            <SmoothSpinner size="medium" label="processing" />
          </Box>
          <Box>
            <Text color={theme.colors.text}>Large: </Text>
            <SmoothSpinner size="large" label="working" />
          </Box>
        </Box>
      </Panel>

      <Spacer size={1} />

      {/* Streaming text */}
      <Panel title="StreamedText">
        <Box flexDirection="column">
          {loading ? (
            <Box>
              <Text color={theme.colors.textMuted}>Streaming: </Text>
              <SmoothSpinner size="small" />
            </Box>
          ) : (
            <StreamedText
              text="This is a premium streaming text effect. It renders character-by-character with configurable speed and no layout jitter. The cursor blinks smoothly at 530ms intervals."
              speed="normal"
              mode="character"
              showCursor={false}
            />
          )}
        </Box>
      </Panel>

      <Spacer size={1} />

      {/* Progress and badges */}
      <Panel title="Other Components">
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={theme.colors.text}>Progress: </Text>
            <Progress value={65} width={30} />
          </Box>
          <Box>
            <Text color={theme.colors.text}>Badges: </Text>
            <Badge color={theme.colors.success}>Active</Badge>
            <Box width={1} />
            <Badge color={theme.colors.warning} variant="solid">Pending</Badge>
            <Box width={1} />
            <Badge color={theme.colors.error}>Error</Badge>
          </Box>
        </Box>
      </Panel>
    </Box>
  );
};

// Interactive menu tab
const InteractiveTab: React.FC<{
  selectedIndex: number;
  onSelect: (index: number) => void;
}> = ({ selectedIndex, onSelect }) => {
  const theme = useTheme();

  const menuItems = [
    { label: "Read a file", description: "Open and view file contents" },
    { label: "Write a file", description: "Create or modify files" },
    { label: "Run command", description: "Execute shell commands" },
    { label: "Search", description: "Find patterns in code" },
    { label: "Git operations", description: "Version control actions" },
    { label: "Terminal", description: "Interactive shell" },
    { label: "Settings", description: "Configure Axiom" },
    { label: "Help", description: "Documentation and tips" },
  ];

  return (
    <Box flexDirection="column" paddingY={1}>
      <Panel title="Commands">
        <InteractiveMenu
          items={menuItems}
          onSelect={(item, index) => {
            onSelect(index);
          }}
          defaultIndex={selectedIndex}
        />
      </Panel>

      <Spacer size={1} />

      <Panel title="Selected">
        <Text color={theme.colors.text}>
          {selectedIndex >= 0
            ? `Running: ${menuItems[selectedIndex].label}...`
            : "Select a command to execute"}
        </Text>
        {selectedIndex >= 0 && (
          <Box marginTop={1}>
            <SmoothSpinner size="small" label="executing" />
          </Box>
        )}
      </Panel>
    </Box>
  );
};

export default Demo;