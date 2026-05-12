/**
 * Canvas Component - Preview/Code/Files tabs for Build mode
 * Simplified version for terminal output
 */

import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";

interface WorkspaceFile {
  path: string;
  kind: "file" | "dir";
  size?: number;
}

interface LiveFile {
  path: string;
  content: string;
  done: boolean;
}

interface CanvasProps {
  conversationId: string;
  isStreaming: boolean;
  onClose: () => void;
  previewPort: number;
  onRefreshFiles: () => Promise<WorkspaceFile[]>;
}

type Tab = "preview" | "code" | "files";

// Simple text-based Canvas (no iframe in terminal)
export const Canvas: React.FC<CanvasProps> = ({
  isStreaming,
  onClose,
  previewPort,
  onRefreshFiles
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Refresh files on mount
  useEffect(() => {
    refreshFiles();
  }, []);

  async function refreshFiles(): Promise<void> {
    try {
      const list = await onRefreshFiles();
      setFiles(list);
    } catch {
      setFiles([]);
    }
  }

  const fileCount = files.filter((f) => f.kind === "file").length;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray">
      {/* Tab Header */}
      <Box flexDirection="row" alignItems="center" paddingX={1} paddingY={0}>
        <Text
          color={activeTab === "preview" ? "white" : "gray"}
          bold={activeTab === "preview"}
        >
          {activeTab === "preview" ? "[Preview]" : " Preview "}
        </Text>
        <Text dimColor> </Text>
        <Text
          color={activeTab === "code" ? "white" : "gray"}
          bold={activeTab === "code"}
        >
          {activeTab === "code" ? "[Code]" : " Code "}
        </Text>
        <Text dimColor> </Text>
        <Text
          color={activeTab === "files" ? "white" : "gray"}
          bold={activeTab === "files"}
        >
          {activeTab === "files" ? "[Files" : " Files"}
          {fileCount > 0 && ` (${fileCount})`}
          {activeTab === "files" ? "]" : " "}
        </Text>

        <Box flexGrow={1} />

        {isStreaming && (
          <Text color="green">● Building...</Text>
        )}
        <Text> </Text>
        <Text dimColor>http://127.0.0.1:{previewPort}/</Text>
      </Box>

      {/* Content Area */}
      <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
        {activeTab === "preview" && (
          <PreviewPane files={files} previewPort={previewPort} />
        )}

        {activeTab === "code" && (
          <CodePane theme={{}} />
        )}

        {activeTab === "files" && (
          <FilesPane
            files={files}
            onOpen={(path) => {
              setSelectedFile(path);
            }}
          />
        )}
      </Box>

      {/* Footer */}
      <Box paddingX={1} paddingY={0}>
        <Text dimColor>Press Tab to switch tabs</Text>
      </Box>
    </Box>
  );
};

// Preview Pane
interface PreviewPaneProps {
  files: WorkspaceFile[];
  previewPort: number;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ files, previewPort }) => {
  const hasIndex = files.some((f) => f.path === "index.html");

  return (
    <Box flexDirection="column" flexGrow={1}>
      {hasIndex ? (
        <>
          <Text color="cyan">Preview available at:</Text>
          <Text dimColor>http://127.0.0.1:{previewPort}/...</Text>
        </>
      ) : (
        <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
          <Text color="gray">No preview available</Text>
          <Text dimColor>Create index.html to see a preview</Text>
        </Box>
      )}
    </Box>
  );
};

// Code Pane (placeholder)
interface CodePaneProps {
  theme: any;
}

const CodePane: React.FC<CodePaneProps> = () => {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
      <Text color="gray">Code streaming area</Text>
      <Text dimColor>Code will appear here when Axiom writes files</Text>
    </Box>
  );
};

// Files Pane
interface FilesPaneProps {
  files: WorkspaceFile[];
  onOpen: (path: string) => void;
}

const FilesPane: React.FC<FilesPaneProps> = ({ files, onOpen }) => {
  function formatSize(n: number): string {
    if (n < 1024) return n + "B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + "K";
    return (n / (1024 * 1024)).toFixed(1) + "M";
  }

  if (files.length === 0) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color="gray">No files yet</Text>
        <Text dimColor>Ask Axiom to build something</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      {files.map((f) => {
        const depth = (f.path.match(/\//g) || []).length;
        const name = f.path.split("/").pop() || f.path;

        return (
          <Box key={f.path} flexDirection="row" alignItems="center">
            <Text dimColor color="gray">
              {"  ".repeat(depth)}
              {f.kind === "dir" ? "▸ " : "  "}
            </Text>
            <Text color={f.kind === "dir" ? "gray" : "white"}>
              {name}
              {f.kind === "dir" && "/"}
            </Text>
            {f.size != null && (
              <Text dimColor> ({formatSize(f.size)})</Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default Canvas;