import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Code, Folder, RefreshCw, ExternalLink } from 'lucide-react';
import { PreviewPane } from './PreviewPane';
import { CodePane } from './CodePane';
import { FileTree } from './FileTree';
import { ActivityIndicator } from '../Shared/ActivityIndicator';
import { useBuildStore } from '../../store/buildStore';
import { useChatStore } from '../../store/chatStore';

export function BuildView() {
  const { activeTab, setActiveTab, previewUrl, previewPort } = useBuildStore();
  const { isStreaming } = useChatStore();

  const tabs = [
    { id: 'preview' as const, label: 'Preview', icon: Eye },
    { id: 'code' as const, label: 'Code', icon: Code },
    { id: 'files' as const, label: 'Files', icon: Folder },
  ];

  const handleOpenPreview = () => {
    window.vscode?.postMessage({ type: 'open_preview' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-axiom-border bg-axiom-bg-secondary">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                transition-colors cursor-pointer
                ${activeTab === tab.id
                  ? 'bg-axiom-bg-tertiary text-axiom-text-primary'
                  : 'text-axiom-text-muted hover:text-axiom-text-secondary hover:bg-axiom-bg-tertiary/50'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && (
            <ActivityIndicator activity={{ kind: 'generating' }} compact />
          )}
          {activeTab === 'preview' && (
            <>
              <span className="text-xs text-axiom-text-muted">
                http://localhost:{previewPort}/
              </span>
              <button
                onClick={handleOpenPreview}
                className="p-1.5 rounded-md text-axiom-text-muted hover:text-axiom-text-primary hover:bg-axiom-bg-tertiary transition-colors cursor-pointer"
                title="Open in browser"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.vscode?.postMessage({ type: 'refresh_preview' })}
                className="p-1.5 rounded-md text-axiom-text-muted hover:text-axiom-text-primary hover:bg-axiom-bg-tertiary transition-colors cursor-pointer"
                title="Refresh preview"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === 'preview' && <PreviewPane />}
            {activeTab === 'code' && <CodePane />}
            {activeTab === 'files' && <FileTree />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
