import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Hammer } from 'lucide-react';
import type { AgentMode } from '../../../types';

interface ModeToggleProps {
  activeMode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
}

export function ModeToggle({ activeMode, onModeChange }: ModeToggleProps) {
  return (
    <div className="relative flex items-center p-1 bg-axiom-bg-tertiary rounded-lg">
      {/* Sliding background */}
      <motion.div
        className="absolute top-1 bottom-1 bg-axiom-bg-secondary rounded-md shadow-sm"
        initial={false}
        animate={{
          left: activeMode === 'chat' ? 4 : '50%',
          width: 'calc(50% - 4px)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      <button
        onClick={() => onModeChange('chat')}
        className={`
          relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
          transition-colors duration-200 cursor-pointer
          ${activeMode === 'chat'
            ? 'text-axiom-text'
            : 'text-axiom-text-muted hover:text-axiom-text'
          }
        `}
      >
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Chat</span>
      </button>

      <button
        onClick={() => onModeChange('build')}
        className={`
          relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
          transition-colors duration-200 cursor-pointer
          ${activeMode === 'build'
            ? 'text-axiom-text'
            : 'text-axiom-text-muted hover:text-axiom-text'
          }
        `}
      >
        <Hammer className="w-4 h-4" />
        <span className="hidden sm:inline">Build</span>
      </button>
    </div>
  );
}