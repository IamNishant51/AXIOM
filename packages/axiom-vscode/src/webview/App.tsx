import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Layout/Header';
import { ChatView } from './components/Chat';
import { BuildView } from './components/Build';
import { useSettingsStore } from './store/settingsStore';
import { useChatStore } from './store/chatStore';
import { useBuildStore } from './store/buildStore';
import { useVSCodeMessage } from './hooks/useVSCode';

export function App() {
  const { mode, setMode, updateSettings } = useSettingsStore();
  const {
    appendToken,
    setThinking,
    setStreaming,
    startToolCall,
    endToolCall,
    clearMessages,
    addMessage,
    finalizeMessage,
  } = useChatStore();
  const { setFiles, setPreviewPort } = useBuildStore();

  const handleMessage = useCallback(
    (data: unknown) => {
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
          finalizeMessage();
          setStreaming(false);
          break;

        case 'cancelled':
          finalizeMessage();
          setStreaming(false);
          break;

        case 'settings_update':
          updateSettings(message.settings as Parameters<typeof updateSettings>[0]);
          break;

        case 'mode_change':
          setMode((message.mode as 'chat' | 'build') || 'chat');
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

        default:
          break;
      }
    },
    [
      appendToken,
      setThinking,
      setStreaming,
      startToolCall,
      endToolCall,
      updateSettings,
      setMode,
      setFiles,
      setPreviewPort,
      clearMessages,
      finalizeMessage,
    ]
  );

  useVSCodeMessage(handleMessage);

  const handleSubmit = useCallback(
    (text: string) => {
      addMessage({
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      });

      setStreaming(true);
      window.vscode?.postMessage({ type: 'submit', content: text });
    },
    [addMessage, setStreaming]
  );

  const handleCancel = useCallback(() => {
    setStreaming(false);
    window.vscode?.postMessage({ type: 'cancel' });
  }, [setStreaming]);

  const handleModeChange = useCallback(
    (newMode: 'chat' | 'build') => {
      setMode(newMode);
      window.vscode?.postMessage({ type: 'switch_mode', mode: newMode });
    },
    [setMode]
  );

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
