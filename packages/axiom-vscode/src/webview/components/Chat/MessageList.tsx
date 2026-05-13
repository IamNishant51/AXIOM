import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../../../types';

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
  const content = message.content || '';

  const markdownClassName = useMemo(() => {
    return `whitespace-pre-wrap ${isUser ? '' : 'text-axiom-text'}`;
  }, [isUser]);

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
            ? 'bg-axiom-primary text-axiom-text-inverse rounded-br-md'
            : 'bg-axiom-bg-secondary border border-axiom-border rounded-bl-md'
          }
        `}
      >
        {message.thinking && (
          <details className="mb-3 rounded-lg border border-axiom-border bg-axiom-secondary/10">
            <summary className="cursor-pointer select-none text-xs font-medium text-axiom-secondary px-3 py-2">
              Reasoning
            </summary>
            <div className="px-3 pb-3 text-sm text-axiom-text-muted whitespace-pre-wrap">
              {message.thinking}
            </div>
          </details>
        )}

        <ReactMarkdown className={markdownClassName} components={markdownComponents}>
          {content}
        </ReactMarkdown>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((tool) => (
              <div
                key={tool.id}
                className="p-3 bg-axiom-bg-tertiary rounded-lg"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className={
                    tool.status === 'running' ? 'text-axiom-warning' :
                    tool.status === 'error' ? 'text-axiom-error' :
                    'text-axiom-success'
                  }>
                    {tool.status === 'running' ? '...' : tool.status === 'error' ? 'x' : 'o'}
                  </span>
                  <span className="font-medium text-axiom-secondary">{tool.name}</span>
                </div>
                {tool.result && (
                  <pre className="mt-2 text-xs text-axiom-text-dim whitespace-pre-wrap overflow-x-auto">
                    {tool.result.slice(0, 300)}
                    {tool.result.length > 300 && '...'}
                  </pre>
                )}
                {tool.error && (
                  <div className="mt-2 text-xs text-axiom-error">
                    {tool.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={`mt-2 text-xs ${isUser ? 'text-white/50' : 'text-axiom-text-dim'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}