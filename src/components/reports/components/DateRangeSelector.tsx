import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { ReportFilters } from '../../../hooks/useReportData';

interface DateRangeSelectorProps {
  filters: ReportFilters;
  onFiltersChange: (filters: Partial<ReportFilters>) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ filters, onFiltersChange }) => {
  const handleDateRangeChange = (value: string) => {
    onFiltersChange({ dateRange: value });
  };

  const handleCustomDateFromChange = (value: string) => {
    onFiltersChange({ customDateFrom: value });
  };

  const handleCustomDateToChange = (value: string) => {
    onFiltersChange({ customDateTo: value });
  };

  const getDateRangeName = (range: string) => {
    switch (range) {
      case 'today': return 'Hari Ini';
      case 'week': return '7 Hari Terakhir';
      case 'month': return 'Bulan Ini';
      case 'year': return 'Tahun Ini';
      case 'all': return 'Semua Data';
      case 'custom': return 'Periode Kustom';
      default: return 'Periode Kustom';
    }
  };

  const getCurrentPeriodInfo = () => {
    const today = new Date();

    switch (filters.dateRange) {
      case 'today':
        return today.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        return `${weekAgo.toLocaleDateString('id-ID')} - ${today.toLocaleDateString('id-ID')}`;
      case 'month':
        return today.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long'
        });
      case 'year':
        return today.getFullYear().toString();
      case 'all':
        return 'Menampilkan semua data tanpa filter tanggal';
      case 'custom':
        if (filters.customDateFrom && filters.customDateTo) {
          return `${new Date(filters.customDateFrom).toLocaleDateString('id-ID')} - ${new Date(filters.customDateTo).toLocaleDateString('id-ID')}`;
        }
        return 'Pilih tanggal kustom';
      default:
        return 'Periode tidak diketahui';
    }
  };

  return (
    <div className="space-y-4">
      {/* Date Range Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Periode Laporan</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={filters.dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="today">📅 Hari Ini</option>
            <option value="week">📅 7 Hari Terakhir</option>
            <option value="month">📅 Bulan Ini</option>
            <option value="year">📅 Tahun Ini</option>
            <option value="all">🌐 Semua Data</option>
            <option value="custom">📅 Periode Kustom</option>
          </select>
        </div>

        {/* Period Info */}
        <div className="mt-2 text-sm text-gray-600">
          📅 {getCurrentPeriodInfo()} • {getDateRangeName(filters.dateRange)}
        </div>
      </div>

      {/* Custom Date Range - Show only when custom is selected */}
      {filters.dateRange === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
            <input
              type="date"
              value={filters.customDateFrom}
              onChange={(e) => handleCustomDateFromChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
            <input
              type="date"
              value={filters.customDateTo}
              onChange={(e) => handleCustomDateToChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
