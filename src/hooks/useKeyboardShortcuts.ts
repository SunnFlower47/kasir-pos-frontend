import { useEffect, useCallback, useState, useMemo } from 'react';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

/**
 * Custom hook for handling keyboard shortcuts
 * @param shortcuts - Object mapping key combinations to functions
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts, enabled: boolean = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in input fields
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    // Handle function keys (F1-F12) - normalize to lowercase
    const key = event.key;
    
    // Safety check: if key is undefined or null, ignore the event
    if (!key) {
      return;
    }
    
    const isFunctionKey = key.startsWith('F') && key.length >= 2 && key.length <= 4;
    const isEscape = key === 'Escape' || key === 'Esc';
    
    // Always allow function keys (F1-F12) and Escape, even in input fields
    if (isInputField && !isFunctionKey && !isEscape) {
      return;
    }

    // Create key combination string
    let keyCombo = '';
    
    if (event.ctrlKey) keyCombo += 'ctrl+';
    if (event.altKey) keyCombo += 'alt+';
    if (event.shiftKey) keyCombo += 'shift+';
    
    if (isFunctionKey) {
      // Handle F1-F12 (F1, F2, ..., F12)
      const functionKeyMatch = key.match(/^F(\d{1,2})$/i);
      if (functionKeyMatch) {
        keyCombo += `f${functionKeyMatch[1]}`;
      } else {
        keyCombo += key.toLowerCase();
      }
    } else if (key === 'Escape' || key === 'Esc') {
      keyCombo += 'escape';
    } else {
      keyCombo += key.toLowerCase();
    }

    // Execute shortcut if it exists
    if (shortcuts[keyCombo]) {
      // Prevent default for function keys to avoid browser default behavior (e.g., F1 = help)
      if (isFunctionKey) {
        event.preventDefault();
      }
      event.stopPropagation();
      
      // Only log in development mode to reduce console spam
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Keyboard Shortcut] Executing: ${keyCombo}`);
      }
      
      shortcuts[keyCombo]();
    }
    // Removed verbose logging for unmapped keys to reduce console spam
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

/**
 * POS-specific keyboard shortcuts hook with customizable hotkeys
 */
export function usePOSShortcuts({
  onFocusBarcode,
  onSubmitTransaction,
  onFocusSearch,
  onCancelTransaction,
  onToggleFullscreen,
}: {
  onFocusBarcode?: () => void;
  onSubmitTransaction?: () => void;
  onFocusSearch?: () => void;
  onCancelTransaction?: () => void;
  onToggleFullscreen?: () => void;
}) {
  const [customHotkeys, setCustomHotkeys] = useState<any>(null);

  useEffect(() => {
    // Load custom hotkeys from localStorage
    const loadHotkeys = () => {
      const saved = localStorage.getItem('hotkeySettings');
      if (saved) {
        setCustomHotkeys(JSON.parse(saved));
      }
    };

    loadHotkeys();

    // Listen for hotkey updates
    const handleHotkeyUpdate = (event: CustomEvent) => {
      setCustomHotkeys(event.detail);
    };

    window.addEventListener('hotkeys-updated', handleHotkeyUpdate as EventListener);
    return () => window.removeEventListener('hotkeys-updated', handleHotkeyUpdate as EventListener);
  }, []);

  // Create shortcuts object dynamically
  const shortcuts = useMemo(() => {
    const getHotkeyValue = (action: string, defaultKey: string) => {
      if (!customHotkeys) {
        // Normalize default key
        return defaultKey.toLowerCase();
      }
      
      const savedKey = customHotkeys[action];
      if (!savedKey) {
        return defaultKey.toLowerCase();
      }
      
      // Normalize the saved key
      let normalizedKey = savedKey.toLowerCase().replace(/\+/g, '+');
      
      // Normalize function keys (F1, F2, etc.) - ensure format is f1, f2, etc.
      const functionKeyMatch = normalizedKey.match(/^f(\d{1,2})$/i);
      if (functionKeyMatch) {
        normalizedKey = `f${functionKeyMatch[1]}`;
      }
      
      return normalizedKey;
    };

    const shortcutMap: { [key: string]: () => void } = {};

    const f1Key = getHotkeyValue('search', 'f1');
    const f2Key = getHotkeyValue('payment', 'f2');
    const f11Key = getHotkeyValue('fullscreen', 'f11');
    const escapeKey = getHotkeyValue('cancel', 'escape');

    shortcutMap[f1Key] = onFocusBarcode || (() => {});
    shortcutMap[f2Key] = onSubmitTransaction || (() => {});
    shortcutMap[f11Key] = onToggleFullscreen || (() => {});
    shortcutMap[escapeKey] = onCancelTransaction || (() => {});
    shortcutMap['ctrl+n'] = onCancelTransaction || (() => {}); // New transaction

    // Removed logging to prevent console spam - shortcuts are working correctly

    return shortcutMap;
  }, [customHotkeys, onFocusBarcode, onSubmitTransaction, onToggleFullscreen, onCancelTransaction]);

  useKeyboardShortcuts(shortcuts, true);
}
