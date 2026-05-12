import React from 'react';
import { motion } from 'framer-motion';
import type { ActivityKind } from '../../../types';

interface ActivityIndicatorProps {
  activity: {
    kind: ActivityKind;
    tool?: string;
    target?: string;
    chars?: number;
  };
  compact?: boolean;
}

const ACTIVITY_CONFIG = {
  thinking: {
    icon: '◯',
    label: 'Thinking',
    color: 'text-axiom-accent-cyan',
    bgColor: 'bg-axiom-accent-cyan/10',
  },
  generating: {
    icon: '◉',
    label: 'Generating',
    color: 'text-axiom-accent-green',
    bgColor: 'bg-axiom-accent-green/10',
  },
  tool: {
    icon: '⚡',
    label: 'Executing',
    color: 'text-axiom-accent-orange',
    bgColor: 'bg-axiom-accent-orange/10',
  },
  idle: {
    icon: '○',
    label: 'Ready',
    color: 'text-axiom-text-muted',
    bgColor: 'bg-axiom-bg-tertiary',
  },
  error: {
    icon: '⚠',
    label: 'Error',
    color: 'text-axiom-accent-red',
    bgColor: 'bg-axiom-accent-red/10',
  },
};

export function ActivityIndicator({ activity, compact = false }: ActivityIndicatorProps) {
  const config = ACTIVITY_CONFIG[activity.kind];

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${config.color}`}>
        <motion.span
          animate={{ opacity: activity.kind === 'generating' ? [1, 0.5, 1] : 1 }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="text-sm"
        >
          {config.icon}
        </motion.span>
        <span className="text-sm">{config.label}</span>
        {activity.tool && <span className="text-xs opacity-70">- {activity.tool}</span>}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        ${config.bgColor} ${config.color}
      `}
    >
      <motion.span
        animate={{
          scale: activity.kind === 'generating' ? [1, 1.2, 1] : 1,
          opacity: activity.kind === 'generating' ? [1, 0.7, 1] : 1,
        }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-sm"
      >
        {config.icon}
      </motion.span>
      <span className="text-sm font-medium">{config.label}</span>
      {activity.tool && (
        <span className="text-xs opacity-70">{activity.tool}</span>
      )}
      {activity.target && (
        <span className="text-xs opacity-50 truncate max-w-[200px]">
          {activity.target.length > 40
            ? `...${activity.target.slice(-40)}`
            : activity.target}
        </span>
      )}
      {activity.kind === 'generating' && activity.chars !== undefined && (
        <span className="text-xs opacity-50">({activity.chars} chars)</span>
      )}
    </motion.div>
  );
}
