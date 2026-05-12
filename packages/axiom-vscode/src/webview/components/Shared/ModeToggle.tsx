import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Hammer } from 'lucide-react';
import type { AgentMode } from '../../../types';

interface ModeToggleProps {
  activeMode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
}

export function ModeToggle({ activeMode, onModeChange }: ModeToggleProps) {
  const modes: { id: AgentMode; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'build', label: 'Build', icon: <Hammer className="w-4 h-4" /> },
  ];

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

      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`
            relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
            transition-colors duration-200 cursor-pointer
            ${activeMode === mode.id
              ? 'text-axiom-text-primary'
              : 'text-axiom-text-muted hover:text-axiom-text-secondary'
            }
          `}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
