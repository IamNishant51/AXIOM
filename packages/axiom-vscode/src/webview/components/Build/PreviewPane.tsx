import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, RotateCcw } from 'lucide-react';
import { useBuildStore } from '../../store/buildStore';

export function PreviewPane() {
  const { previewUrl, previewPort } = useBuildStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');

  const hasPreview = previewUrl && previewUrl !== '';

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-axiom-border bg-axiom-bg-primary/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('desktop')}
            className={`
              p-1.5 rounded-md transition-colors cursor-pointer
              ${viewMode === 'desktop'
                ? 'bg-axiom-bg-tertiary text-axiom-text-primary'
                : 'text-axiom-text-muted hover:text-axiom-text-secondary'
              }
            `}
            title="Desktop view"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`
              p-1.5 rounded-md transition-colors cursor-pointer
              ${viewMode === 'mobile'
                ? 'bg-axiom-bg-tertiary text-axiom-text-primary'
                : 'text-axiom-text-muted hover:text-axiom-text-secondary'
              }
            `}
            title="Mobile view"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => iframeRef.current?.contentWindow?.location.reload()}
          className="p-1.5 rounded-md text-axiom-text-muted hover:text-axiom-text-primary hover:bg-axiom-bg-tertiary transition-colors cursor-pointer"
          title="Reload iframe"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-white">
        {hasPreview ? (
          <motion.div
            animate={{ width: viewMode === 'mobile' ? '375px' : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="mx-auto"
          >
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </motion.div>
        ) : (
          <EmptyPreview />
        )}
      </div>
    </div>
  );
}

function EmptyPreview() {
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
        className="w-20 h-20 mb-6 rounded-2xl bg-axiom-bg-secondary flex items-center justify-center"
      >
        <svg
          className="w-10 h-10 text-axiom-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </motion.div>

      <h3 className="text-lg font-semibold text-axiom-text-primary mb-2">
        No Preview Available
      </h3>
      <p className="text-axiom-text-secondary max-w-md">
        Ask Axiom to create an HTML file or build a web application to see it here.
      </p>
    </motion.div>
  );
}
