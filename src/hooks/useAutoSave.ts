import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
  onSave: () => void | Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave({ onSave, delay = 30000, enabled = true }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    timeoutRef.current = setTimeout(() => {
      onSave();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onSave, delay, enabled]);
}
