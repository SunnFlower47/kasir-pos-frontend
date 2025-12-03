import { apiService } from './api';
import toast from 'react-hot-toast';

export interface PrinterSettings {
  printer_name: string;
  printer_type: string;
  paper_size: string;
  print_logo: boolean;
  print_header: boolean;
  print_footer: boolean;
  font_size: string;
  print_copies: number;
  auto_print: boolean;
  print_customer_copy: boolean;
  scale?: number;
}

export interface ReceiptData {
  transaction_id: string;
  date: string;
  time: string;
  cashier_name: string;
  customer_name?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  paid_amount: number;
  change: number;
  company_name: string;
  company_address: string;
  company_phone: string;
  receipt_footer: string;
}

interface CompanySettings {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_npwp: string;
  company_logo: string | null;
  app_name: string;
  app_logo: string | null;
  receipt_header: string;
  receipt_footer: string;
  tax_enabled: boolean;
  tax_name: string;
  tax_rate: number;
  currency_symbol: string;
  currency_position: 'before' | 'after';
  decimal_places: number;
}

class PrinterService {
  private settings: PrinterSettings | null = null;
  private companySettings: CompanySettings | null = null;

  // Helper function to flatten grouped settings response
  private flattenSettings(settingsResponse: any): { printer: any; company: any } {
    const flatPrinter: any = {};
    const flatCompany: any = {};

    // Flatten grouped settings
    Object.values(settingsResponse).forEach((group: any) => {
      if (Array.isArray(group)) {
        group.forEach((setting: any) => {
          const key = setting.key;
          let value = setting.value;

          // Convert based on type
          if (setting.type === 'boolean') {
            value = value === '1' || value === true;
          } else if (setting.type === 'integer') {
            value = parseInt(value) || 0;
          } else if (setting.type === 'json') {
            try {
              value = JSON.parse(value);
            } catch (e) {
              // Ignore parse errors
            }
          }

          // Categorize settings
          const printerKeys = [
            'printer_name', 'printer_type', 'paper_size', 'print_logo', 'print_header',
            'print_footer', 'font_size', 'print_copies', 'auto_print', 'print_customer_copy',
            'printer_template', 'printer_scale', 'printer_auto_scale'
          ];

          if (printerKeys.includes(key)) {
            flatPrinter[key] = value;
          } else {
            flatCompany[key] = value;
          }
        });
      }
    });

    return { printer: flatPrinter, company: flatCompany };
  }

  async loadSettings(): Promise<PrinterSettings> {
    try {
      const response = await apiService.getSettings();
      if (response.success && response.data) {
        const { printer, company } = this.flattenSettings(response.data);
        
        // Load printer settings
        this.settings = {
          printer_name: printer.printer_name || 'Default Printer',
          printer_type: printer.printer_type || 'thermal',
          paper_size: printer.paper_size || '58mm',
          print_logo: printer.print_logo !== undefined ? printer.print_logo : true,
          print_header: printer.print_header !== undefined ? printer.print_header : true,
          print_footer: printer.print_footer !== undefined ? printer.print_footer : true,
          font_size: printer.font_size || 'normal',
          print_copies: printer.print_copies || 1,
          auto_print: printer.auto_print !== undefined ? printer.auto_print : false,
          print_customer_copy: printer.print_customer_copy !== undefined ? printer.print_customer_copy : false,
          scale: printer.printer_scale ? parseInt(printer.printer_scale) : undefined,
        };

        // Load company settings
        this.companySettings = {
          company_name: company.company_name || 'KASIR POS SYSTEM',
          company_address: company.company_address || '',
          company_phone: company.company_phone || '',
          company_email: company.company_email || '',
          company_website: company.company_website || '',
          company_npwp: company.company_npwp || '',
          company_logo: company.company_logo || null,
          app_name: company.app_name || 'Kasir POS',
          app_logo: company.app_logo || null,
          receipt_header: company.receipt_header || '',
          receipt_footer: company.receipt_footer || 'Terima kasih atas kunjungan Anda!',
          tax_enabled: company.tax_enabled !== undefined ? company.tax_enabled : false,
          tax_name: company.tax_name || 'PPN',
          tax_rate: company.tax_rate || 11,
          currency_symbol: company.currency_symbol || 'Rp',
          currency_position: company.currency_position || 'before',
          decimal_places: company.decimal_places || 0,
        };

        return this.settings;
      }
      throw new Error('Failed to load printer settings');
    } catch (error) {
      console.error('Error loading printer settings:', error);
      // Use default settings
      this.settings = {
        printer_name: 'Default Printer',
        printer_type: 'thermal',
        paper_size: '58mm',
        print_logo: true,
        print_header: true,
        print_footer: true,
        font_size: 'normal',
        print_copies: 1,
        auto_print: false,
        print_customer_copy: false,
      };
      
      this.companySettings = {
        company_name: 'KASIR POS SYSTEM',
        company_address: '',
        company_phone: '',
        company_email: '',
        company_website: '',
        company_npwp: '',
        company_logo: null,
        app_name: 'Kasir POS',
        app_logo: null,
        receipt_header: '',
        receipt_footer: 'Terima kasih atas kunjungan Anda!',
        tax_enabled: false,
        tax_name: 'PPN',
        tax_rate: 11,
        currency_symbol: 'Rp',
        currency_position: 'before',
        decimal_places: 0,
      };
      
      return this.settings;
    }
  }

  /**
   * Get outlet data by ID
   */
  private async getOutletData(outletId: number): Promise<any | null> {
    try {
      const response = await apiService.getOutlet(outletId);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching outlet data:', error);
      return null;
    }
  }

  /**
   * Get company settings with outlet priority
   * Priority: Outlet data > Settings global > Default values
   */
  async getCompanySettings(outletId?: number | null): Promise<CompanySettings> {
    // Load settings first
    if (!this.companySettings) {
      await this.loadSettings();
    }

    const defaultSettings: CompanySettings = {
      company_name: 'KASIR POS SYSTEM',
      company_address: '',
      company_phone: '',
      company_email: '',
      company_website: '',
      company_npwp: '',
      company_logo: null,
      app_name: 'Kasir POS',
      app_logo: null,
      receipt_header: '',
      receipt_footer: 'Terima kasih atas kunjungan Anda!',
      tax_enabled: false,
      tax_name: 'PPN',
      tax_rate: 11,
      currency_symbol: 'Rp',
      currency_position: 'before',
      decimal_places: 0,
    };

    // Start with settings global as base
    const baseSettings = this.companySettings || defaultSettings;

    // If outletId is provided, try to fetch outlet data and merge
    if (outletId) {
      const outletData = await this.getOutletData(outletId);
      if (outletData) {
        // Merge: Outlet data takes priority over settings
        const baseUrl = process.env.REACT_APP_API_URL || 'https://kasir-pos-api.sunnflower.site';
        
        return {
          ...baseSettings,
          // Outlet data (priority)
          company_name: outletData.name || baseSettings.company_name,
          company_address: outletData.address || baseSettings.company_address,
          company_phone: outletData.phone || baseSettings.company_phone,
          company_email: outletData.email || baseSettings.company_email,
          company_website: outletData.website || baseSettings.company_website,
          company_npwp: outletData.npwp || baseSettings.company_npwp,
          company_logo: outletData.logo 
            ? (outletData.logo.startsWith('http') 
                ? outletData.logo 
                : `${baseUrl.replace('/api/v1', '')}/storage/${outletData.logo}`)
            : baseSettings.company_logo,
          // Keep app settings from baseSettings (not from outlet)
        };
      }
    }

    return baseSettings;
  }

  async printReceipt(receiptData: ReceiptData, outletId?: number | null): Promise<boolean> {
    try {
      const startTime = Date.now();

      // Check environment
      const isElectron = !!window.electronAPI;

      // Load settings if not loaded
      if (!this.settings || !this.companySettings) {
        await this.loadSettings();
      }

      // Determine outlet_id: use provided parameter, or get from user context
      let finalOutletId: number | null = outletId || null;
      
      // If not provided, try to get from user context
      if (!finalOutletId) {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            finalOutletId = user?.outlet_id || user?.outlet?.id || null;
          }
        } catch (e) {
          console.warn('Could not get outlet_id from user context');
        }
      }

      // Get company settings with outlet priority
      const companySettings = await this.getCompanySettings(finalOutletId);

      // Merge company settings into receipt data if not provided
      // Priority: receiptData > outlet/companySettings > default
      const mergedReceiptData: ReceiptData = {
        ...receiptData,
        company_name: receiptData.company_name || companySettings.company_name,
        company_address: receiptData.company_address || companySettings.company_address,
        company_phone: receiptData.company_phone || companySettings.company_phone,
        receipt_footer: receiptData.receipt_footer || companySettings.receipt_footer,
      };

      const printContent = this.generateReceiptHTML(mergedReceiptData);
      const copies = this.settings?.print_copies || 1;

      // Print for the number of copies specified
      for (let i = 0; i < copies; i++) {
        await this.sendToPrinter(printContent, mergedReceiptData);

        // If customer copy is enabled, print additional copy
        if (this.settings?.print_customer_copy && i === 0) {
          const customerCopyContent = this.generateReceiptHTML(mergedReceiptData, true);
          await this.sendToPrinter(customerCopyContent, mergedReceiptData);
        }
      }

      return true;
    } catch (error: any) {
      console.error('❌ Print error:', error);
      console.error('❌ Error stack:', error.stack);
      toast.error('Gagal mencetak struk: ' + error.message);
      return false;
    }
  }

  private async sendToPrinter(content: string, receiptData?: ReceiptData): Promise<void> {
    try {
      // Try direct text print first for thermal printers
      if (receiptData && (this.settings?.printer_name?.toLowerCase().includes('pos') ||
          this.settings?.printer_name?.toLowerCase().includes('thermal'))) {
        try {
          await this.printDirectText(receiptData);
          return;
        } catch (error) {
          // Fallback to HTML method
        }
      }

      // Try Electron print (HTML method)
      if (window.electronAPI) {
        await this.printViaElectron(content, receiptData);
        return;
      }

      // Fallback to browser print
      await this.printViaBrowser(content);
    } catch (error) {
      console.error('❌ Print failed:', error);
      throw error;
    }
  }



  private async printViaBrowser(content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if we're in Electron environment
        if (window.electronAPI !== undefined) {
          // Use Electron's direct printing
          this.printViaElectron(content).then(resolve).catch(reject);
          return;
        }

        // Browser printing: Open popup window with receipt content
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!printWindow) {
          // If popup is blocked, try to use current window
          console.warn('⚠️ Popup blocked, trying to print in current window');
          
          // Create a temporary container for the receipt
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          tempDiv.style.position = 'fixed';
          tempDiv.style.left = '-9999px';
          document.body.appendChild(tempDiv);
          
          // Replace current document temporarily
          const originalBody = document.body.innerHTML;
          document.body.innerHTML = content;
          
          // Wait for content to load, then trigger print
          setTimeout(() => {
            window.print();
            
            // Restore original body after a short delay
            setTimeout(() => {
              document.body.innerHTML = originalBody;
              if (tempDiv.parentNode) {
                tempDiv.parentNode.removeChild(tempDiv);
              }
              resolve();
            }, 500);
          }, 300);
          return;
        }

        // Write content to the new window
        printWindow.document.open();
        printWindow.document.write(content);
        printWindow.document.close();

        // Wait for content to load, then trigger print dialog
        printWindow.onload = () => {
          setTimeout(() => {
            try {
              printWindow.focus();
              printWindow.print();
              
              // Close window after printing (user can cancel in print dialog)
              // Wait a bit before closing to allow print dialog to open
              setTimeout(() => {
                if (printWindow && !printWindow.closed) {
                  printWindow.close();
                }
                resolve();
              }, 1000);
            } catch (error) {
              console.error('Error triggering print:', error);
              if (printWindow && !printWindow.closed) {
                printWindow.close();
              }
              reject(error);
            }
          }, 300);
        };

        // Fallback: If onload doesn't fire, wait a bit then print
        setTimeout(() => {
          if (printWindow && !printWindow.closed && printWindow.document.readyState === 'complete') {
            try {
              printWindow.focus();
              printWindow.print();
              
              setTimeout(() => {
                if (printWindow && !printWindow.closed) {
                  printWindow.close();
                }
                resolve();
              }, 1000);
            } catch (error) {
              console.error('Error in fallback print:', error);
              if (printWindow && !printWindow.closed) {
                printWindow.close();
              }
              reject(error);
            }
          } else if (printWindow && !printWindow.closed) {
            // If window is still open but readyState check failed, try anyway
            try {
              printWindow.focus();
              printWindow.print();
              setTimeout(() => {
                if (printWindow && !printWindow.closed) {
                  printWindow.close();
                }
                resolve();
              }, 1000);
            } catch (error) {
              console.error('Error in final fallback print:', error);
              if (printWindow && !printWindow.closed) {
                printWindow.close();
              }
              reject(error);
            }
          }
        }, 500);

      } catch (error) {
        console.error('❌ Browser print error:', error);
        reject(error);
      }
    });
  }

  private async printViaElectron(content: string, receiptData?: ReceiptData): Promise<void> {
    try {
      console.log('🖨️ Using Electron NATIVE print (NO POPUP)');

      // CRITICAL: Validate content first
      console.log('🔍 Content validation:', {
        contentExists: !!content,
        contentType: typeof content,
        contentLength: content?.length || 0,
        contentPreview: content?.substring(0, 50) || 'NO CONTENT'
      });

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('Invalid content provided to printViaElectron - must be non-empty string');
      }

      // Check available print methods
      const hasDirectPrint = !!(window.electronAPI?.printDirect);
      const hasContentPrint = !!(window.electronAPI?.printContent);
      const hasReceiptPrint = !!(window.electronAPI?.printReceipt);

      console.log('🔍 Available print methods:', {
        printDirect: hasDirectPrint,
        printContent: hasContentPrint,
        printReceipt: hasReceiptPrint
      });

      // Method 1: Use printContent for HTML content (BEST - NO POPUP)
      if (hasContentPrint && content) {
        console.log('🖨️ Using printContent method (NO POPUP)');

        // CRITICAL: Add delay to ensure content is ready
        console.log('⏳ Waiting for content to be ready...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // DEBUG: Log what we're sending
        const printParams = {
          content: content,
          printerName: this.settings?.printer_name || 'POS-58',
          scaleFactor: 85, // Fixed scale for thermal printer
          copies: this.settings?.print_copies || 1,
          silent: true // NO POPUP - Direct print
        };

        console.log('📤 Sending to printContent:', {
          contentType: typeof printParams.content,
          contentLength: printParams.content?.length || 0,
          contentPreview: printParams.content?.substring(0, 100) || 'NO CONTENT',
          printerName: printParams.printerName,
          scaleFactor: printParams.scaleFactor,
          copies: printParams.copies
        });

        const result = await window.electronAPI?.printContent?.(printParams);

        if (result?.success) {
          console.log('✅ Print content successful');
          return;
        } else {
          console.warn('⚠️ Print content failed, trying fallback:', result?.error);
        }
      }

      // Method 2: Use printDirect for current window (FALLBACK - NO POPUP)
      if (hasDirectPrint) {
        console.log('🖨️ Using printDirect method (NO POPUP)');

        const result = await window.electronAPI?.printDirect?.({
          printerName: this.settings?.printer_name || 'POS-58',
          scaleFactor: 85, // Fixed scale for thermal printer
          copies: this.settings?.print_copies || 1,
          silent: true // NO POPUP - Direct print
        });

        if (result?.success) {
          console.log('✅ Direct print successful');
          return;
        } else {
          console.warn('⚠️ Direct print failed, trying legacy method:', result?.error);
        }
      }

      // Method 3: Legacy printReceipt method (FALLBACK)
      if (hasReceiptPrint) {
        console.log('🖨️ Using legacy printReceipt method');

        const printOptions = receiptData ? {
          receiptData: {
            items: receiptData.items,
            customer: receiptData.customer_name ? { name: receiptData.customer_name } : null,
            total: receiptData.total,
            discount: receiptData.discount || 0,
            timestamp: new Date().toISOString(),
            cashier: receiptData.cashier_name,
            paymentMethod: receiptData.payment_method,
            paidAmount: receiptData.paid_amount,
            change: receiptData.change,
            company_name: receiptData.company_name,
            company_address: receiptData.company_address,
            company_phone: receiptData.company_phone,
            receipt_footer: receiptData.receipt_footer
          },
          printerName: this.settings?.printer_name || 'POS-58',
          paperSize: this.settings?.paper_size || '58mm',
          scaleFactor: 85, // Fixed scale for thermal printer
          silent: true
        } : {
          content,
          printerName: this.settings?.printer_name || 'POS-58',
          paperSize: this.settings?.paper_size || '58mm',
          scaleFactor: 85, // Fixed scale for thermal printer
          silent: true
        };

        const result = await window.electronAPI?.printReceipt?.(printOptions);

        if (result?.success) {
          console.log('✅ Legacy print successful');
          return;
        } else {
          console.warn('⚠️ Legacy print failed:', result?.error);
        }
      }

      // If all methods fail, throw error
      throw new Error('All print methods failed - no available print API');
    } catch (error) {
      console.error('❌ Electron print error:', error);
      throw error;
    }
  }

  private enhanceContentForDirectPrint(content: string): string {
    // Add CSS to force direct printing without PDF conversion
    const enhancedCSS = `
      <style>
        @media print {
          @page {
            size: ${this.settings?.paper_size || '58mm'} auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', monospace;
            font-size: ${this.settings?.font_size === 'small' ? '8px' :
                        this.settings?.font_size === 'large' ? '12px' : '10px'};
            line-height: 1.2;
            color: black;
            background: white;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        @media screen {
          .print-only { display: none; }
        }
      </style>
    `;

    return content.replace('<style>', enhancedCSS + '<style>');
  }

  private generateReceiptHTML(data: ReceiptData, isCustomerCopy: boolean = false, template: '58mm' | 'simple' | 'detailed' | 'invoice' = '58mm'): string {
    // Get template from localStorage if not provided
    if (template === '58mm') {
      try {
        const localSettings = localStorage.getItem('printerSettings');
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          if (parsed.template && ['58mm', 'simple', 'detailed', 'invoice'].includes(parsed.template)) {
            template = parsed.template;
          }
        }
      } catch (e) {
        // Use default
      }
    }

    console.log(`🏗️ Generating receipt HTML with template: ${template}`);

    // Ensure data has fallback values
    const safeData = {
      transaction_id: data.transaction_id || 'N/A',
      date: data.date || new Date().toLocaleDateString('id-ID'),
      time: data.time || new Date().toLocaleTimeString('id-ID'),
      cashier_name: data.cashier_name || 'Kasir',
      customer_name: data.customer_name || '',
      items: data.items || [],
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      discount: data.discount || 0,
      total: data.total || 0,
      payment_method: data.payment_method || 'Cash',
      paid_amount: data.paid_amount || 0,
      change: data.change || 0,
      company_name: data.company_name || 'KASIR POS SYSTEM',
      company_address: data.company_address || 'Alamat Toko',
      company_phone: data.company_phone || 'Telp: -',
      receipt_footer: data.receipt_footer || 'Terima kasih atas kunjungan Anda!'
    };

    console.log('🏗️ Safe data prepared:', safeData);

    // Generate receipt based on template
    let receiptContent = '';
    let useHTML = template === 'invoice'; // Use HTML layout for invoice
    
    if (template === 'invoice') {
      receiptContent = this.generateInvoiceTemplate(safeData, isCustomerCopy);
    } else if (template === 'detailed') {
      receiptContent = this.generateDetailedReceipt(safeData, isCustomerCopy);
    } else if (template === 'simple') {
      receiptContent = this.generateSimpleReceipt(safeData, isCustomerCopy);
    } else {
      // Default: 58mm template
      receiptContent = this.generatePlainTextReceipt(safeData, isCustomerCopy);
    }
    
    console.log('📝 Generated receipt content length:', receiptContent.length);
    console.log('📝 Content preview:', receiptContent.substring(0, 200));

    // Return PROPER HTML for both thermal printer (Electron) and browser print
    if (useHTML && template === 'invoice') {
      // For invoice, return full HTML layout with A4 paper size
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${safeData.transaction_id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }
      body {
        margin: 0;
        padding: 20px;
        font-family: Arial, sans-serif;
        font-size: 12px;
      }
    }
    @media screen {
      body {
        margin: 0 auto;
        padding: 20px;
        max-width: 210mm;
        font-family: Arial, sans-serif;
        font-size: 12px;
        background: #f5f5f5;
      }
    }
    .invoice-container {
      background: white;
      padding: 30px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .total-row {
      border-top: 2px solid #000;
      font-weight: bold;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    ${receiptContent}
  </div>
</body>
</html>`;
    }

    // For other templates, use plain text in HTML wrapper
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @media print {
      @page {
        size: ${template === 'invoice' ? 'A4' : (this.settings?.paper_size === '80mm' ? '80mm' : '58mm')} auto;
        margin: ${template === 'invoice' ? '15mm' : '0mm'};
      }
      * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body {
        width: ${template === 'invoice' ? '100%' : (this.settings?.paper_size === '80mm' ? '80mm' : '58mm')};
        margin: 0 auto;
        padding: ${template === 'invoice' ? '20px' : '2mm'};
        font-family: ${template === 'invoice' ? 'Arial, sans-serif' : "'Courier New', 'Monaco', monospace"};
        font-size: ${template === 'invoice' ? '12px' : (this.settings?.font_size === 'small' ? '7px' : this.settings?.font_size === 'large' ? '10px' : '8px')};
        line-height: ${template === 'invoice' ? '1.5' : '1.2'};
        color: black;
        background: white;
      }
      .receipt-content {
        width: 100%;
        white-space: ${template === 'invoice' ? 'normal' : 'pre-line'};
        font-family: ${template === 'invoice' ? 'Arial, sans-serif' : "'Courier New', 'Monaco', monospace"};
        font-size: ${template === 'invoice' ? '12px' : (this.settings?.font_size === 'small' ? '7px' : this.settings?.font_size === 'large' ? '10px' : '8px')};
        line-height: ${template === 'invoice' ? '1.5' : '1.2'};
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      .no-print { display: none !important; }
    }
    @media screen {
      body {
        width: ${template === 'invoice' ? '210mm' : (this.settings?.paper_size === '80mm' ? '80mm' : '58mm')};
        margin: 0 auto;
        padding: ${template === 'invoice' ? '20px' : '2mm'};
        font-family: ${template === 'invoice' ? 'Arial, sans-serif' : "'Courier New', 'Monaco', monospace"};
        font-size: ${template === 'invoice' ? '12px' : (this.settings?.font_size === 'small' ? '7px' : this.settings?.font_size === 'large' ? '10px' : '8px')};
        line-height: ${template === 'invoice' ? '1.5' : '1.2'};
        color: black;
        background: ${template === 'invoice' ? '#f5f5f5' : 'white'};
      }
      .receipt-content {
        width: 100%;
        white-space: ${template === 'invoice' ? 'normal' : 'pre-line'};
        font-family: ${template === 'invoice' ? 'Arial, sans-serif' : "'Courier New', 'Monaco', monospace"};
        font-size: ${template === 'invoice' ? '12px' : (this.settings?.font_size === 'small' ? '7px' : this.settings?.font_size === 'large' ? '10px' : '8px')};
        line-height: ${template === 'invoice' ? '1.5' : '1.2'};
        word-wrap: break-word;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-content">${receiptContent}</div>
</body>
</html>`;
  }

  private generatePlainTextReceipt(data: any, isCustomerCopy: boolean = false): string {
    console.log('📝 Generating 58mm template receipt');

    let receipt = '';

    // Header - SIMPLE
    receipt += '================================\n';
    receipt += `       ${data.company_name}\n`;
    receipt += `    ${data.company_address}\n`;
    receipt += `      ${data.company_phone}\n`;
    receipt += '================================\n\n';

    // Transaction info - SIMPLE
    receipt += '        STRUK PEMBELIAN\n\n';
    receipt += `No    : ${data.transaction_id}\n`;
    receipt += `Tgl   : ${data.date} ${data.time}\n`;
    receipt += `Kasir : ${data.cashier_name}\n`;
    if (data.customer_name) {
      receipt += `Cust  : ${data.customer_name}\n`;
    }
    receipt += '--------------------------------\n';

    // Items - SIMPLE
    if (data.items && data.items.length > 0) {
      data.items.forEach((item: any) => {
        receipt += `${item.name || 'Unknown Item'}\n`;
        const qty = item.quantity || 0;
        const price = (item.price || 0).toLocaleString('id-ID');
        const total = (item.total || 0).toLocaleString('id-ID');
        receipt += `  ${qty} x ${price} = ${total}\n`;
      });
    } else {
      receipt += 'Tidak ada item\n';
    }

    receipt += '--------------------------------\n';

    // Totals - SIMPLE
    receipt += `Subtotal    : Rp ${data.subtotal.toLocaleString('id-ID')}\n`;
    if (data.discount > 0) {
      receipt += `Diskon      : Rp ${data.discount.toLocaleString('id-ID')}\n`;
    }
    if (data.tax > 0) {
      receipt += `Pajak       : Rp ${data.tax.toLocaleString('id-ID')}\n`;
    }
    receipt += '================================\n';
    receipt += `TOTAL       : Rp ${data.total.toLocaleString('id-ID')}\n`;
    receipt += '================================\n';

    // Payment - SIMPLE
    receipt += `Bayar (${data.payment_method}): Rp ${data.paid_amount.toLocaleString('id-ID')}\n`;
    receipt += `Kembalian   : Rp ${data.change.toLocaleString('id-ID')}\n\n`;

    // Footer - SIMPLE
    receipt += '--------------------------------\n';
    receipt += '    Terima kasih atas\n';
    receipt += '      kunjungan Anda!\n\n';
    receipt += `   ${new Date().toLocaleString('id-ID')}\n`;
    receipt += '================================\n';

    console.log('📝 Plain text receipt generated, length:', receipt.length);
    return receipt;
  }

  private generateSimpleReceipt(data: any, isCustomerCopy: boolean = false): string {
    console.log('📝 Generating SIMPLE template receipt');
    
    let receipt = '';
    const copyLabel = isCustomerCopy ? '\n   *** SALINAN PELANGGAN ***\n' : '';

    receipt += '================================\n';
    receipt += copyLabel;
    receipt += `    ${data.company_name}\n`;
    receipt += `  ${data.company_address}\n`;
    receipt += `  ${data.company_phone}\n`;
    receipt += '--------------------------------\n';
    receipt += `No. Nota: ${data.transaction_id}\n`;
    receipt += `Tanggal  : ${data.date} ${data.time}\n`;
    receipt += `Kasir    : ${data.cashier_name}\n`;
    if (data.customer_name) {
      receipt += `Customer : ${data.customer_name}\n`;
    }
    receipt += '--------------------------------\n';

    if (data.items && data.items.length > 0) {
      data.items.forEach((item: any) => {
        const name = (item.name || 'Unknown Item').substring(0, 30);
        const qty = item.quantity || 0;
        const price = item.price || 0;
        const total = item.total || 0;
        receipt += `${name}\n`;
        receipt += `  ${qty} x ${price.toLocaleString('id-ID')} = ${total.toLocaleString('id-ID')}\n`;
      });
    }

    receipt += '--------------------------------\n';
    receipt += `Subtotal : Rp ${data.subtotal.toLocaleString('id-ID')}\n`;
    if (data.discount > 0) {
      receipt += `Diskon   : Rp ${data.discount.toLocaleString('id-ID')}\n`;
    }
    if (data.tax > 0) {
      receipt += `Pajak    : Rp ${data.tax.toLocaleString('id-ID')}\n`;
    }
    receipt += `TOTAL    : Rp ${data.total.toLocaleString('id-ID')}\n`;
    receipt += '--------------------------------\n';
    receipt += `Bayar    : Rp ${data.paid_amount.toLocaleString('id-ID')}\n`;
    receipt += `Kembali  : Rp ${data.change.toLocaleString('id-ID')}\n`;
    receipt += `Metode   : ${data.payment_method}\n`;
    receipt += '--------------------------------\n';
    receipt += `\n${data.receipt_footer}\n`;
    receipt += `\n${new Date().toLocaleString('id-ID')}\n`;
    receipt += '================================\n';

    return receipt;
  }

  private generateDetailedReceipt(data: any, isCustomerCopy: boolean = false): string {
    console.log('📝 Generating DETAILED template receipt');
    
    let receipt = '';
    const copyLabel = isCustomerCopy ? '\n       *** SALINAN PELANGGAN ***\n' : '';

    receipt += '========================================\n';
    receipt += copyLabel;
    receipt += `          ${data.company_name}\n`;
    receipt += `     ${data.company_address}\n`;
    receipt += `     ${data.company_phone}\n`;
    receipt += '========================================\n\n';
    receipt += '            BUKTI TRANSAKSI\n\n';
    receipt += '========================================\n';
    receipt += `Nomor Transaksi : ${data.transaction_id}\n`;
    receipt += `Tanggal         : ${data.date}\n`;
    receipt += `Waktu           : ${data.time}\n`;
    receipt += `Kasir           : ${data.cashier_name}\n`;
    if (data.customer_name) {
      receipt += `Pelanggan       : ${data.customer_name}\n`;
    }
    receipt += '========================================\n\n';

    receipt += 'DETAIL ITEM:\n';
    receipt += '----------------------------------------\n';
    receipt += 'Nama Barang                  Qty    Harga      Total\n';
    receipt += '----------------------------------------\n';
    
    if (data.items && data.items.length > 0) {
      data.items.forEach((item: any) => {
        const name = (item.name || 'Unknown Item').substring(0, 28);
        const qty = (item.quantity || 0).toString().padStart(3);
        const price = (item.price || 0).toLocaleString('id-ID').padStart(10);
        const total = (item.total || 0).toLocaleString('id-ID').padStart(10);
        receipt += `${name.padEnd(28)} ${qty}  ${price}  ${total}\n`;
      });
    } else {
      receipt += 'Tidak ada item\n';
    }

    receipt += '----------------------------------------\n';
    receipt += `Subtotal                     Rp ${data.subtotal.toLocaleString('id-ID').padStart(12)}\n`;
    if (data.discount > 0) {
      receipt += `Diskon                       Rp ${data.discount.toLocaleString('id-ID').padStart(12)}\n`;
    }
    if (data.tax > 0) {
      receipt += `Pajak                        Rp ${data.tax.toLocaleString('id-ID').padStart(12)}\n`;
    }
    receipt += '----------------------------------------\n';
    receipt += `TOTAL BAYAR                  Rp ${data.total.toLocaleString('id-ID').padStart(12)}\n`;
    receipt += '----------------------------------------\n';
    receipt += `Dibayar (${data.payment_method})          Rp ${data.paid_amount.toLocaleString('id-ID').padStart(12)}\n`;
    receipt += `Kembalian                    Rp ${data.change.toLocaleString('id-ID').padStart(12)}\n`;
    receipt += '========================================\n\n';
    receipt += `${data.receipt_footer}\n\n`;
    receipt += `Cetak: ${new Date().toLocaleString('id-ID')}\n`;
    receipt += '========================================\n';

    return receipt;
  }

  private generateInvoiceTemplate(data: any, isCustomerCopy: boolean = false): string {
    console.log('📝 Generating INVOICE template');
    
    // Invoice uses HTML/CSS layout for better formatting
    return `
    <div style="font-family: Arial, sans-serif; max-width: 210mm; margin: 0 auto; padding: 20px; background: white;">
      ${isCustomerCopy ? '<div style="text-align: center; color: red; font-weight: bold; margin-bottom: 20px; border: 2px dashed red; padding: 10px;">SALINAN PELANGGAN</div>' : ''}
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${data.company_name}</h1>
        <p style="margin: 5px 0; font-size: 12px;">${data.company_address}</p>
        <p style="margin: 5px 0; font-size: 12px;">${data.company_phone}</p>
      </div>

      <!-- Invoice Title -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">INVOICE</h2>
      </div>

      <!-- Invoice Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div style="flex: 1;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-weight: bold; width: 150px;">Nomor Invoice:</td>
              <td style="padding: 5px 0;">${data.transaction_id}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Tanggal:</td>
              <td style="padding: 5px 0;">${data.date}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Waktu:</td>
              <td style="padding: 5px 0;">${data.time}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Kasir:</td>
              <td style="padding: 5px 0;">${data.cashier_name}</td>
            </tr>
          </table>
        </div>
        ${data.customer_name ? `
        <div style="flex: 1;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Kepada:</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">${data.customer_name}</td>
            </tr>
          </table>
        </div>
        ` : ''}
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">No</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Nama Barang</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Qty</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Harga Satuan</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items && data.items.length > 0 ? data.items.map((item: any, index: number) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.name || 'Unknown Item'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity || 0}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${(item.price || 0).toLocaleString('id-ID')}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${(item.total || 0).toLocaleString('id-ID')}</td>
          </tr>
          `).join('') : `
          <tr>
            <td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: center;">Tidak ada item</td>
          </tr>
          `}
        </tbody>
      </table>

      <!-- Summary -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <table style="width: 300px; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 10px; text-align: right; font-weight: bold;">Subtotal:</td>
            <td style="padding: 5px 10px; text-align: right;">Rp ${data.subtotal.toLocaleString('id-ID')}</td>
          </tr>
          ${data.discount > 0 ? `
          <tr>
            <td style="padding: 5px 10px; text-align: right; font-weight: bold;">Diskon:</td>
            <td style="padding: 5px 10px; text-align: right;">Rp ${data.discount.toLocaleString('id-ID')}</td>
          </tr>
          ` : ''}
          ${data.tax > 0 ? `
          <tr>
            <td style="padding: 5px 10px; text-align: right; font-weight: bold;">Pajak:</td>
            <td style="padding: 5px 10px; text-align: right;">Rp ${data.tax.toLocaleString('id-ID')}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #000;">
            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">TOTAL:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">Rp ${data.total.toLocaleString('id-ID')}</td>
          </tr>
        </table>
      </div>

      <!-- Payment Info -->
      <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; font-weight: bold;">Metode Pembayaran:</td>
            <td style="padding: 5px 0;">${data.payment_method}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-weight: bold;">Dibayar:</td>
            <td style="padding: 5px 0;">Rp ${data.paid_amount.toLocaleString('id-ID')}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-weight: bold;">Kembalian:</td>
            <td style="padding: 5px 0;">Rp ${data.change.toLocaleString('id-ID')}</td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000;">
        <p style="margin: 10px 0; font-size: 12px;">${data.receipt_footer}</p>
        <p style="margin: 10px 0; font-size: 11px; color: #666;">Invoice ini adalah bukti pembayaran yang sah</p>
        <p style="margin: 10px 0; font-size: 10px; color: #999;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
      </div>
    </div>
    `;
  }

  private async printDirectText(receiptData: ReceiptData): Promise<void> {
    console.log('🖨️ Starting direct text print...');

    if (!window.electronAPI?.printContent) {
      throw new Error('Electron printContent API not available');
    }

    // Generate plain text receipt
    const safeData = {
      transaction_id: receiptData.transaction_id || 'N/A',
      date: receiptData.date || new Date().toLocaleDateString('id-ID'),
      time: receiptData.time || new Date().toLocaleTimeString('id-ID'),
      cashier_name: receiptData.cashier_name || 'Kasir',
      customer_name: receiptData.customer_name || '',
      items: receiptData.items || [],
      subtotal: receiptData.subtotal || 0,
      tax: receiptData.tax || 0,
      discount: receiptData.discount || 0,
      total: receiptData.total || 0,
      payment_method: receiptData.payment_method || 'Cash',
      paid_amount: receiptData.paid_amount || 0,
      change: receiptData.change || 0,
      company_name: receiptData.company_name || 'KASIR POS SYSTEM',
      company_address: receiptData.company_address || 'Alamat Toko',
      company_phone: receiptData.company_phone || 'Telp: -',
      receipt_footer: receiptData.receipt_footer || 'Terima kasih atas kunjungan Anda!'
    };

    const plainText = this.generatePlainTextReceipt(safeData);
    console.log('📝 Generated plain text for direct print:', plainText.substring(0, 100) + '...');

    // CRITICAL: Validate content is not empty
    if (!plainText || plainText.trim().length === 0) {
      throw new Error('Generated receipt content is empty');
    }

    console.log('✅ Content validation passed - content length:', plainText.length);

    // Generate proper HTML for 58mm thermal printer
    const properHTML = this.generateReceiptHTML(receiptData);

    console.log('📝 Proper HTML length:', properHTML.length);
    console.log('📝 HTML preview (first 200 chars):', properHTML.substring(0, 200));

    // CRITICAL: Add delay to ensure React has finished rendering
    console.log('⏳ Waiting for React render to complete...');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('🖨️ Sending to Electron for printing...');
    // Send to Electron for printing
    const result = await window.electronAPI.printContent({
      content: properHTML,
      printerName: this.settings?.printer_name || 'POS-58',
      scaleFactor: 85, // Fixed scale for thermal printer
      copies: 1
    });

    if (!result?.success) {
      throw new Error(result?.error || 'Direct text print failed');
    }

    console.log('✅ Direct text print completed successfully');
  }


  private convertToESCPOS(html: string): string {
    // Basic ESC/POS commands for thermal printers
    const ESC = '\x1B';
    const GS = '\x1D';
    
    // Initialize printer
    let escPos = ESC + '@'; // Initialize
    
    // Convert HTML to plain text and add ESC/POS formatting
    const text = this.stripHTML(html);
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.includes('STRUK PEMBELIAN') || line.includes('TOTAL:')) {
        escPos += ESC + 'E\x01'; // Bold on
        escPos += GS + '!\x11'; // Double size
        escPos += line + '\n';
        escPos += ESC + 'E\x00'; // Bold off
        escPos += GS + '!\x00'; // Normal size
      } else if (line.includes('---') || line.includes('===')) {
        escPos += line.replace(/[-=]/g, '-') + '\n';
      } else {
        escPos += line + '\n';
      }
    });
    
    // Cut paper
    escPos += GS + 'V\x42\x00';
    
    return escPos;
  }

  private stripHTML(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  async testPrint(): Promise<boolean> {
    console.log('🧪 Starting comprehensive test print...');

    const testData: ReceiptData = {
      transaction_id: 'TEST-' + Date.now().toString().slice(-6),
      date: new Date().toLocaleDateString('id-ID'),
      time: new Date().toLocaleTimeString('id-ID'),
      cashier_name: 'Test Kasir',
      customer_name: 'Test Customer',
      items: [
        {
          name: 'Kopi Americano',
          quantity: 2,
          price: 15000,
          total: 30000
        },
        {
          name: 'Roti Bakar Keju',
          quantity: 1,
          price: 25000,
          total: 25000
        },
        {
          name: 'Es Teh Manis',
          quantity: 3,
          price: 8000,
          total: 24000
        }
      ],
      subtotal: 79000,
      tax: 7900,
      discount: 5000,
      total: 81900,
      payment_method: 'Cash',
      paid_amount: 85000,
      change: 3100,
      company_name: 'KASIR POS SYSTEM',
      company_address: 'Jl. Contoh No. 123, Jakarta Selatan',
      company_phone: 'Telp: 021-12345678',
      receipt_footer: 'Terima kasih atas kunjungan Anda!\nSimpan struk ini sebagai bukti pembayaran'
    };

    console.log('🧪 Test data prepared:', testData);

    // Generate HTML for debugging
    const htmlContent = this.generateReceiptHTML(testData);
    console.log('📝 Generated test HTML length:', htmlContent.length);
    console.log('📝 Test HTML preview (first 800 chars):', htmlContent.substring(0, 800));

    try {
      const result = await this.printReceipt(testData);
      console.log('✅ Test print completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Test print failed:', error);
      throw error;
    }
  }

  getSettings(): PrinterSettings | null {
    return this.settings;
  }

  async shouldAutoPrint(): Promise<boolean> {
    if (!this.settings) {
      await this.loadSettings();
    }
    return this.settings?.auto_print || false;
  }
}

export const printerService = new PrinterService();
