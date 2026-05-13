import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bot, Code, Bug, Edit3, Lightbulb } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { ActivityIndicator } from '../Shared/ActivityIndicator';
import { useChatStore } from '../../store/chatStore';
import ReactMarkdown from 'react-markdown';

const markdownComponents = {
  ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="list-disc ml-5 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="list-decimal ml-5 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  code: ({ children, ...props }: React.ComponentPropsWithoutRef<'code'>) => (
    <code className="px-1 py-0.5 rounded bg-axiom-bg-tertiary text-axiom-text" {...props}>
      {children}
    </code>
  ),
};

interface ChatViewProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export function ChatView({ onSubmit, onCancel }: ChatViewProps) {
  const { messages, isStreaming, currentContent, currentThinking, currentToolCall } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const logoUrl = '/AXIOM-LOGO.png';
  const features = [
    { icon: MessageSquare, text: 'Chat about code, concepts, or questions' },
    { icon: Search, text: 'Search and understand large codebases' },
    { icon: Edit3, text: 'Write, edit, and refactor code' },
    { icon: Bug, text: 'Debug and fix issues' },
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
        className="w-16 h-16 mb-6 rounded-2xl bg-axiom-bg-tertiary border border-axiom-border flex items-center justify-center shadow-sm"
      >
        <img
          src={logoUrl}
          alt="Axiom"
          className="w-12 h-12 rounded-xl"
        />
      </motion.div>

      <h2 className="text-xl font-semibold text-axiom-text mb-2">
        Welcome to Axiom
      </h2>
      <p className="text-axiom-text-muted mb-8 max-w-md">
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
            <feature.icon className="w-5 h-5 text-axiom-primary" />
            <span className="text-sm text-axiom-text-muted">{feature.text}</span>
          </motion.div>
        ))}
      </div>

      <p className="mt-8 text-xs text-axiom-text-dim">
        Press <kbd className="px-1.5 py-0.5 bg-axiom-bg-tertiary rounded mx-1 text-axiom-text-muted">Ctrl+Shift+A</kbd> to open sidebar anytime
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
  const markdownClassName = useMemo(() => {
    return `whitespace-pre-wrap ${isUser ? '' : 'text-axiom-text'}`;
  }, [isUser]);
  const showTyping = isStreaming && !content && !thinking;

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
            ? 'bg-axiom-primary text-axiom-text-inverse'
            : 'bg-axiom-bg-secondary border border-axiom-border'
          }
        `}
      >
        {thinking && !isUser && (
          <details className="mb-3 rounded-lg border border-axiom-border bg-axiom-secondary/10">
            <summary className="cursor-pointer select-none text-xs font-medium text-axiom-secondary px-3 py-2">
              Reasoning
            </summary>
            <div className="px-3 pb-3 text-sm text-axiom-text-muted whitespace-pre-wrap">
              {thinking}
            </div>
          </details>
        )}

        {showTyping ? (
          <div className="flex items-center gap-2 text-axiom-text-muted">
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-axiom-text-muted animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-axiom-text-muted animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-axiom-text-muted animate-pulse" />
            </span>
            <span className="text-xs">Thinking...</span>
          </div>
        ) : (
          <ReactMarkdown className={markdownClassName} components={markdownComponents}>
            {content}
          </ReactMarkdown>
        )}

        {isStreaming && !showTyping && <span className="cursor ml-1 bg-axiom-cursor" />}

        {toolCall && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-axiom-bg-tertiary rounded-lg"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className={
                toolCall.status === 'running' ? 'text-axiom-warning' :
                toolCall.status === 'error' ? 'text-axiom-error' :
                'text-axiom-success'
              }>
                {toolCall.status === 'running' ? '...' : toolCall.status === 'error' ? 'x' : 'o'}
              </span>
              <span className="font-medium text-axiom-secondary">{toolCall.name}</span>
            </div>
            {toolCall.result && (
              <pre className="mt-2 text-xs text-axiom-text-dim whitespace-pre-wrap overflow-x-auto">
                {toolCall.result.slice(0, 200)}
                {toolCall.result.length > 200 && '...'}
              </pre>
            )}
            {toolCall.error && (
              <div className="mt-2 text-xs text-axiom-error">
                {toolCall.error}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}