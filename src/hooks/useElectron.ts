import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Import types from centralized location
import { ElectronAPI } from '../types/electron';

// Additional API types not in main ElectronAPI
declare global {
  interface Window {
    posAPI?: {
      printPOSReceipt: (receiptData: any) => Promise<any>;
      onBarcodeScanned: (callback: (event: any, barcode: string) => void) => void;
      removeBarcodeListener: (callback: (event: any, barcode: string) => void) => void;
      openCashDrawer: () => Promise<any>;
      showCustomerDisplay: (data: any) => Promise<any>;
      hideCustomerDisplay: () => Promise<any>;
      onPOSShortcut: (callback: (event: any, shortcut: string) => void) => void;
      removePOSShortcutListener: (callback: (event: any, shortcut: string) => void) => void;
    };
    systemAPI?: {
      getSystemInfo: () => any;
      getMemoryUsage: () => any;
      isProduction: boolean;
      isDevelopment: boolean;
    };
  }
}

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if running in Electron
    const checkElectron = () => {
      const isElectronApp = !!(window.electronAPI);
      setIsElectron(isElectronApp);
      
      if (isElectronApp) {
        setPlatform(window.electronAPI?.platform || '');
        
        // Get app version
        window.electronAPI?.getVersion().then(version => {
          setAppVersion(version);
        });
      }
    };

    checkElectron();
  }, []);

  // Navigation handler
  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    const handleNavigation = (event: any, path: string) => {
      navigate(path);
    };

    window.electronAPI?.onNavigate?.(handleNavigation);

    return () => {
      window.electronAPI?.removeNavigateListener?.(handleNavigation);
    };
  }, [isElectron, navigate]);

  // Menu action handler
  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    const handleMenuAction = (event: any, action: string) => {
      switch (action) {
        case 'new-transaction':
          navigate('/pos');
          break;
        case 'print-receipt':
          // Trigger print action
          window.dispatchEvent(new CustomEvent('electron-print-receipt'));
          break;
        default:
          console.log('Unknown menu action:', action);
      }
    };

    window.electronAPI?.onMenuAction?.(handleMenuAction);

    return () => {
      window.electronAPI?.removeMenuActionListener?.(handleMenuAction);
    };
  }, [isElectron, navigate]);

  // Utility functions
  const showMessageBox = useCallback(async (options: any) => {
    if (!isElectron || !window.electronAPI) {
      // Fallback for web
      return window.confirm(options.message);
    }
    return await window.electronAPI.showMessageBox(options);
  }, [isElectron]);

  const showSaveDialog = useCallback(async (options: any) => {
    if (!isElectron || !window.electronAPI) {
      console.warn('Save dialog not available in web mode');
      return null;
    }
    return await window.electronAPI.showSaveDialog(options);
  }, [isElectron]);

  const printReceipt = useCallback(async (options?: any) => {
    if (!isElectron || !window.electronAPI) {
      // Fallback for web - use browser print
      window.print();
      return { success: true };
    }
    return await window.electronAPI.printReceipt(options);
  }, [isElectron]);

  const printPOSReceipt = useCallback(async (receiptData: any) => {
    if (!isElectron || !window.posAPI) {
      // Fallback for web
      window.print();
      return { success: true };
    }
    return await window.posAPI.printPOSReceipt(receiptData);
  }, [isElectron]);

  const getSystemInfo = useCallback(() => {
    if (!isElectron || !window.systemAPI) {
      return {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        isElectron: false
      };
    }
    return {
      ...window.systemAPI.getSystemInfo(),
      isElectron: true
    };
  }, [isElectron]);

  return {
    isElectron,
    appVersion,
    platform,
    showMessageBox,
    showSaveDialog,
    printReceipt,
    printPOSReceipt,
    getSystemInfo,
    isDev: window.electronAPI?.isDev || false,
    isProduction: window.systemAPI?.isProduction || false
  };
};

export default useElectron;
