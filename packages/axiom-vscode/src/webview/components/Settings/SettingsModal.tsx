import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Save } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const PROVIDERS = [
  { id: 'opencode', name: 'OpenCode' },
  { id: 'groq', name: 'Groq' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'google', name: 'Google' },
];

const MODELS: Record<string, string[]> = {
  opencode: ['minimax-m2.5-free'],
  groq: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
  openai: ['gpt-4o', 'gpt-4o-mini'],
  google: ['gemini-2.5-flash', 'gemini-2.0-flash'],
};

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettingsStore();
  const [provider, setProvider] = useState(settings.apiProvider);
  const [model, setModel] = useState(settings.model || 'minimax-m2.5-free');
  const [apiKey, setApiKey] = useState('');

  const modelOptions = useMemo(() => MODELS[provider] || [], [provider]);

  const handleSave = () => {
    updateSettings({ apiProvider: provider, model });
    window.vscode?.postMessage({
      type: 'update_settings',
      settings: { apiProvider: provider, model },
    });

    if (apiKey.trim().length > 0) {
      window.vscode?.postMessage({
        type: 'save_api_key',
        provider,
        apiKey: apiKey.trim(),
      });
      setApiKey('');
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-[360px] bg-axiom-bg-secondary border border-axiom-border rounded-xl shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-axiom-border">
              <div>
                <h2 className="text-sm font-semibold text-axiom-text">Settings</h2>
                <p className="text-xs text-axiom-text-muted">Provider and API key</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-axiom-bg-tertiary"
              >
                <X className="w-4 h-4 text-axiom-text-muted" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="text-xs text-axiom-text-muted">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const next = e.target.value as typeof provider;
                    setProvider(next);
                    const fallback = MODELS[next]?.[0] || '';
                    if (fallback) setModel(fallback);
                  }}
                  className="mt-1 w-full bg-axiom-bg-tertiary text-axiom-text rounded-md px-3 py-2 text-sm border border-axiom-border"
                >
                  {PROVIDERS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-axiom-text-muted">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 w-full bg-axiom-bg-tertiary text-axiom-text rounded-md px-3 py-2 text-sm border border-axiom-border"
                >
                  {modelOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-axiom-text-muted">API Key</label>
                <div className="mt-1 flex items-center gap-2 bg-axiom-bg-tertiary border border-axiom-border rounded-md px-3 py-2">
                  <KeyRound className="w-4 h-4 text-axiom-text-muted" />
                  <input
                    type="password"
                    placeholder="Paste your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-transparent text-sm text-axiom-text outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-axiom-text-dim">
                  Saved securely in VS Code Secrets storage.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-axiom-border">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-axiom-text-muted hover:text-axiom-text"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-axiom-primary text-white rounded-md hover:bg-axiom-primaryHover"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
