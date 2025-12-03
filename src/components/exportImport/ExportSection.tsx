import React, { useState, useEffect } from 'react';
import { exportImportService } from '../../services/exportImportService';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  DocumentArrowDownIcon, 
  TableCellsIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Outlet } from '../../types';

interface ExportOption {
  type: string;
  label: string;
  description: string;
  permissions: string[];
  formats: ('excel' | 'pdf')[];
  hasFilters: boolean;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    type: 'products',
    label: 'Export Produk',
    description: 'Export semua data produk ke Excel',
    permissions: ['products.view'],
    formats: ['excel'],
    hasFilters: false,
  },
  {
    type: 'sales-report',
    label: 'Laporan Penjualan',
    description: 'Export laporan penjualan ke Excel atau PDF',
    permissions: ['reports.sales'],
    formats: ['excel', 'pdf'],
    hasFilters: true,
  },
  {
    type: 'financial-report',
    label: 'Laporan Keuangan',
    description: 'Export laporan keuangan komprehensif',
    permissions: ['reports.sales'],
    formats: ['excel', 'pdf'],
    hasFilters: true,
  },
  {
    type: 'enhanced-report',
    label: 'Laporan Enhanced',
    description: 'Export laporan enhanced analytics',
    permissions: ['reports.sales'],
    formats: ['excel', 'pdf'],
    hasFilters: true,
  },
  {
    type: 'advanced-report',
    label: 'Laporan Advanced',
    description: 'Export business intelligence report',
    permissions: ['reports.sales'],
    formats: ['excel', 'pdf'],
    hasFilters: true,
  },
];

const ExportSection: React.FC = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const response = await apiService.getOutlets();
        if (response.success && response.data) {
          const outletData = response.data.data || response.data;
          setOutlets(Array.isArray(outletData) ? outletData : []);
        }
      } catch (error) {
        // Silent fail
      }
    };
    fetchOutlets();
  }, []);

  const handleExport = async (type: string, format: 'excel' | 'pdf') => {
    const loadingKey = `${type}-${format}`;
    setLoading(loadingKey);
    try {
      const params = filters[type] || {};
      await exportImportService.export(type, format, params);
      toast.success(`Export ${format.toUpperCase()} berhasil`);
    } catch (error: any) {
      toast.error(error.message || 'Export gagal');
    } finally {
      setLoading(null);
    }
  };

  const updateFilters = (type: string, field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(perm => hasPermission(perm));
  };

  const filteredOptions = EXPORT_OPTIONS.filter(option => hasAnyPermission(option.permissions));

  if (filteredOptions.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada akses</h3>
        <p className="mt-1 text-sm text-gray-500">
          Anda tidak memiliki permission untuk export data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOptions.map((option) => {
          const optionFilters = filters[option.type] || {};
          const isLoading = loading?.startsWith(`${option.type}-`);

          return (
            <div
              key={option.type}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {option.label}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{option.description}</p>

              {/* Filters */}
              {option.hasFilters && (
                <div className="mb-4 space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        <CalendarIcon className="w-3 h-3 inline mr-1" />
                        Dari Tanggal
                      </label>
                      <input
                        type="date"
                        value={optionFilters.date_from || ''}
                        onChange={(e) => updateFilters(option.type, 'date_from', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        <CalendarIcon className="w-3 h-3 inline mr-1" />
                        Sampai Tanggal
                      </label>
                      <input
                        type="date"
                        value={optionFilters.date_to || ''}
                        onChange={(e) => updateFilters(option.type, 'date_to', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {outlets.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Outlet (Opsional)
                      </label>
                      <select
                        value={optionFilters.outlet_id || ''}
                        onChange={(e) => updateFilters(option.type, 'outlet_id', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Semua Outlet</option>
                        {outlets.map((outlet) => (
                          <option key={outlet.id} value={outlet.id}>
                            {outlet.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Export buttons */}
              <div className="flex gap-2">
                {option.formats.includes('excel') && (
                  <button
                    onClick={() => handleExport(option.type, 'excel')}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading === `${option.type}-excel` ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <TableCellsIcon className="w-4 h-4" />
                        <span>Excel</span>
                      </>
                    )}
                  </button>
                )}
                {option.formats.includes('pdf') && (
                  <button
                    onClick={() => handleExport(option.type, 'pdf')}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading === `${option.type}-pdf` ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>PDF</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExportSection;

