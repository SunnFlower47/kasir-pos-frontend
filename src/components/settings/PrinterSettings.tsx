import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PrinterIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface PrinterConfig {
  template: '58mm' | 'simple' | 'detailed';
  scale: number;
  autoScale: boolean;
}

const PrinterSettings: React.FC = () => {
  const [settings, setSettings] = useState<PrinterConfig>({
    template: '58mm',
    scale: 90,
    autoScale: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('printerSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      localStorage.setItem('printerSettings', JSON.stringify(settings));
      toast.success('Pengaturan printer berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan printer');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (template: '58mm' | 'simple' | 'detailed') => {
    setSettings(prev => ({ ...prev, template }));
  };

  const handleScaleChange = (scale: number) => {
    setSettings(prev => ({ ...prev, scale }));
  };

  const testPrint = async () => {
    try {
      // Test dengan transaksi terbaru
      const response = await fetch(`${process.env.REACT_APP_API_URL}/transactions?limit=1`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data transaksi');
      }

      const data = await response.json();
      if (data.success && data.data.length > 0) {
        const transaction = data.data[0];

        // Generate PDF dengan template yang dipilih
        const pdfResponse = await fetch(`${process.env.REACT_APP_API_URL}/public/transactions/${transaction.id}/receipt/${settings.template}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
        });

        if (!pdfResponse.ok) {
          throw new Error('Gagal generate PDF');
        }

        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);

        // Buka di tab baru untuk test print
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            if (settings.autoScale) {
              // Set scale otomatis
              printWindow.document.body.style.transform = `scale(${settings.scale / 100})`;
              printWindow.document.body.style.transformOrigin = 'top left';
            }
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }

        toast.success('Test print berhasil!');
      } else {
        toast.error('Tidak ada transaksi untuk test print');
      }
    } catch (error) {
      console.error('Test print error:', error);
      toast.error('Gagal melakukan test print');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-6">
          <PrinterIcon className="h-6 w-6 text-gray-400 mr-3" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Pengaturan Printer
          </h3>
        </div>

        <div className="space-y-6">
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
              </div>
            </fieldset>
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

              {settings.autoScale && (
                <div>
                  <label htmlFor="scale-range" className="block text-sm font-medium text-gray-700">
                    Scale: {settings.scale}%
                  </label>
                  <input
                    id="scale-range"
                    type="range"
                    min="80"
                    max="100"
                    value={settings.scale}
                    onChange={(e) => handleScaleChange(parseInt(e.target.value))}
                    className="mt-1 block w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>80%</span>
                    <span>90%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Test Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrinterSettings;
