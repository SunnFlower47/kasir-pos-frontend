import React from 'react';
import { exportImportService } from '../../services/exportImportService';
import toast from 'react-hot-toast';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface TemplateOption {
  type: string;
  label: string;
  description: string;
  instructions: string[];
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    type: 'products',
    label: 'Template Import Produk',
    description: 'Template untuk import data produk dari Excel',
    instructions: [
      'Download template Excel di bawah',
      'Isi data produk sesuai kolom yang tersedia',
      'Kolom wajib: Nama Produk, Kategori, Satuan, Harga Beli, Harga Jual',
      'Kolom opsional: SKU (akan auto-generate jika kosong), Barcode, Harga Grosir, Min Stok, Deskripsi',
      'Upload file yang sudah diisi melalui tab Import Data',
    ],
  },
];

const TemplateDownload: React.FC = () => {
  const [downloading, setDownloading] = React.useState<string | null>(null);

  const handleDownload = async (type: string) => {
    setDownloading(type);
    try {
      await exportImportService.downloadTemplate(type);
      toast.success('Template berhasil diunduh');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengunduh template');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Download Template Excel
        </h3>
        <p className="text-sm text-gray-600">
          Download template Excel untuk memastikan format yang benar saat import data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATE_OPTIONS.map((template) => (
          <div
            key={template.type}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h4 className="text-base font-semibold text-gray-900 mb-2">
              {template.label}
            </h4>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>

            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">
                Cara Penggunaan:
              </h5>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                {template.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>

            <button
              onClick={() => handleDownload(template.type)}
              disabled={downloading === template.type}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloading === template.type ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Download Template</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateDownload;

