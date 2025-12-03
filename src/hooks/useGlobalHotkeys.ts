import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

/**
 * Global navigation hotkeys hook
 */
export function useGlobalHotkeys() {
  const navigate = useNavigate();
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

  const getHotkeyValue = (action: string, defaultKey: string) => {
    if (!customHotkeys) return defaultKey;
    return customHotkeys[action]?.toLowerCase() || defaultKey;
  };

  const shortcuts = {
    [getHotkeyValue('dashboard', 'ctrl+1')]: () => navigate('/dashboard'),
    [getHotkeyValue('pos', 'ctrl+2')]: () => navigate('/pos'),
    [getHotkeyValue('products', 'ctrl+3')]: () => navigate('/products'),
    [getHotkeyValue('reports', 'ctrl+4')]: () => navigate('/reports'),
    'ctrl+,': () => navigate('/settings'), // Settings shortcut
  };

  useKeyboardShortcuts(shortcuts, true);
}
