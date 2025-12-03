import React, { useState, useRef } from 'react';
import { exportImportService } from '../../services/exportImportService';
import toast from 'react-hot-toast';
import { 
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ImportOption {
  type: string;
  label: string;
  description: string;
  templateAvailable: boolean;
}

const IMPORT_OPTIONS: ImportOption[] = [
  {
    type: 'products',
    label: 'Import Produk',
    description: 'Import produk dari file Excel',
    templateAvailable: true,
  },
];

const ImportSection: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('products');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast.error('Format file tidak valid. Gunakan file Excel (.xlsx, .xls) atau CSV (.csv)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB');
      return;
    }

    setSelectedFile(file);

    // Auto preview
    try {
      setLoading(true);
      const response = await exportImportService.previewImport(selectedType, file);
      if (response.success) {
        setPreviewData(response.data);
      } else {
        toast.error(response.message || 'Gagal preview file');
        setPreviewData(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal preview file');
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await exportImportService.downloadTemplate(selectedType);
      toast.success('Template berhasil diunduh');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengunduh template');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    if (!previewData) {
      toast.error('Preview data terlebih dahulu');
      return;
    }

    const hasErrors = previewData?.errors && previewData.errors.length > 0;
    const invalidRows = previewData?.invalid_rows && previewData.invalid_rows.length > 0;

    if (hasErrors || invalidRows) {
      const confirmMsg = `File memiliki ${previewData.errors?.length || 0} error dan ${previewData.invalid_rows?.length || 0} baris tidak valid. Lanjutkan import?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    try {
      setImporting(true);
      const response = await exportImportService.import(selectedType, selectedFile);
      
      if (response.success) {
        const data = response.data;
        toast.success(
          `Import berhasil! ${data.success || 0} berhasil, ${data.failed || 0} gagal`,
          { duration: 5000 }
        );
        
        // Reset form
        setSelectedFile(null);
        setPreviewData(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error(response.message || 'Import gagal');
      }
    } catch (error: any) {
      toast.error(error.message || 'Import gagal');
    } finally {
      setImporting(false);
    }
  };

  const selectedOption = IMPORT_OPTIONS.find(opt => opt.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Import Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Tipe Import
        </label>
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setSelectedFile(null);
            setPreviewData(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {IMPORT_OPTIONS.map((option) => (
            <option key={option.type} value={option.type}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Template Download */}
      {selectedOption?.templateAvailable && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-900">Download Template</h4>
              <p className="text-xs text-blue-700 mt-1">
                Download template Excel untuk memastikan format yang benar
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>
        </div>
      )}

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih File Excel/CSV
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
          <div className="space-y-1 text-center">
            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Upload file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
              </label>
              <p className="pl-1">atau drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              XLSX, XLS, CSV sampai 10MB
            </p>
            {selectedFile && (
              <p className="text-sm text-gray-700 mt-2">
                File terpilih: <span className="font-medium">{selectedFile.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Memproses preview...</p>
        </div>
      )}

      {previewData && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Preview Data</h4>
          
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Total Baris</p>
              <p className="text-lg font-semibold text-gray-900">{previewData.total_rows || 0}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600">Valid</p>
              <p className="text-lg font-semibold text-green-900">{previewData.valid_rows?.length || 0}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-xs text-red-600">Tidak Valid</p>
              <p className="text-lg font-semibold text-red-900">{previewData.invalid_rows?.length || 0}</p>
            </div>
          </div>

          {/* Errors */}
          {previewData.errors && previewData.errors.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                <h5 className="text-sm font-medium text-gray-900">Error</h5>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                <ul className="space-y-1 text-xs text-yellow-800">
                  {previewData.errors.slice(0, 10).map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {previewData.errors.length > 10 && (
                    <li className="text-yellow-600">... dan {previewData.errors.length - 10} error lainnya</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {previewData.preview_data && previewData.preview_data.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Preview Data (maksimal 10 baris pertama)</h5>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">No</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Nama</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">SKU</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Kategori</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Harga Jual</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.preview_data.slice(0, 10).map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-xs text-gray-900">{index + 1}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">{item.name || '-'}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">{item.sku || '-'}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">{item.category_id || '-'}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">
                          {item.selling_price ? `Rp ${Number(item.selling_price).toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Button */}
      {selectedFile && previewData && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewData(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={importing}
          >
            Batal
          </button>
          <button
            onClick={handleImport}
            disabled={importing || !selectedFile}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Mengimport...</span>
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-4 h-4" />
                <span>Import Data</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportSection;

