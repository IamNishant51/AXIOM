import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { ModeToggle } from '../Shared/ModeToggle';
import { SettingsModal } from '../Settings';
import type { AgentMode } from '../../../types';

interface HeaderProps {
  mode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
}

export function Header({ mode, onModeChange }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const logoUrl = '/AXIOM-LOGO.png';

  return (
    <header className="flex-shrink-0 px-4 py-3 border-b border-axiom-border bg-axiom-bg-secondary/80 backdrop-blur">
      <div className="flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-axiom-bg-tertiary border border-axiom-border shadow-sm"
          >
            <img
              src={logoUrl}
              alt="Axiom"
              className="w-7 h-7 rounded-md"
            />
          </motion.div>
          <div>
            <h1 className="font-semibold text-axiom-text tracking-wide">Axiom</h1>
            <p className="text-xs text-axiom-text-muted">AI Coding Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-axiom-bg-tertiary transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-axiom-text-muted" />
          </button>

          <ModeToggle activeMode={mode} onModeChange={onModeChange} />
        </div>
      </div>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </header>
  );
}