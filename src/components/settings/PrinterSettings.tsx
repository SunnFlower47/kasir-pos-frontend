import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PrinterIcon, Cog6ToothIcon, PlayIcon } from '@heroicons/react/24/outline';
import { printerService, ReceiptData } from '../../services/printerService';
import { apiService } from '../../services/api';

interface PrinterConfig {
  template: '58mm' | 'simple' | 'detailed' | 'invoice';
  scale: number;
  autoScale: boolean;
  paperSize: '58mm' | '80mm' | 'A4';
  fontSize: 'small' | 'normal' | 'large';
  printLogo: boolean;
  printHeader: boolean;
  printFooter: boolean;
  printCopies: number;
  autoPrint: boolean;
  printCustomerCopy: boolean;
  marginTop: number;
  marginBottom: number;
  lineSpacing: number;
}

const PrinterSettings: React.FC = () => {

  const [settings, setSettings] = useState<PrinterConfig>({
    template: '58mm',
    scale: 90,
    autoScale: true,
    paperSize: '58mm',
    fontSize: 'normal',
    printLogo: true,
    printHeader: true,
    printFooter: true,
    printCopies: 1,
    autoPrint: false,
    printCustomerCopy: false,
    marginTop: 0,
    marginBottom: 0,
    lineSpacing: 1.2
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [printerName, setPrinterName] = useState('POS-58');
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    loadSettings();
    loadPrinterSettings();
    checkAvailablePrinters();
  }, []);

  const loadSettings = async () => {
    try {
      // Try to load from backend first
      const response = await apiService.getSettings();
      if (response.success && response.data) {
        const printerSettings = response.data.printer || {};
        setSettings(prev => ({
          ...prev,
          template: printerSettings.printer_template || prev.template,
          scale: printerSettings.printer_scale ? parseInt(printerSettings.printer_scale) : prev.scale,
          autoScale: printerSettings.printer_auto_scale === '1' || printerSettings.printer_auto_scale === true || prev.autoScale,
          paperSize: printerSettings.paper_size || prev.paperSize,
          fontSize: printerSettings.font_size || prev.fontSize,
          printLogo: printerSettings.print_logo === '1' || printerSettings.print_logo === true || prev.printLogo,
          printHeader: printerSettings.print_header === '1' || printerSettings.print_header === true || prev.printHeader,
          printFooter: printerSettings.print_footer === '1' || printerSettings.print_footer === true || prev.printFooter,
          printCopies: printerSettings.print_copies ? parseInt(printerSettings.print_copies) : prev.printCopies,
          autoPrint: printerSettings.auto_print === '1' || printerSettings.auto_print === true || prev.autoPrint,
          printCustomerCopy: printerSettings.print_customer_copy === '1' || printerSettings.print_customer_copy === true || prev.printCustomerCopy,
        }));
      }
    } catch (error) {
      console.warn('Failed to load settings from backend, using localStorage fallback:', error);
      // Fallback to localStorage
      const savedSettings = localStorage.getItem('printerSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse saved settings:', e);
        }
      }
    }
  };

  const loadPrinterSettings = () => {
    const savedPrinter = localStorage.getItem('selectedPrinter');
    if (savedPrinter) {
      setPrinterName(savedPrinter);
    }
  };

  const checkAvailablePrinters = async () => {
    try {
      // Check if Electron API is available
      if (!window.electronAPI) {
        const fallbackPrinters = [
          'POS-58',
          'POS-58 (USB001)',
          'Generic / Text Only',
          'Microsoft Print to PDF',
          'Default Printer',
          'Thermal Printer'
        ];
        setAvailablePrinters(fallbackPrinters);
        return;
      }

      if (!window.electronAPI.getPrinters) {
        setAvailablePrinters(['POS-58', 'POS-58 (USB001)', 'Default Printer']);
        return;
      }

      const result = await window.electronAPI.getPrinters();

      if (result && result.success && result.printers && Array.isArray(result.printers)) {
        const printerNames = result.printers.map((p: any) => p.name);
        setAvailablePrinters(printerNames);

        // Auto-select POS printer if found and no printer selected
        const posPrinter = printerNames.find(name =>
          name.toLowerCase().includes('pos') ||
          name.toLowerCase().includes('thermal')
        );
        if (posPrinter && !printerName) {
          setPrinterName(posPrinter);
        }
        return;
      }

      // If API call failed, use fallback
      const fallbackPrinters = [
        'POS-58',
        'POS-58 (USB001)',
        'Generic / Text Only',
        'Microsoft Print to PDF',
        'Default Printer',
        'Thermal Printer'
      ];
      setAvailablePrinters(fallbackPrinters);

    } catch (error: any) {
      console.error('Failed to get printers:', error);

      // Always provide fallback list
      const fallbackPrinters = ['POS-58', 'POS-58 (USB001)', 'Default Printer'];
      setAvailablePrinters(fallbackPrinters);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage first
      localStorage.setItem('printerSettings', JSON.stringify(settings));
      localStorage.setItem('selectedPrinter', printerName);
      
      // Save to backend
      try {
        const settingsArray = [
          { key: 'printer_template', value: settings.template, type: 'string' },
          { key: 'printer_scale', value: settings.scale.toString(), type: 'integer' },
          { key: 'printer_auto_scale', value: settings.autoScale ? '1' : '0', type: 'boolean' },
          { key: 'paper_size', value: settings.paperSize, type: 'string' },
          { key: 'font_size', value: settings.fontSize, type: 'string' },
          { key: 'print_logo', value: settings.printLogo ? '1' : '0', type: 'boolean' },
          { key: 'print_header', value: settings.printHeader ? '1' : '0', type: 'boolean' },
          { key: 'print_footer', value: settings.printFooter ? '1' : '0', type: 'boolean' },
          { key: 'print_copies', value: settings.printCopies.toString(), type: 'integer' },
          { key: 'auto_print', value: settings.autoPrint ? '1' : '0', type: 'boolean' },
          { key: 'print_customer_copy', value: settings.printCustomerCopy ? '1' : '0', type: 'boolean' },
          { key: 'printer_name', value: printerName, type: 'string' },
        ];
        
        const response = await apiService.updateSettings({ settings: settingsArray });
        if (response.success) {
          await printerService.loadSettings(); // Reload settings in service
          toast.success('Pengaturan printer berhasil disimpan');
        } else {
          toast.error('Gagal menyimpan pengaturan ke server, namun tersimpan di lokal');
        }
      } catch (backendError) {
        console.warn('Failed to save to backend:', backendError);
        toast.success('Pengaturan printer tersimpan di lokal (server tidak tersedia)');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Gagal menyimpan pengaturan printer');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {

      // Check if Electron API is available
      if (!window.electronAPI) {
        console.warn('⚠️ Electron API not available, using fallback test');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const isConnected = printerName.toLowerCase().includes('pos') ||
                           printerName.toLowerCase().includes('thermal');
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        toast.success(isConnected ? 'Printer connection test passed (fallback)!' : 'Printer not found');
        return;
      }

      if (!window.electronAPI.getPrinters) {
        console.error('❌ getPrinters method not available');
        throw new Error('getPrinters method not available in Electron API');
      }

      const result = await window.electronAPI.getPrinters();

      if (!result) {
        throw new Error('No response from getPrinters API');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to get printer list from system');
      }

      if (!result.printers || !Array.isArray(result.printers)) {
        throw new Error('Invalid printer data received from system');
      }


      // Find the printer
      const foundPrinter = result.printers.find((p: any) =>
        p.name === printerName ||
        p.name.toLowerCase().includes(printerName.toLowerCase()) ||
        (printerName.includes('POS-58') && p.name.toLowerCase().includes('pos')) ||
        (printerName.includes('POS-58') && p.name.toLowerCase().includes('thermal'))
      );

      if (foundPrinter) {
        const isOnline = foundPrinter.status === 'idle' ||
                        foundPrinter.status === 'printing' ||
                        foundPrinter.status === 'ready' ||
                        foundPrinter.status === 'unknown'; // Sometimes status is unknown but printer works

        setConnectionStatus(isOnline ? 'connected' : 'disconnected');
        toast.success(isOnline ?
          `✅ Printer "${foundPrinter.name}" terhubung dan siap!` :
          `⚠️ Printer "${foundPrinter.name}" ditemukan tapi status: ${foundPrinter.status}`
        );
      } else {
        setConnectionStatus('disconnected');
        toast.error(`❌ Printer "${printerName}" tidak ditemukan di sistem.\nPrinter tersedia: ${result.printers.map((p: any) => p.name).join(', ')}`);
      }

    } catch (error: any) {
      console.error('❌ Connection test error:', error);
      setConnectionStatus('disconnected');

      // More specific error messages
      let errorMessage = 'Gagal menguji koneksi printer';
      if (error.message.includes('timeout')) {
        errorMessage = 'Timeout saat mengakses sistem printer';
      } else if (error.message.includes('not available')) {
        errorMessage = 'API printer tidak tersedia';
      } else if (error.message.includes('Invalid')) {
        errorMessage = 'Data printer tidak valid dari sistem';
      } else {
        errorMessage = `Gagal menguji koneksi printer: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setTestingConnection(false);
    }
  };

  const testPrint = async () => {
    try {
      setTesting(true);
      toast.loading('Melakukan test print...', { id: 'test-print' });


      // Save current settings first
      localStorage.setItem('selectedPrinter', printerName);
      localStorage.setItem('printerSettings', JSON.stringify(settings));

      // Create test receipt data
      const testReceiptData = {
        transaction_id: 'TEST-' + Date.now(),
        date: new Date().toLocaleDateString('id-ID'),
        time: new Date().toLocaleTimeString('id-ID'),
        cashier_name: 'Test Cashier',
        customer_name: 'Test Customer',
        items: [
          { name: 'Test Product 1', quantity: 1, price: 10000, total: 10000 },
          { name: 'Test Product 2', quantity: 2, price: 5000, total: 10000 }
        ],
        subtotal: 20000,
        tax: 2000,
        discount: 0,
        total: 22000,
        payment_method: 'Cash',
        paid_amount: 25000,
        change: 3000,
        company_name: 'Test Company',
        company_address: 'Test Address',
        company_phone: 'Test Phone',
        receipt_footer: 'Terima kasih atas kunjungan Anda!'
      };

      // Use printerService for consistent printing
      const success = await printerService.printReceipt(testReceiptData);

      toast.dismiss('test-print');

      if (success) {
        toast.success(`Test print berhasil dikirim ke printer "${printerName}"!`);
      } else {
        throw new Error('Print failed via printerService');
      }

    } catch (error: any) {
      toast.dismiss('test-print');
      console.error('❌ Test print error:', error);

      let errorMessage = 'Test print gagal. ';
      if (error.message.includes('not found')) {
        errorMessage += `Printer "${printerName}" tidak ditemukan. Pastikan printer terhubung dan driver terinstall.`;
      } else if (error.message.includes('offline')) {
        errorMessage += `Printer "${printerName}" offline. Pastikan printer menyala dan terhubung.`;
      } else {
        errorMessage += `Error: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const handleTemplateChange = (template: '58mm' | 'simple' | 'detailed' | 'invoice') => {
    setSettings(prev => ({ ...prev, template }));
  };

  const handleScaleChange = (scale: number) => {
    setSettings(prev => ({ ...prev, scale }));
  };



  try {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <PrinterIcon className="h-6 w-6 text-gray-400 mr-3" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Pengaturan Printer
            </h3>
          </div>

          {/* Debug Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Debug Info:</h4>
            <p className="text-xs text-blue-800">Component loaded successfully!</p>
            <p className="text-xs text-blue-800">Available printers: {availablePrinters.length}</p>
            <p className="text-xs text-blue-800">Selected printer: {printerName}</p>
            <p className="text-xs text-blue-800">Connection status: {connectionStatus}</p>
          </div>

        <div className="space-y-6">
          {/* Printer Connection Settings */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-4">Koneksi Printer</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Printer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Printer
                </label>
                <select
                  value={printerName}
                  onChange={(e) => setPrinterName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {availablePrinters.map(printer => (
                    <option key={printer} value={printer}>{printer}</option>
                  ))}
                </select>
              </div>

              {/* Connection Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Koneksi
                </label>
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                    connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                    connectionStatus === 'disconnected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500' :
                      connectionStatus === 'disconnected' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {connectionStatus === 'connected' ? 'Terhubung' :
                       connectionStatus === 'disconnected' ? 'Terputus' :
                       'Tidak Diketahui'}
                    </span>
                  </div>

                  <button
                    onClick={testConnection}
                    disabled={testingConnection}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm mr-2"
                  >
                    {testingConnection ? 'Testing...' : 'Test Koneksi'}
                  </button>

                  <button
                    onClick={testPrint}
                    disabled={testingConnection}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    Test Print
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="text-base font-medium text-gray-900">Template Struk</label>
            <p className="text-sm leading-5 text-gray-500">Pilih template yang sesuai dengan printer Anda</p>
            <fieldset className="mt-4">
              <legend className="sr-only">Template options</legend>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="template-58mm"
                    name="template"
                    type="radio"
                    checked={settings.template === '58mm'}
                    onChange={() => handleTemplateChange('58mm')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <label htmlFor="template-58mm" className="ml-3 block text-sm font-medium text-gray-700">
                    58mm Optimal (Recommended)
                    <span className="block text-xs text-gray-500">Dioptimalkan untuk printer thermal 58mm dengan scale 88-92%</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="template-simple"
                    name="template"
                    type="radio"
                    checked={settings.template === 'simple'}
                    onChange={() => handleTemplateChange('simple')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <label htmlFor="template-simple" className="ml-3 block text-sm font-medium text-gray-700">
                    Simple
                    <span className="block text-xs text-gray-500">Template sederhana dengan layout minimal</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="template-detailed"
                    name="template"
                    type="radio"
                    checked={settings.template === 'detailed'}
                    onChange={() => handleTemplateChange('detailed')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <label htmlFor="template-detailed" className="ml-3 block text-sm font-medium text-gray-700">
                    Detailed
                    <span className="block text-xs text-gray-500">Template lengkap dengan informasi detail</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="template-invoice"
                    name="template"
                    type="radio"
                    checked={settings.template === 'invoice'}
                    onChange={() => handleTemplateChange('invoice')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <label htmlFor="template-invoice" className="ml-3 block text-sm font-medium text-gray-700">
                    Invoice
                    <span className="block text-xs text-gray-500">Template invoice formal dengan layout tabel (A4, cocok untuk PDF/print)</span>
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Paper Size & Font Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-base font-medium text-gray-900">Ukuran Kertas</label>
              <select
                value={settings.paperSize}
                onChange={(e) => setSettings(prev => ({ ...prev, paperSize: e.target.value as '58mm' | '80mm' | 'A4' }))}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="58mm">58mm (Thermal Small)</option>
                <option value="80mm">80mm (Thermal Large)</option>
                <option value="A4">A4 (Standard Paper)</option>
              </select>
            </div>

            <div>
              <label className="text-base font-medium text-gray-900">Ukuran Font</label>
              <select
                value={settings.fontSize}
                onChange={(e) => setSettings(prev => ({ ...prev, fontSize: e.target.value as 'small' | 'normal' | 'large' }))}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="small">Kecil</option>
                <option value="normal">Normal</option>
                <option value="large">Besar</option>
              </select>
            </div>
          </div>

          {/* Scale Settings */}
          <div>
            <label className="text-base font-medium text-gray-900">Pengaturan Scale</label>
            <div className="mt-4 space-y-4">
              <div className="flex items-center">
                <input
                  id="auto-scale"
                  name="auto-scale"
                  type="checkbox"
                  checked={settings.autoScale}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoScale: e.target.checked }))}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="auto-scale" className="ml-3 block text-sm font-medium text-gray-700">
                  Gunakan auto scale
                </label>
              </div>

              <div>
                <label htmlFor="scale-range" className="block text-sm font-medium text-gray-700">
                  Scale: {settings.scale}%
                </label>
                <input
                  id="scale-range"
                  type="range"
                  min="70"
                  max="100"
                  value={settings.scale}
                  onChange={(e) => handleScaleChange(parseInt(e.target.value))}
                  className="mt-1 block w-full"
                  disabled={!settings.autoScale}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>70%</span>
                  <span>85%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Print Options */}
          <div>
            <label className="text-base font-medium text-gray-900">Opsi Print</label>
            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <input
                  id="print-logo"
                  type="checkbox"
                  checked={settings.printLogo}
                  onChange={(e) => setSettings(prev => ({ ...prev, printLogo: e.target.checked }))}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="print-logo" className="ml-3 block text-sm font-medium text-gray-700">
                  Print Logo Perusahaan
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="print-header"
                  type="checkbox"
                  checked={settings.printHeader}
                  onChange={(e) => setSettings(prev => ({ ...prev, printHeader: e.target.checked }))}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="print-header" className="ml-3 block text-sm font-medium text-gray-700">
                  Print Header (Nama & Alamat Perusahaan)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="print-footer"
                  type="checkbox"
                  checked={settings.printFooter}
                  onChange={(e) => setSettings(prev => ({ ...prev, printFooter: e.target.checked }))}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="print-footer" className="ml-3 block text-sm font-medium text-gray-700">
                  Print Footer (Pesan Terima Kasih)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="auto-print"
                  type="checkbox"
                  checked={settings.autoPrint}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoPrint: e.target.checked }))}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="auto-print" className="ml-3 block text-sm font-medium text-gray-700">
                  Auto Print Setelah Transaksi
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="print-customer-copy"
                  type="checkbox"
                  checked={settings.printCustomerCopy}
                  onChange={(e) => setSettings(prev => ({ ...prev, printCustomerCopy: e.target.checked }))}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="print-customer-copy" className="ml-3 block text-sm font-medium text-gray-700">
                  Print Copy untuk Pelanggan
                </label>
              </div>
              <div className="flex items-center">
                <label htmlFor="print-copies" className="block text-sm font-medium text-gray-700 mr-3">
                  Jumlah Copy:
                </label>
                <input
                  id="print-copies"
                  type="number"
                  min="1"
                  max="5"
                  value={settings.printCopies}
                  onChange={(e) => setSettings(prev => ({ ...prev, printCopies: parseInt(e.target.value) || 1 }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Recommended Settings */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Cog6ToothIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Pengaturan Rekomendasi
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Gunakan template "58mm Optimal" untuk printer thermal 58mm</li>
                    <li>Set scale ke 88-92% untuk hasil terbaik</li>
                    <li>Aktifkan auto scale untuk konsistensi</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
            <button
              onClick={testPrint}
              disabled={testing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              {testing ? 'Testing...' : 'Test Print'}
            </button>
          </div>
        </div>
      </div>
    </div>
    );
  } catch (error) {
    console.error('❌ PrinterSettings render error:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-900 mb-4">Error Loading Printer Settings</h3>
        <p className="text-red-700">Failed to render printer settings component.</p>
        <p className="text-red-600 text-sm mt-2">Error: {error?.toString()}</p>
      </div>
    );
  }
};

export default PrinterSettings;
