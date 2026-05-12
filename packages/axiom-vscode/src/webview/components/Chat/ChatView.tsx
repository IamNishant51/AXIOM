import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, X } from 'lucide-react';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { ActivityIndicator } from '../Shared/ActivityIndicator';
import { useChatStore } from '../../store/chatStore';

interface ChatViewProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export function ChatView({ onSubmit, onCancel }: ChatViewProps) {
  const { messages, isStreaming, currentContent, currentThinking, currentToolCall } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentContent, currentThinking]);

  const handleSubmit = useCallback(
    (text: string) => {
      onSubmit(text);
    },
    [onSubmit]
  );

  const showWelcome = messages.length === 0 && !isStreaming;

  return (
    <div className="h-full flex flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showWelcome ? (
          <WelcomeState />
        ) : (
          <MessageList messages={messages} />
        )}

        {/* Streaming content */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4"
            >
              <MessageBubble
                role="assistant"
                content={currentContent}
                thinking={currentThinking}
                toolCall={currentToolCall}
                isStreaming
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-axiom-border p-4">
        {isStreaming && currentContent && (
          <div className="mb-2">
            <ActivityIndicator activity={{ kind: 'generating', chars: currentContent.length }} />
          </div>
        )}
        <InputArea
          onSubmit={handleSubmit}
          onCancel={onCancel}
          disabled={isStreaming}
        />
      </div>
    </div>
  );
}

function WelcomeState() {
  const features = [
    { icon: '💬', text: 'Chat about code, concepts, or questions' },
    { icon: '🔍', text: 'Search and understand large codebases' },
    { icon: '✏️', text: 'Write, edit, and refactor code' },
    { icon: '🐛', text: 'Debug and fix issues' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col items-center justify-center text-center px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-axiom-accent-blue to-axiom-accent-purple flex items-center justify-center text-3xl"
      >
        ✨
      </motion.div>

      <h2 className="text-xl font-semibold text-axiom-text-primary mb-2">
        Welcome to Axiom
      </h2>
      <p className="text-axiom-text-secondary mb-8 max-w-md">
        Your AI coding assistant. Ask me anything about your code or let me help you build something amazing.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        {features.map((feature, i) => (
          <motion.div
            key={feature.text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex items-center gap-3 p-3 bg-axiom-bg-secondary rounded-lg border border-axiom-border"
          >
            <span className="text-xl">{feature.icon}</span>
            <span className="text-sm text-axiom-text-secondary">{feature.text}</span>
          </motion.div>
        ))}
      </div>

      <p className="mt-8 text-xs text-axiom-text-muted">
        Press <kbd className="px-1.5 py-0.5 bg-axiom-bg-tertiary rounded mx-1">Ctrl+Shift+A</kbd> to open sidebar anytime
      </p>
    </motion.div>
  );
}

interface MessageBubbleProps {
  role: string;
  content: string;
  thinking?: string;
  toolCall?: { name: string; status: string; result?: string; error?: string } | null;
  isStreaming?: boolean;
}

function MessageBubble({ role, content, thinking, toolCall, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-3
          ${isUser
            ? 'bg-axiom-accent-blue text-white'
            : 'bg-axiom-bg-secondary border border-axiom-border'
          }
        `}
      >
        {/* Thinking block */}
        {thinking && !isUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3 p-3 bg-axiom-accent-purple/10 rounded-lg border-l-2 border-axiom-accent-purple"
          >
            <div className="text-xs font-medium text-axiom-accent-purple mb-1">Reasoning</div>
            <div className="text-sm text-axiom-text-secondary whitespace-pre-wrap">
              {thinking}
            </div>
          </motion.div>
        )}

        {/* Content */}
        <div className={`whitespace-pre-wrap ${isUser ? '' : 'text-axiom-text-primary'}`}>
          {content}
          {isStreaming && <span className="cursor ml-1" />}
        </div>

        {/* Tool call */}
        {toolCall && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-axiom-bg-tertiary rounded-lg"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className={
                toolCall.status === 'running' ? 'text-axiom-accent-orange' :
                toolCall.status === 'error' ? 'text-axiom-accent-red' :
                'text-axiom-accent-green'
              }>
                {toolCall.status === 'running' ? '⚡' : toolCall.status === 'error' ? '✕' : '✓'}
              </span>
              <span className="font-medium text-axiom-accent-cyan">{toolCall.name}</span>
            </div>
            {toolCall.result && (
              <pre className="mt-2 text-xs text-axiom-text-muted whitespace-pre-wrap overflow-x-auto">
                {toolCall.result.slice(0, 200)}
                {toolCall.result.length > 200 && '...'}
              </pre>
            )}
            {toolCall.error && (
              <div className="mt-2 text-xs text-axiom-accent-red">
                {toolCall.error}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
