import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, X, CornerDownLeft } from 'lucide-react';

interface InputAreaProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function InputArea({ onSubmit, onCancel, disabled }: InputAreaProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue('');
    textareaRef.current?.focus();
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Ctrl+Enter or Cmd+Enter
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
        return;
      }

      // Cancel on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
    },
    [handleSubmit, onCancel]
  );

  return (
    <div className="relative">
      <motion.div
        animate={{
          borderColor: disabled ? '#484f58' : '#30363d',
        }}
        className="relative flex items-end bg-axiom-bg-secondary border border-axiom-border rounded-xl overflow-hidden"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Axiom anything..."
          disabled={disabled}
          className={`
            flex-1 px-4 py-3 bg-transparent text-axiom-text-primary placeholder-axiom-text-muted
            outline-none resize-none min-h-[48px] max-h-[150px]
            ${disabled ? 'opacity-50' : ''}
          `}
          rows={1}
        />

        {/* Actions */}
        <div className="flex items-center gap-2 px-3 pb-3">
          {disabled ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={onCancel}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-axiom-accent-red/20 text-axiom-accent-red hover:bg-axiom-accent-red/30 transition-colors cursor-pointer"
              title="Cancel (Esc)"
            >
              <X className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!value.trim()}
              className={`
                flex items-center justify-center w-8 h-8 rounded-lg
                transition-colors cursor-pointer
                ${value.trim()
                  ? 'bg-axiom-accent-blue text-white hover:bg-blue-500'
                  : 'bg-axiom-bg-tertiary text-axiom-text-muted cursor-not-allowed'
                }
              `}
              title="Send (Ctrl+Enter)"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Hint */}
      <div className="flex items-center justify-between mt-2 text-xs text-axiom-text-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-axiom-bg-tertiary rounded">
              <CornerDownLeft className="w-3 h-3 inline" />
            </kbd>
            send
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-axiom-bg-tertiary rounded">Esc</kbd>
            cancel
          </span>
        </div>
        {value.length > 0 && (
          <span>{value.length} chars</span>
        )}
      </div>
    </div>
  );
}
