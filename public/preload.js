const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app-version'),
  
  // Dialog methods
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Print methods - NATIVE ELECTRON PRINT (NO POPUP)
  printReceipt: (options) => {
    console.log('🖨️ Preload: printReceipt called with options:', options);
    return ipcRenderer.invoke('print-receipt', options);
  },

  print: () => {
    console.log('🖨️ Preload: Simple print called');
    return ipcRenderer.send('print');
  },

  // Direct print using webContents.print() - NO POPUP
  printDirect: (options = {}) => {
    console.log('🖨️ Preload: Direct print called with options:', options);
    return ipcRenderer.invoke('print-direct', options);
  },

  // Print with HTML content
  printContent: (content, options = {}) => {
    console.log('🖨️ Preload: Print content called');
    return ipcRenderer.invoke('print-content', { content, ...options });
  },

  getPrinters: () => ipcRenderer.invoke('get-printers'),

  // Check if we're in Electron (always true in preload)
  isElectron: true,
  
  // Navigation
  onNavigate: (callback) => ipcRenderer.on('navigate', callback),
  removeNavigateListener: (callback) => ipcRenderer.removeListener('navigate', callback),
  
  // Menu actions
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  removeMenuActionListener: (callback) => ipcRenderer.removeListener('menu-action', callback),
  
  // Platform info
  platform: process.platform,
  
  // Utility methods
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // Development
  isDev: process.env.NODE_ENV === 'development',

  // IPC Communication for debugging
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    on: (channel, callback) => ipcRenderer.on(channel, callback),
    removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback)
  }
});

// Expose a limited API for POS specific functions
contextBridge.exposeInMainWorld('posAPI', {
  // Receipt printing with POS specific options
  printPOSReceipt: (receiptData) => {
    return ipcRenderer.invoke('print-receipt', {
      silent: true,
      printBackground: false,
      margins: {
        marginType: 'minimum'
      },
      pageSize: {
        width: 58000, // 58mm in micrometers
        height: 200000 // Auto height
      }
    });
  },
  
  // Barcode scanner simulation (if hardware integration needed)
  onBarcodeScanned: (callback) => ipcRenderer.on('barcode-scanned', callback),
  removeBarcodeListener: (callback) => ipcRenderer.removeListener('barcode-scanned', callback),
  
  // Cash drawer control (if hardware integration needed)
  openCashDrawer: () => ipcRenderer.invoke('open-cash-drawer'),
  
  // Display customer screen (if dual monitor setup)
  showCustomerDisplay: (data) => ipcRenderer.invoke('show-customer-display', data),
  hideCustomerDisplay: () => ipcRenderer.invoke('hide-customer-display'),
  
  // Keyboard shortcuts for POS
  onPOSShortcut: (callback) => ipcRenderer.on('pos-shortcut', callback),
  removePOSShortcutListener: (callback) => ipcRenderer.removeListener('pos-shortcut', callback)
});

// System information
contextBridge.exposeInMainWorld('systemAPI', {
  // Get system info
  getSystemInfo: () => ({
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }),
  
  // Memory usage
  getMemoryUsage: () => process.memoryUsage(),
  
  // Environment
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development'
});
