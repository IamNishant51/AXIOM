import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, File, ChevronRight, ChevronDown, FileCode, FileText, Image, FileJson, FolderOpen } from 'lucide-react';
import { useBuildStore } from '../../store/buildStore';

const FILE_ICONS: Record<string, React.ReactNode> = {
  html: <FileCode className="w-4 h-4 text-orange-400" />,
  htm: <FileCode className="w-4 h-4 text-orange-400" />,
  css: <FileCode className="w-4 h-4 text-blue-400" />,
  js: <FileCode className="w-4 h-4 text-yellow-400" />,
  ts: <FileCode className="w-4 h-4 text-blue-400" />,
  jsx: <FileCode className="w-4 h-4 text-cyan-400" />,
  tsx: <FileCode className="w-4 h-4 text-cyan-400" />,
  json: <FileJson className="w-4 h-4 text-yellow-300" />,
  md: <FileText className="w-4 h-4 text-gray-400" />,
  txt: <FileText className="w-4 h-4 text-gray-400" />,
  png: <Image className="w-4 h-4 text-pink-400" />,
  jpg: <Image className="w-4 h-4 text-pink-400" />,
  jpeg: <Image className="w-4 h-4 text-pink-400" />,
  svg: <Image className="w-4 h-4 text-green-400" />,
  gif: <Image className="w-4 h-4 text-purple-400" />,
};

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || <File className="w-4 h-4 text-axiom-text-dim" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

interface FileItemProps {
  name: string;
  path: string;
  kind: 'file' | 'dir';
  size?: number;
  depth: number;
  isStreaming?: boolean;
}

function FileItem({ name, path, kind, size, depth, isStreaming }: FileItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 1);

  const handleClick = () => {
    if (kind === 'dir') {
      setIsOpen(!isOpen);
    } else {
      window.vscode?.postMessage({ type: 'open_file', path });
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleClick}
      className={`
        w-full flex items-center gap-2 px-2 py-1 rounded-md text-left
        hover:bg-axiom-bg-tertiary transition-colors cursor-pointer
        ${isStreaming ? 'animate-pulse' : ''}
      `}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <span className="w-4 flex-shrink-0">
        {kind === 'dir' && (
          isOpen ? (
            <ChevronDown className="w-4 h-4 text-axiom-text-dim" />
          ) : (
            <ChevronRight className="w-4 h-4 text-axiom-text-dim" />
          )
        )}
      </span>

      <span className="flex-shrink-0">
        {kind === 'dir' ? (
          isOpen ? (
            <FolderOpen className="w-4 h-4 text-axiom-primary" />
          ) : (
            <Folder className="w-4 h-4 text-axiom-primary" />
          )
        ) : (
          getFileIcon(name)
        )}
      </span>

      <span className={`
        flex-1 truncate text-sm
        ${kind === 'dir' ? 'text-axiom-text font-medium' : 'text-axiom-text-muted'}
      `}>
        {name}
        {kind === 'dir' && '/'}
      </span>

      {size != null && kind === 'file' && (
        <span className="text-xs text-axiom-text-dim">
          {formatSize(size)}
        </span>
      )}
    </motion.button>
  );
}

export function FileTree() {
  const { files, isStreamingFile } = useBuildStore();

  if (files.length === 0) {
    return <EmptyFiles />;
  }

  return (
    <div className="h-full overflow-auto p-2">
      <div className="space-y-0.5">
        {files.map((file) => (
          <FileItem
            key={file.path}
            name={file.name || file.path.split('/').pop() || ''}
            path={file.path}
            kind={file.kind}
            size={file.size}
            depth={0}
            isStreaming={isStreamingFile && file.path === files[files.length - 1]?.path}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyFiles() {
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
        <Folder className="w-8 h-8 text-axiom-text-dim" />
      </motion.div>

      <h3 className="text-lg font-semibold text-axiom-text mb-2">
        No Files Yet
      </h3>
      <p className="text-axiom-text-muted max-w-md">
        Ask Axiom to build something and watch the file tree come alive.
      </p>
    </motion.div>
  );
}