import React from 'react';
import { motion } from 'framer-motion';
import type { Message } from '../../../types';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4 stagger-children">
      {messages.map((message, index) => (
        <MessageItem key={message.id} message={message} index={index} />
      ))}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  index: number;
}

function MessageItem({ message, index }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-3
          ${isUser
            ? 'bg-axiom-accent-blue text-white rounded-br-md'
            : 'bg-axiom-bg-secondary border border-axiom-border rounded-bl-md'
          }
        `}
      >
        {/* Thinking block */}
        {message.thinking && (
          <div className="mb-3 p-3 bg-axiom-accent-purple/10 rounded-lg border-l-2 border-axiom-accent-purple">
            <div className="text-xs font-medium text-axiom-accent-purple mb-1">Reasoning</div>
            <div className="text-sm text-axiom-text-secondary whitespace-pre-wrap">
              {message.thinking}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`whitespace-pre-wrap ${isUser ? '' : 'text-axiom-text-primary'}`}>
          {message.content}
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((tool) => (
              <div
                key={tool.id}
                className="p-3 bg-axiom-bg-tertiary rounded-lg"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className={
                    tool.status === 'running' ? 'text-axiom-accent-orange' :
                    tool.status === 'error' ? 'text-axiom-accent-red' :
                    'text-axiom-accent-green'
                  }>
                    {tool.status === 'running' ? '⚡' : tool.status === 'error' ? '✕' : '✓'}
                  </span>
                  <span className="font-medium text-axiom-accent-cyan">{tool.name}</span>
                </div>
                {tool.result && (
                  <pre className="mt-2 text-xs text-axiom-text-muted whitespace-pre-wrap overflow-x-auto">
                    {tool.result.slice(0, 300)}
                    {tool.result.length > 300 && '...'}
                  </pre>
                )}
                {tool.error && (
                  <div className="mt-2 text-xs text-axiom-accent-red">
                    {tool.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`mt-2 text-xs ${isUser ? 'text-white/50' : 'text-axiom-text-muted'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}
