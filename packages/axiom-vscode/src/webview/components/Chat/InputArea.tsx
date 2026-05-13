import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Command, FileText } from 'lucide-react';

interface InputAreaProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function InputArea({ onSubmit, onCancel, disabled }: InputAreaProps) {
  const [value, setValue] = useState('');
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Commands mock
  const commands = [
    { id: 'clear', label: '/clear', desc: 'Clear chat' },
    { id: 'help', label: '/help', desc: 'Show help' }
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 250)}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setValue(val);
    if (val.endsWith('/')) {
      setShowSlashCommands(true);
    } else if (showSlashCommands && !val.includes('/')) {
      setShowSlashCommands(false);
    }
  };

  const executeCommand = (cmd: string) => {
    setValue(cmd + ' ');
    setShowSlashCommands(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue('');
    setShowSlashCommands(false);
    textareaRef.current?.focus();
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [handleSubmit, onCancel]);

  return (
    <div className="relative p-4 pt-0 w-full mb-2">
      <AnimatePresence>
        {showSlashCommands && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-4 mb-2 w-64 bg-vsc-editor border border-vsc-border rounded-lg shadow-xl overflow-hidden z-50"
          >
            {commands.map((cmd) => (
              <button 
                key={cmd.id}
                onClick={() => executeCommand(cmd.label)}
                className="w-full text-left px-4 py-2 hover:bg-vsc-hover text-sm flex justify-between items-center transition-colors"
              >
                <span className="font-mono text-vsc-foreground">{cmd.label}</span>
                <span className="text-vsc-foreground opacity-50">{cmd.desc}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col bg-vsc-input border border-vsc-inputBorder rounded-xl overflow-hidden shadow-sm outline-none focus-within:ring-1 focus-within:ring-vsc-button transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask Axiom a question or type '/' for commands..."
          className="w-full bg-transparent text-vsc-inputFg placeholder-vsc-inputFg/50 p-4 pb-12 outline-none resize-none min-h-[56px] text-[13px] leading-relaxed"
          rows={1}
        />
        
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {disabled ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center bg-vsc-button hover:bg-vsc-buttonHover text-vsc-buttonFg rounded-md transition-colors"
              title="Stop Generation (Esc)"
            >
              <Square className="w-4 h-4 fill-current" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!value.trim()}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                value.trim() 
                  ? 'bg-vsc-button text-vsc-buttonFg hover:bg-vsc-buttonHover shadow-sm' 
                  : 'bg-transparent text-vsc-foreground/30'
              }`}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
