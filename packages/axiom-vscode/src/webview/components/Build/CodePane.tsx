import React from 'react';
import { motion } from 'framer-motion';
import { Code2, FileCode } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';

export function CodePane() {
  const { currentContent, isStreaming } = useChatStore();

  const hasCode = currentContent.length > 0;

  return (
    <div className="h-full flex flex-col bg-axiom-bg-primary">
      {hasCode ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-auto p-4"
        >
          <pre className="font-mono text-sm text-axiom-text whitespace-pre-wrap">
            {currentContent}
            {isStreaming && <span className="cursor ml-1 bg-axiom-cursor" />}
          </pre>
        </motion.div>
      ) : (
        <EmptyCode />
      )}
    </div>
  );
}

function EmptyCode() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col items-center justify-center text-center p-8"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-16 h-16 mb-4 rounded-xl bg-axiom-bg-secondary flex items-center justify-center"
      >
        <Code2 className="w-8 h-8 text-axiom-text-dim" />
      </motion.div>

      <h3 className="text-lg font-semibold text-axiom-text mb-2">
        Code Streaming Area
      </h3>
      <p className="text-axiom-text-muted max-w-md">
        Code will appear here as Axiom writes files. Switch to Build mode and ask Axiom to create something.
      </p>

      <div className="mt-6 flex items-center gap-2 text-xs text-axiom-text-dim">
        <FileCode className="w-4 h-4" />
        <span>Start building to see live code</span>
      </div>
    </motion.div>
  );
}