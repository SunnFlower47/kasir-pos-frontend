const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Add command line switches to fix throttling and enable JavaScript
app.commandLine.appendSwitch('--disable-ipc-flooding-protection');
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--allow-running-insecure-content');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor,Autofill');
app.commandLine.appendSwitch('--enable-javascript');
app.commandLine.appendSwitch('--disable-dev-shm-usage');
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--disable-gpu-sandbox');

// Reliable production detection for electron-builder
const isDev = !app.isPackaged;

console.log(' Environment Detection:');
console.log('app.isPackaged:', app.isPackaged);
console.log('isDev result:', isDev);
console.log('__dirname:', __dirname);
console.log('process.resourcesPath:', process.resourcesPath);

let mainWindow;

function createWindow() {
  console.log(' Creating main window...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.js'),
      experimentalFeatures: true,
      enableBlinkFeatures: 'CSSColorSchemeUARendering',
      disableBlinkFeatures: 'Autofill',
      additionalArguments: [
        '--disable-ipc-flooding-protection',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor,Autofill',
        '--no-sandbox',
        '--disable-dev-shm-usage'
      ]
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: false,
  });

  console.log('Environment Info:');
  console.log('isDev:', isDev);
  console.log('__dirname:', __dirname);
  console.log('app.getAppPath():', app.getAppPath());

  if (isDev) {
    // Use PORT from environment or default to 4173 (as per package.json)
    const port = process.env.PORT || 4173;
    const startUrl = `http://localhost:${port}`;
    console.log(` Development mode - using ${startUrl}`);
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
    
    mainWindow.loadURL(startUrl);
  } else {
    console.log(' Production mode - starting HTTP server for static files...');

    // Electron-builder specific build path detection
    let buildPath;

    if (process.resourcesPath) {
      // Electron-builder puts extraResources in process.resourcesPath
      buildPath = path.join(process.resourcesPath, 'build');
      console.log(' Trying extraResources path:', buildPath);
    } else {
      // Development fallback
      buildPath = path.join(__dirname, '../build');
      console.log(' Trying development path:', buildPath);
    }

    console.log('Build path exists:', fs.existsSync(buildPath));

    if (!fs.existsSync(buildPath)) {
      console.error(' Build files not found at:', buildPath);

      // Try alternative paths
      const altPaths = [
        path.join(__dirname, '../build'),
        path.join(app.getAppPath(), 'build'),
        path.join(process.cwd(), 'build')
      ];

      console.log('Trying alternative paths:');
      for (const altPath of altPaths) {
        console.log(`  - ${altPath}: ${fs.existsSync(altPath) ? '' : ''}`);
        if (fs.existsSync(altPath)) {
          buildPath = altPath;
          break;
        }
      }

      if (!fs.existsSync(buildPath)) {
        dialog.showErrorBox('Build Files Not Found',
          `Build files not found!\nTried: ${buildPath}\n\nPlease run: npm run build`);
        app.quit();
        return;
      }
    }

    console.log(' Using build path:', buildPath);

    // Use simple HTTP server without Express to avoid path-to-regexp issues
    const http = require('http');
    const url = require('url');
    const mime = require('mime-types');

    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url);
      let pathname = parsedUrl.pathname;

      // Handle SPA routing - serve index.html for all routes
      if (pathname === '/' || !path.extname(pathname)) {
        pathname = '/index.html';
      }

      const filePath = path.join(buildPath, pathname);

      // Check if file exists
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          const mimeType = mime.lookup(filePath) || 'application/octet-stream';

          // Set proper headers
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

          // Read and serve file
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
          return;
        }
      }

      // File not found - serve index.html for SPA routing
      const indexPath = path.join(buildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        const indexStream = fs.createReadStream(indexPath);
        indexStream.pipe(res);
      } else {
        res.statusCode = 404;
        res.end('File not found');
      }
    });

    // Start server
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const startUrl = `http://127.0.0.1:${port}`;
      console.log(' HTTP server started at:', startUrl);

      // Load URL with delay to ensure server is ready
      setTimeout(() => {
        mainWindow.loadURL(startUrl);
      }, 1000); 
    });

    // Handle server errors
    server.on('error', (err) => {
      console.error(' Server error:', err);
      dialog.showErrorBox('Server Error', `Failed to start server: ${err.message}`);
      app.quit();
    });
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Transaction',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-transaction');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('navigate', '/dashboard');
          }
        },
        {
          label: 'POS / Kasir',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('navigate', '/pos');
          }
        },
        {
          label: 'Products',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('navigate', '/products');
          }
        },
        {
          label: 'Reports',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow.webContents.send('navigate', '/reports');
          }
        },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('navigate', '/settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Kasir POS',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Kasir POS',
              message: 'Kasir POS System',
              detail: 'Professional Point of Sale System\nVersion 1.0.0\n\nBuilt with React & Electron'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Helper function to find best printer match
async function findBestPrinter(requestedPrinter) {
  try {
    console.log('🔍 Finding best printer match for:', requestedPrinter);

    if (!requestedPrinter) {
      console.log('📝 No specific printer requested, using default');
      return undefined; // Use system default
    }

    // Try to get actual system printers
    let systemPrinters = [];

    try {
      if (mainWindow && mainWindow.webContents && mainWindow.webContents.getPrinters) {
        systemPrinters = mainWindow.webContents.getPrinters();
      }
    } catch (error) {
      console.log('⚠️ Could not get system printers, using name matching');
    }

    if (systemPrinters.length > 0) {
      console.log('📋 Available system printers:', systemPrinters.map(p => p.name));

      // Exact match first
      const exactMatch = systemPrinters.find(p => p.name === requestedPrinter);
      if (exactMatch) {
        console.log('✅ Found exact printer match:', exactMatch.name);
        return exactMatch.name;
      }

      // Partial match for POS printers
      const partialMatch = systemPrinters.find(p =>
        p.name.toLowerCase().includes(requestedPrinter.toLowerCase()) ||
        (requestedPrinter.toLowerCase().includes('pos') && p.name.toLowerCase().includes('pos')) ||
        (requestedPrinter.toLowerCase().includes('thermal') && p.name.toLowerCase().includes('thermal'))
      );

      if (partialMatch) {
        console.log('✅ Found partial printer match:', partialMatch.name);
        return partialMatch.name;
      }

      console.log('❌ No matching printer found, trying requested name anyway');
    }

    // Return requested printer name even if not found in system list
    // Sometimes the printer exists but getPrinters() doesn't work properly
    console.log('🎯 Using requested printer name:', requestedPrinter);
    return requestedPrinter;

  } catch (error) {
    console.error('❌ Error finding printer:', error);
    return requestedPrinter || undefined;
  }
}

// IPC handlers
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Simple print handler
ipcMain.on('print', (event) => {
  try {
    console.log('🖨️ Simple print requested');

    if (!mainWindow) {
      console.error(' Main window not available');
      return;
    }

    // Print current window content
    mainWindow.webContents.print({
      silent: true, // Automatic printing without dialog
      printBackground: false,
      color: false,
      margins: {
        marginType: 'minimum'
      },
      landscape: false,
      scaleFactor: 92,
      pagesPerSheet: 1,
      collate: false,
      copies: 1,
      header: '',
      footer: ''
    });

    console.log(' Print dialog opened');
  } catch (error) {
    console.error(' Print error:', error);
  }
});

// Get available printers - Enhanced with better error handling
if (!ipcMain.listenerCount('get-printers')) {
  ipcMain.handle('get-printers', async (event) => {
    try {
      console.log('🖨️ Getting available printers...');

      if (!mainWindow) {
        console.error('❌ Main window not available');
        throw new Error('Main window not available');
      }

      if (!mainWindow.webContents) {
        console.error('❌ WebContents not available');
        throw new Error('WebContents not available');
      }

      // Get printers using correct Electron API - DETECT REAL SYSTEM PRINTERS
      let printers = [];

      try {
        // Method 1: Try webContents.getPrintersAsync() (async method in Electron 12+)
        // This is the RECOMMENDED and most reliable method for getting system printers
        if (mainWindow.webContents && typeof mainWindow.webContents.getPrintersAsync === 'function') {
          console.log('📡 Using webContents.getPrintersAsync() - DETECTING REAL SYSTEM PRINTERS');
          printers = await mainWindow.webContents.getPrintersAsync();
          console.log(`✅ Detected ${printers.length} real system printers`);
        }
        // Method 2: Try webContents.getPrinters() (synchronous, available in Electron 5+)
        // This is the standard synchronous API for getting system printers
        else if (mainWindow.webContents && typeof mainWindow.webContents.getPrinters === 'function') {
          console.log('📡 Using webContents.getPrinters() - DETECTING REAL SYSTEM PRINTERS');
          printers = mainWindow.webContents.getPrinters();
          console.log(`✅ Detected ${printers.length} real system printers`);
        }
        // Method 3: Use system command to get printers (FALLBACK - cross-platform)
        // Only used if Electron API is not available
        else {
          console.log('📡 Electron API not available, using system command to detect printers...');
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          
          try {
            let command;
            if (process.platform === 'win32') {
              // Windows: Use PowerShell to get printer list (more reliable than wmic)
              command = 'powershell -Command "Get-Printer | Select-Object Name, PrinterStatus | ConvertTo-Json"';
            } else if (process.platform === 'darwin') {
              // macOS: Use lpstat to get printer list
              command = 'lpstat -p 2>/dev/null';
            } else {
              // Linux: Use lpstat to get printer list
              command = 'lpstat -p 2>/dev/null';
            }

            const { stdout } = await execAsync(command, { timeout: 5000 });
            console.log('📡 System command output received');

            // Parse output and create printer objects
            if (process.platform === 'win32') {
              // Parse Windows PowerShell JSON output
              try {
                const jsonPrinters = JSON.parse(stdout);
                printers = Array.isArray(jsonPrinters) 
                  ? jsonPrinters.map((p, index) => ({
                      name: p.Name || `Printer ${index + 1}`,
                      status: p.PrinterStatus === 3 ? 'idle' : 'unknown',
                      isDefault: index === 0
                    }))
                  : [{
                      name: jsonPrinters.Name || 'Default Printer',
                      status: jsonPrinters.PrinterStatus === 3 ? 'idle' : 'unknown',
                      isDefault: true
                    }];
              } catch (parseError) {
                // Fallback: try simple name extraction
                const lines = stdout.split('\n').filter(line => line.includes('Name'));
                printers = lines.map((line, index) => {
                  const match = line.match(/Name\s*:\s*(.+)/);
                  return {
                    name: match ? match[1].trim() : `Printer ${index + 1}`,
                    status: 'idle',
                    isDefault: index === 0
                  };
                }).filter(p => p.name);
              }
            } else {
              // Parse Unix output (lpstat -p)
              const lines = stdout.split('\n').filter(line => line.includes('printer') || line.includes('is'));
              printers = lines.map((line, index) => {
                const match = line.match(/printer\s+(\S+)/);
                if (match) {
                  return {
                    name: match[1],
                    status: 'idle',
                    isDefault: index === 0
                  };
                }
                return null;
              }).filter(p => p !== null);
            }

            console.log(`✅ Detected ${printers.length} printers from system command`);
          } catch (cmdError) {
            console.error('❌ System command failed:', cmdError.message);
            // Return empty array instead of throwing - user can manually enter printer name
            printers = [];
            console.warn('⚠️ Could not detect printers automatically. User can manually enter printer name.');
          }
        }
      } catch (error) {
        console.error('❌ Error getting printers:', error.message);
        console.error('❌ Error stack:', error.stack);

        // Ultimate fallback - show message but still return empty array
        // User will see empty list and can manually enter printer name
        console.warn('⚠️ Could not detect system printers, returning empty list');
        printers = [];
      }

      if (!Array.isArray(printers)) {
        console.error('❌ Invalid printers data:', printers);
        throw new Error('Invalid printers data received');
      }

      console.log(`✅ Found ${printers.length} printers:`);
      printers.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.name} (${p.status || 'unknown'})`);
      });

      // Check specifically for POS-58 printer
      const pos58Printer = printers.find(p =>
        p.name.toLowerCase().includes('pos-58') ||
        p.name.toLowerCase().includes('pos58') ||
        p.name.toLowerCase().includes('thermal') ||
        p.description?.toLowerCase().includes('pos-58')
      );

      if (pos58Printer) {
        console.log('🎯 Found POS-58/Thermal printer:', pos58Printer.name, 'Status:', pos58Printer.status);
      } else {
        console.log('⚠️ No POS-58/Thermal printer found');
      }

      // Return enhanced printer data
      const enhancedPrinters = printers.map(printer => ({
        name: printer.name,
        status: printer.status || 'unknown',
        isDefault: printer.isDefault || false,
        description: printer.description || '',
        displayName: printer.displayName || printer.name,
        options: printer.options || {}
      }));

      return {
        success: true,
        printers: enhancedPrinters,
        count: enhancedPrinters.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Get printers error:', error.message);
      console.error('❌ Error stack:', error.stack);

      return {
        success: false,
        error: error.message,
        printers: [],
        count: 0,
        timestamp: new Date().toISOString()
      };
    }
  });
} else {
  console.log('⚠️ get-printers handler already registered, skipping...');
}

// Direct print handler - NO POPUP, NATIVE ELECTRON
// Check if handler already exists to prevent duplicate registration
if (!ipcMain.listenerCount('print-direct')) {
  ipcMain.handle('print-direct', async (event, options = {}) => {
  try {
    console.log('🖨️ Direct print requested (NO POPUP):', options);

    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    // Use webContents.print() with silent: true - NO POPUP
    // CRITICAL: Always use silent mode for direct printing (NO POPUP)
    const printOptions = {
      silent: options.silent !== undefined ? options.silent : true, // CRITICAL: No popup dialog (default: true)
      printBackground: false,
      color: false,
      margins: {
        marginType: 'minimum'
      },
      landscape: false,
      scaleFactor: options.scaleFactor || 92,
      pagesPerSheet: 1,
      collate: false,
      copies: options.copies || 1,
      header: '',
      footer: '',
      // CRITICAL: Use exact printer name or find best match
      deviceName: await findBestPrinter(options.printerName)
    };

    console.log('🖨️ Using print options (silent mode):', printOptions);
    console.log('🎯 Target printer:', printOptions.deviceName || 'Default');

    // Enhanced print with Promise for better error handling
    return new Promise((resolve) => {
      try {
        mainWindow.webContents.print(printOptions, (success, failureReason) => {
          if (success) {
            console.log('✅ Direct print sent to printer successfully');
            console.log('🖨️ Print job sent to:', printOptions.deviceName || 'Default printer');
            resolve({ success: true, message: 'Print sent to printer successfully' });
          } else {
            console.error('❌ Direct print failed:', failureReason);
            console.error('🖨️ Failed printer:', printOptions.deviceName || 'Default');

            // Try fallback without specific printer name
            if (printOptions.deviceName) {
              console.log('🔄 Trying fallback with default printer...');
              const fallbackOptions = { ...printOptions, deviceName: undefined };

              mainWindow.webContents.print(fallbackOptions, (fallbackSuccess, fallbackReason) => {
                if (fallbackSuccess) {
                  console.log('✅ Fallback print successful with default printer');
                  resolve({ success: true, message: 'Print sent via default printer' });
                } else {
                  console.error('❌ Fallback print also failed:', fallbackReason);
                  resolve({ success: false, error: `Print failed: ${failureReason}. Fallback: ${fallbackReason}` });
                }
              });
            } else {
              resolve({ success: false, error: `Print failed: ${failureReason}` });
            }
          }
        });
      } catch (error) {
        console.error('❌ Print exception:', error);
        resolve({ success: false, error: error.message });
      }
    });

  } catch (error) {
    console.error('❌ Direct print error:', error);
    return {
      success: false,
      error: error.message
    };
  }
  });
} else {
  console.log('⚠️ print-direct handler already registered, skipping...');
}

// Print content handler - Print HTML content directly
// Check if handler already exists to prevent duplicate registration
if (!ipcMain.listenerCount('print-content')) {
  ipcMain.handle('print-content', async (event, params) => {
  try {
    console.log('🖨️ Print content requested (NO POPUP)');
    console.log('📝 Raw params received:', params);
    console.log('📝 Params type:', typeof params);
    console.log('📝 Params keys:', params ? Object.keys(params) : 'NO KEYS');

    // More robust parameter extraction
    let content, options;

    if (typeof params === 'string') {
      // Direct string content
      content = params;
      options = {};
      console.log('📝 Direct string content detected');
    } else if (params && typeof params === 'object') {
      // Object with content property
      if (params.content && typeof params.content === 'string') {
        content = params.content;
        options = {
          printerName: params.printerName,
          scaleFactor: params.scaleFactor,
          copies: params.copies,
          silent: params.silent !== undefined ? params.silent : true // Default to silent (no popup)
        };
        console.log('📝 Object with content property detected');
      } else {
        console.error('❌ Object received but no valid content property');
        console.error('📝 Object structure:', JSON.stringify(params, null, 2));
        throw new Error('Invalid content structure - object must have content property');
      }
    } else {
      console.error('❌ Invalid params type:', typeof params);
      throw new Error('Invalid parameters - must be string or object with content');
    }

    console.log('📝 Final extracted content type:', typeof content);
    console.log('📝 Final content length:', content?.length || 0);
    console.log('📝 Final content preview:', content?.substring(0, 100) || 'NO CONTENT');
    console.log('📝 Final options:', options);

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('Invalid content - must be non-empty string');
    }

    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    // Create a temporary window for printing content - PROPER 58MM SIZE
    const printWindow = new BrowserWindow({
      width: 250, // Proper 58mm width (58mm ≈ 220px at 96dpi, but 250px safer)
      height: 800, // Taller for long receipts
      show: false, // Don't show the window
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: false // Allow data URLs
      }
    });

    // CRITICAL: Validate content before loading
    if (!content || content.trim().length === 0) {
      console.error('❌ Empty content provided for printing');
      printWindow.close();
      throw new Error('Empty content provided for printing');
    }

    console.log('✅ Content validation passed - content length:', content.length);
    console.log('📝 Content preview (first 300 chars):', content.substring(0, 300));

    // Load the HTML content
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);

    // Print options for content - OPTIMIZED FOR POS-58
    // CRITICAL: Always use silent mode for direct printing (NO POPUP)
    const printOptions = {
      silent: options.silent !== undefined ? options.silent : true, // CRITICAL: No popup dialog (default: true)
      printBackground: true, // CRITICAL: Include background elements
      color: false, // Black and white for thermal
      margins: {
        marginType: 'minimum' // Minimal margins for thermal
      },
      landscape: false,
      scaleFactor: options.scaleFactor || 85, // Smaller scale for 58mm
      pagesPerSheet: 1,
      collate: false,
      copies: options.copies || 1,
      header: '',
      footer: '',
      pageSize: 'A4', // Let printer handle the size
      deviceName: options.printerName || undefined
    };

    console.log('🖨️ Printing content with options (silent mode):', printOptions);
    console.log('🎯 Target printer for content:', printOptions.deviceName || 'Default');

    // CRITICAL: Wait for content to finish loading before printing
    return new Promise((resolve) => {
      try {
        // Wait for page to finish loading completely
        printWindow.webContents.once('did-finish-load', () => {
          console.log('✅ Print window content finished loading');

          // Add small delay to ensure rendering is complete
          setTimeout(() => {
            console.log('🖨️ Starting print after render delay...');

            printWindow.webContents.print(printOptions, (success, failureReason) => {
              if (success) {
                console.log('✅ Content print sent to printer successfully');
                console.log('🖨️ Content print job sent to:', printOptions.deviceName || 'Default printer');
                printWindow.close();
                resolve({ success: true, message: 'Content print sent to printer successfully' });
              } else {
                console.error('❌ Content print failed:', failureReason);
                console.error('🖨️ Failed printer for content:', printOptions.deviceName || 'Default');

                // Try fallback without specific printer name
                if (printOptions.deviceName) {
                  console.log('🔄 Trying content print fallback with default printer...');
                  const fallbackOptions = { ...printOptions, deviceName: undefined };

                  printWindow.webContents.print(fallbackOptions, (fallbackSuccess, fallbackReason) => {
                    printWindow.close();
                    if (fallbackSuccess) {
                      console.log('✅ Content print fallback successful with default printer');
                      resolve({ success: true, message: 'Content print sent via default printer' });
                    } else {
                      console.error('❌ Content print fallback also failed:', fallbackReason);
                      resolve({ success: false, error: `Content print failed: ${failureReason}. Fallback: ${fallbackReason}` });
                    }
                  });
                } else {
                  printWindow.close();
                  resolve({ success: false, error: `Content print failed: ${failureReason}` });
                }
              }
            });
          }, 1000); // 1 second delay to ensure rendering is complete
        });

        // Timeout fallback in case did-finish-load doesn't fire
        setTimeout(() => {
          console.warn('⚠️ Print timeout - forcing print without waiting');
          if (!printWindow.isDestroyed()) {
            printWindow.webContents.print(printOptions, (success, failureReason) => {
              if (!printWindow.isDestroyed()) {
                printWindow.close();
              }
              resolve({
                success: success,
                message: success ? 'Print sent (timeout fallback)' : `Print failed: ${failureReason}`
              });
            });
          }
        }, 5000); // 5 second timeout

      } catch (error) {
        console.error('❌ Content print exception:', error);
        if (!printWindow.isDestroyed()) {
          printWindow.close();
        }
        resolve({ success: false, error: error.message });
      }
    });

  } catch (error) {
    console.error('❌ Print content error:', error);
    return {
      success: false,
      error: error.message
    };
  }
  });
} else {
  console.log('⚠️ print-content handler already registered, skipping...');
}

// Print receipt handler
ipcMain.handle('print-receipt', async (event, options) => {
  try {
    console.log('🖨️ Print receipt requested:', options);

    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    // Create receipt HTML content if provided
    let printContent = '';
    if (options?.receiptData) {
      printContent = generateReceiptHTML(options.receiptData);
    } else if (options?.content) {
      printContent = options.content;
    }

    // Create print window for receipt
    const printWindow = new BrowserWindow({
      width: 220, // 58mm width
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Load receipt content
    if (printContent) {
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(printContent)}`);
    } else {
      // Print current window content
      await printWindow.loadURL(mainWindow.webContents.getURL());
    }

    // Get available printers to find POS-58
    const printers = printWindow.webContents.getPrinters();
    console.log('🖨️ Available printers for print:', printers.map(p => p.name));

    // Find POS-58 printer
    let targetPrinter = printers.find(p =>
      p.name.toLowerCase().includes('pos-58') ||
      p.name.toLowerCase().includes('pos58') ||
      p.name === 'POS-58' ||
      p.name === 'POS-58 (USB001)'
    );

    if (!targetPrinter) {
      // Try to find by description or fallback
      targetPrinter = printers.find(p =>
        p.description?.toLowerCase().includes('pos') ||
        p.description?.toLowerCase().includes('thermal')
      );
    }

    const printerName = targetPrinter ? targetPrinter.name : (options?.printerName || 'POS-58');
    console.log('🎯 Using printer:', printerName);

    // Create print options for POS-58 thermal printer
    const printOptions = {
      silent: true, // Always silent for automatic printing
      printBackground: false,
      color: false,
      margins: {
        marginType: 'minimum',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      },
      landscape: false,
      scaleFactor: 92, // Optimal for 58mm
      pagesPerSheet: 1,
      collate: false,
      copies: options?.copies || 1,
      header: '',
      footer: '',
      deviceName: printerName,
      pageSize: {
        width: 58000, // 58mm in micrometers
        height: 200000 // Auto height
      }
    };

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('📄 Generating PDF first...');

    // Generate PDF first
    const pdfOptions = {
      marginsType: 1, // No margins
      pageSize: {
        width: 58000, // 58mm in micrometers
        height: 200000 // Auto height
      },
      printBackground: false,
      printSelectionOnly: false,
      landscape: false
    };

    const pdfBuffer = await printWindow.webContents.printToPDF(pdfOptions);
    console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes');

    // Save PDF to temp file
    const os = require('os');
    const tempPdfPath = path.join(os.tmpdir(), `receipt_${Date.now()}.pdf`);
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    console.log('💾 PDF saved to:', tempPdfPath);

    // Close HTML window
    printWindow.close();

    // Create PDF window for printing
    const pdfWindow = new BrowserWindow({
      width: 220,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        plugins: true
      }
    });

    // Load PDF file
    await pdfWindow.loadFile(tempPdfPath);
    console.log('📖 PDF loaded in print window');

    // Wait for PDF to load
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('🖨️ Printing PDF with options:', printOptions);

    // Print the PDF
    const result = await pdfWindow.webContents.print(printOptions);

    // Close PDF window
    pdfWindow.close();

    // Clean up temp file
    try {
      fs.unlinkSync(tempPdfPath);
      console.log('🗑️ Temp PDF file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup temp file:', cleanupError.message);
    }

    console.log('✅ Print result:', result);
    return { success: true, result, method: 'pdf-first' };

  } catch (error) {
    console.error('❌ Print error:', error);
    return { success: false, error: error.message };
  }
});

// Alternative PDF-based print handler for problematic printers
ipcMain.handle('print-receipt-pdf', async (event, options) => {
  try {
    console.log('🖨️ PDF-based print requested:', options);

    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    // Create receipt HTML content
    let printContent = '';
    if (options?.receiptData) {
      printContent = generateReceiptHTML(options.receiptData);
    } else if (options?.content) {
      printContent = options.content;
    } else {
      throw new Error('No content provided for printing');
    }

    // Create hidden window for HTML to PDF conversion
    const htmlWindow = new BrowserWindow({
      width: 220, // 58mm width
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Load HTML content
    await htmlWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(printContent)}`);

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📄 Converting HTML to PDF...');

    // Generate PDF with thermal printer optimized settings
    const pdfOptions = {
      marginsType: 1, // No margins
      pageSize: {
        width: 58000, // 58mm in micrometers
        height: 200000 // Auto height
      },
      printBackground: false,
      printSelectionOnly: false,
      landscape: false,
      scaleFactor: 100
    };

    const pdfBuffer = await htmlWindow.webContents.printToPDF(pdfOptions);
    console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes');

    // Close HTML window
    htmlWindow.close();

    // Save PDF to temp file
    const os = require('os');
    const tempPdfPath = path.join(os.tmpdir(), `receipt_${Date.now()}.pdf`);
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    console.log('💾 PDF saved to:', tempPdfPath);

    // Use shell to open PDF with default PDF viewer for printing
    // This is more reliable than trying to print directly
    shell.openPath(tempPdfPath);

    console.log('📖 PDF opened with default viewer for printing');

    // Clean up temp file after delay
    setTimeout(() => {
      try {
        if (fs.existsSync(tempPdfPath)) {
          fs.unlinkSync(tempPdfPath);
          console.log('🗑️ Temp PDF file cleaned up');
        }
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp file:', cleanupError.message);
      }
    }, 30000); // 30 seconds delay

    return { success: true, method: 'pdf-viewer', pdfPath: tempPdfPath };

  } catch (error) {
    console.error('❌ PDF print error:', error);
    return { success: false, error: error.message };
  }
});

// Generate receipt HTML for thermal printer
function generateReceiptHTML(receiptData) {
  console.log('📄 Generating receipt HTML with data:', receiptData);

  const {
    items,
    customer,
    total,
    discount = 0,
    timestamp,
    cashier,
    paymentMethod,
    paidAmount,
    change,
    company_name = 'KASIR POS SYSTEM',
    company_address = 'Jl. Contoh No. 123',
    company_phone = 'Telp: 021-12345678',
    receipt_footer = 'Terima kasih atas kunjungan Anda!'
  } = receiptData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          size: 58mm auto;
          margin: 2mm;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.2;
          margin: 0;
          padding: 2mm;
          width: 54mm;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-bottom: 1px dashed #000; margin: 2px 0; }
        .item { display: flex; justify-content: space-between; margin: 1px 0; }
        .total { font-weight: bold; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="center bold">${company_name}</div>
      <div class="center">${company_address}</div>
      <div class="center">${company_phone}</div>
      <div class="line"></div>

      <div>Tanggal: ${new Date(timestamp).toLocaleDateString('id-ID')}</div>
      <div>Waktu: ${new Date(timestamp).toLocaleTimeString('id-ID')}</div>
      <div>Kasir: ${cashier || 'Admin'}</div>
      ${customer ? `<div>Pelanggan: ${customer.name}</div>` : ''}
      <div class="line"></div>

      ${items.map(item => `
        <div class="item">
          <span>${item.product?.name || item.name}</span>
        </div>
        <div class="item">
          <span>${item.quantity} x ${(item.product?.selling_price || item.price).toLocaleString('id-ID')}</span>
          <span>Rp ${(item.quantity * (item.product?.selling_price || item.price)).toLocaleString('id-ID')}</span>
        </div>
      `).join('')}

      <div class="line"></div>
      <div class="item total">
        <span>Subtotal:</span>
        <span>Rp ${(total + (discount || 0)).toLocaleString('id-ID')}</span>
      </div>
      ${discount > 0 ? `
        <div class="item">
          <span>Diskon:</span>
          <span>-Rp ${discount.toLocaleString('id-ID')}</span>
        </div>
      ` : ''}
      <div class="item total">
        <span>TOTAL:</span>
        <span>Rp ${total.toLocaleString('id-ID')}</span>
      </div>
      <div class="item">
        <span>Bayar (${paymentMethod || 'Cash'}):</span>
        <span>Rp ${(paidAmount || total).toLocaleString('id-ID')}</span>
      </div>
      <div class="item">
        <span>Kembali:</span>
        <span>Rp ${(change || 0).toLocaleString('id-ID')}</span>
      </div>

      <div class="line"></div>
      <div class="center">${receipt_footer}</div>
      <div class="center">Barang yang sudah dibeli</div>
      <div class="center">tidak dapat dikembalikan</div>
    </body>
    </html>
  `;
}

// Save dialog handler
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Open dialog handler
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
