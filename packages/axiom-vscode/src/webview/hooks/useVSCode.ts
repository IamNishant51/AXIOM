import { useEffect, useCallback, useState } from 'react';

declare global {
  interface Window {
    vscode?: {
      postMessage: (message: unknown) => void;
      getState?: () => Record<string, unknown> | undefined;
      setState?: (state: Record<string, unknown>) => void;
    };
  }
}

type MessageHandler = (data: unknown) => void;

export function useVSCode() {
  const postMessage = useCallback((message: unknown) => {
    window.vscode?.postMessage(message);
  }, []);

  return { postMessage };
}

export function useVSCodeMessage(handler: MessageHandler) {
  useEffect(() => {
    const handlerWrapper = (event: MessageEvent) => {
      handler(event.data);
    };

    window.addEventListener('message', handlerWrapper);

    return () => {
      window.removeEventListener('message', handlerWrapper);
    };
  }, [handler]);
}

export function useVSCodeState<T>(key: string, initialValue: T) {
  const savedState = (window.vscode?.getState?.()?.[key] as T) ?? initialValue;
  const [state, setState] = useState<T>(savedState);

  useEffect(() => {
    const currentState = window.vscode?.getState?.() || {};
    window.vscode?.setState?.({ ...currentState, [key]: state });
  }, [key, state]);

  return [state, setState] as const;
}
