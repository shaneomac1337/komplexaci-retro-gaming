/**
 * useQuickSaveIndicator Hook
 * Manages quick save indicator state for the emulator
 */

import { useState, useCallback } from 'react';

export interface QuickSaveIndicatorState {
  visible: boolean;
  type: 'save' | 'load';
  slot?: number;
}

/**
 * Hook to manage quick save indicator state
 * Provides a convenient way to show the indicator
 */
export function useQuickSaveIndicator() {
  const [state, setState] = useState<QuickSaveIndicatorState>({
    visible: false,
    type: 'save',
    slot: undefined,
  });

  const showSave = useCallback((slot?: number) => {
    setState({ visible: true, type: 'save', slot });
  }, []);

  const showLoad = useCallback((slot?: number) => {
    setState({ visible: true, type: 'load', slot });
  }, []);

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    state,
    showSave,
    showLoad,
    hide,
  };
}
