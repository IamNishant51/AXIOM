import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { ChatView } from './components/Chat';
import { BuildView } from './components/Build';
import { useSettingsStore } from './store/settingsStore';
import { useChatStore } from './store/chatStore';
import { useBuildStore } from './store/buildStore';
import { useVSCodeMessage } from './hooks/useVSCode';
import type { Message, AgentMode } from '../types';

export function App() {
  const { mode, setMode, updateSettings } = useSettingsStore();
  const { appendToken, setThinking, setStreaming, startToolCall, endToolCall, clearMessages, addMessage } = useChatStore();
  const { setFiles, setPreviewPort } = useBuildStore();

  // Handle messages from VS Code extension
  const handleMessage = useCallback((data: unknown) => {
    const message = data as { type: string; [key: string]: unknown };

    switch (message.type) {
      case 'token':
        appendToken(String(message.data || ''));
        break;

      case 'thinking':
        setThinking(String(message.thinking || ''));
        break;

      case 'tool_start':
        startToolCall({
          id: String(message.id || `tool-${Date.now()}`),
          name: String(message.tool || ''),
          args: (message.args as Record<string, unknown>) || {},
          status: 'running',
        });
        break;

      case 'tool_result':
        endToolCall(
          String(message.id || ''),
          String(message.result || ''),
          message.error as string | undefined
        );
        break;

      case 'done':
        setStreaming(false);
        break;

      case 'cancelled':
        setStreaming(false);
        break;

      case 'settings_update':
        updateSettings(message.settings as Record<string, unknown> as Parameters<typeof updateSettings>[0]);
        break;

      case 'mode_change':
        setMode((message.mode as 'chat' | 'build') || 'chat');
        break;

      case 'file_change':
        // Refresh file list
        break;

      case 'preview_port':
        setPreviewPort(Number(message.port) || 3001);
        break;

      case 'files_list':
        setFiles((message.files as Parameters<typeof setFiles>[0]) || []);
        break;

      case 'clear_chat':
        clearMessages();
        break;
    }
  }, [appendToken, setThinking, setStreaming, startToolCall, endToolCall, updateSettings, setMode, setFiles, setPreviewPort, clearMessages]);

  useVSCodeMessage(handleMessage);

  // Submit handler
  const handleSubmit = useCallback((text: string) => {
    // Add user message
    addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });

    // Set streaming
    setStreaming(true);

    // Send to extension
    window.vscode?.postMessage({ type: 'submit', content: text });
  }, [addMessage, setStreaming]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    setStreaming(false);
    window.vscode?.postMessage({ type: 'cancel' });
  }, [setStreaming]);

  // Mode toggle handler
  const handleModeChange = useCallback((newMode: 'chat' | 'build') => {
    setMode(newMode);
    window.vscode?.postMessage({ type: 'switch_mode', mode: newMode });
  }, [setMode]);

  return (
    <div className="h-full flex flex-col bg-axiom-bg-primary">
      <Header mode={mode} onModeChange={handleModeChange} />

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-hidden"
        >
          {mode === 'chat' ? (
            <ChatView onSubmit={handleSubmit} onCancel={handleCancel} />
          ) : (
            <BuildView />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
