// Electron API types
export interface ElectronAPI {
  // App info
  getVersion: () => Promise<string>;
  
  // Dialog
  showMessageBox: (options: any) => Promise<any>;
  showSaveDialog: (options: any) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  
  // Print methods - NATIVE ELECTRON PRINT (NO POPUP)
  print: () => void;
  
  printReceipt: (options: {
    content?: string;
    receiptData?: any;
    printerName?: string;
    paperSize?: string;
    scaleFactor?: number;
    silent?: boolean;
    copies?: number;
  }) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  
  // Direct print using webContents.print() - NO POPUP
  printDirect: (options?: {
    printerName?: string;
    scaleFactor?: number;
    copies?: number;
    silent?: boolean; // Direct print tanpa popup dialog
  }) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  
  // Print with HTML content - NO POPUP
  printContent: (options: {
    content: string;
    printerName?: string;
    scaleFactor?: number;
    copies?: number;
    silent?: boolean; // Direct print tanpa popup dialog
  }) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  
  getPrinters: () => Promise<{
    success: boolean;
    printers?: any[];
    error?: string;
  }>;
  
  // File operations
  writeFile: (filePath: string, data: any) => Promise<any>;
  
  // Window controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  
  // Development
  openDevTools: () => void;
  
  // Navigation and menu handlers
  onNavigate?: (callback: (event: any, path: string) => void) => void;
  removeNavigateListener?: (callback: (event: any, path: string) => void) => void;
  onMenuAction?: (callback: (event: any, action: string) => void) => void;
  removeMenuActionListener?: (callback: (event: any, action: string) => void) => void;

  // Platform info
  platform?: string;
  isDev?: boolean;

  // Check if we're in Electron
  isElectron: boolean;

  // Legacy IPC renderer (optional)
  ipcRenderer?: {
    send: (channel: string, data?: any) => void;
    invoke: (channel: string, data?: any) => Promise<any>;
    on: (channel: string, callback: any) => void;
    removeListener: (channel: string, callback: any) => void;
    removeAllListeners?: (channel: string) => void;
  };
}

// Extend Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
