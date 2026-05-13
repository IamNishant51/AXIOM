import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap, Circle, AlertTriangle } from 'lucide-react';
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
    icon: Brain,
    label: 'Thinking',
    color: 'text-axiom-secondary',
    bgColor: 'bg-axiom-secondary/10',
  },
  generating: {
    icon: Sparkles,
    label: 'Generating',
    color: 'text-axiom-success',
    bgColor: 'bg-axiom-success/10',
  },
  tool: {
    icon: Zap,
    label: 'Executing',
    color: 'text-axiom-warning',
    bgColor: 'bg-axiom-warning/10',
  },
  idle: {
    icon: Circle,
    label: 'Ready',
    color: 'text-axiom-text-dim',
    bgColor: 'bg-axiom-bg-tertiary',
  },
  error: {
    icon: AlertTriangle,
    label: 'Error',
    color: 'text-axiom-error',
    bgColor: 'bg-axiom-error/10',
  },
};

export function ActivityIndicator({ activity, compact = false }: ActivityIndicatorProps) {
  const config = ACTIVITY_CONFIG[activity.kind];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${config.color}`}>
        <motion.span
          animate={{ opacity: activity.kind === 'generating' ? [1, 0.5, 1] : 1 }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <Icon className="w-4 h-4" />
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
      >
        <Icon className="w-4 h-4" />
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