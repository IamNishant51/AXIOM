import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Hammer } from 'lucide-react';
import { ModeToggle } from '../Shared/ModeToggle';
import type { AgentMode } from '../../../types';

interface HeaderProps {
  mode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
}

export function Header({ mode, onModeChange }: HeaderProps) {
  return (
    <header className="flex-shrink-0 px-4 py-3 border-b border-axiom-border bg-axiom-bg-secondary">
      <div className="flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-axiom-accent-blue to-axiom-accent-purple"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h1 className="font-semibold text-axiom-text-primary">Axiom</h1>
            <p className="text-xs text-axiom-text-muted">AI Coding Assistant</p>
          </div>
        </div>

        {/* Mode toggle */}
        <ModeToggle activeMode={mode} onModeChange={onModeChange} />
      </div>
    </header>
  );
}
