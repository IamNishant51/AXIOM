import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command as CommandIcon, CornerDownLeft, X } from 'lucide-react';
import type { Command as CommandType } from '../../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandType[];
  onSelect: (command: CommandType) => void;
}

export function CommandPalette({ isOpen, onClose, commands, onSelect }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onSelect, onClose]
  );

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-lg mx-4 bg-axiom-bg-secondary border border-axiom-border rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-axiom-border">
            <Search className="w-5 h-5 text-axiom-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-axiom-text-primary placeholder-axiom-text-muted outline-none"
            />
            <kbd className="px-2 py-1 text-xs bg-axiom-bg-tertiary text-axiom-text-muted rounded">
              ESC
            </kbd>
          </div>

          {/* Commands list */}
          <div className="max-h-80 overflow-y-auto py-2">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-axiom-text-muted">
                No commands found
              </div>
            ) : (
              filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onSelect(cmd);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer
                    ${index === selectedIndex
                      ? 'bg-axiom-bg-tertiary text-axiom-text-primary'
                      : 'text-axiom-text-secondary hover:bg-axiom-bg-tertiary'
                    }
                  `}
                >
                  <CommandIcon className="w-4 h-4 opacity-50" />
                  <div className="flex-1">
                    <div className="font-medium">{cmd.name}</div>
                    <div className="text-xs opacity-60">{cmd.description}</div>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="px-2 py-1 text-xs bg-axiom-bg-primary text-axiom-text-muted rounded">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-axiom-border text-xs text-axiom-text-muted">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-axiom-bg-tertiary rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-axiom-bg-tertiary rounded">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-axiom-bg-tertiary rounded">
                  <CornerDownLeft className="w-3 h-3 inline" />
                </kbd>
                select
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
