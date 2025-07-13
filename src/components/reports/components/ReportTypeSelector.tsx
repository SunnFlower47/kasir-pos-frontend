import React from 'react';
import toast from 'react-hot-toast';
import { ReportFilters } from '../../../hooks/useReportData';

interface ReportTypeSelectorProps {
  filters: ReportFilters;
  onFiltersChange: (filters: Partial<ReportFilters>) => void;
  onRefresh?: () => void;
}

const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  filters,
  onFiltersChange,
  onRefresh
}) => {
  const reportTypes = [
    { value: 'sales', label: 'Penjualan', icon: '📊', color: 'blue' },
    { value: 'purchases', label: 'Pembelian', icon: '🛒', color: 'purple' },
    { value: 'expenses', label: 'Pengeluaran', icon: '💸', color: 'red' },
    { value: 'stocks', label: 'Stok', icon: '📦', color: 'green' },
    { value: 'profit', label: 'Keuntungan', icon: '💰', color: 'orange' }
  ];

  const handleReportTypeChange = (reportType: string) => {
    console.log(`🔄 Changing report type from ${filters.reportType} to: ${reportType}`);

    // Skip if same report type
    if (filters.reportType === reportType) {
      console.log('🔄 Same report type, skipping...');
      return;
    }

    // Update filters immediately
    onFiltersChange({ reportType });

    const selectedType = reportTypes.find(type => type.value === reportType);
    if (selectedType) {
      toast.success(`Beralih ke Laporan ${selectedType.label}`);
    }

    // Data will be refreshed automatically by setFilters
  };

  const getReportTypeName = (reportType: string) => {
    switch (reportType) {
      case 'sales': return 'Laporan Penjualan';
      case 'purchases': return 'Laporan Pembelian';
      case 'expenses': return 'Laporan Pengeluaran';
      case 'stocks': return 'Laporan Stok';
      case 'profit': return 'Laporan Keuntungan';
      default: return 'Laporan';
    }
  };

  const getReportDescription = (reportType: string) => {
    switch (reportType) {
      case 'sales': return 'Analisis penjualan dan performa produk';
      case 'purchases': return 'Tracking pembelian dan supplier';
      case 'expenses': return 'Analisis pengeluaran dan biaya operasional';
      case 'stocks': return 'Monitoring stok dan inventory';
      case 'profit': return 'Analisis keuntungan dan margin';
      default: return 'Analisis data bisnis';
    }
  };

  const getButtonColorClasses = (color: string, isActive: boolean) => {
    const baseClasses = 'flex-1 p-4 rounded-lg border-2 transition-all duration-200 text-center';

    if (isActive) {
      const activeColorMap = {
        blue: 'border-blue-500 bg-blue-50 text-blue-700',
        purple: 'border-purple-500 bg-purple-50 text-purple-700',
        red: 'border-red-500 bg-red-50 text-red-700',
        green: 'border-green-500 bg-green-50 text-green-700',
        orange: 'border-orange-500 bg-orange-50 text-orange-700'
      };
      return `${baseClasses} ${activeColorMap[color as keyof typeof activeColorMap]}`;
    } else {
      return `${baseClasses} border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Report Type Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {getReportTypeName(filters.reportType)}
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          {getReportDescription(filters.reportType)}
        </p>
      </div>

      {/* Report Type Tabs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Jenis Laporan</label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleReportTypeChange(type.value)}
              className={getButtonColorClasses(type.color, filters.reportType === type.value)}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="font-medium text-sm">{type.label}</div>
              {filters.reportType === type.value && (
                <div className="text-xs mt-1 opacity-75">Aktif</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Report Type Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">
            {reportTypes.find(type => type.value === filters.reportType)?.icon || '📊'}
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              {getReportTypeName(filters.reportType)}
            </h4>
            <p className="text-sm text-blue-700">
              {getReportDescription(filters.reportType)}
            </p>
            <div className="mt-2 text-xs text-blue-600">
              {filters.reportType === 'sales' && '• Analisis penjualan harian, mingguan, bulanan • Top produk terlaris • Trend revenue'}
              {filters.reportType === 'purchases' && '• Tracking pembelian dari supplier • Analisis biaya • History purchase order'}
              {filters.reportType === 'stocks' && '• Monitoring level stok • Alert stok menipis • Nilai inventory'}
              {filters.reportType === 'profit' && '• Analisis margin keuntungan • ROI per produk • Profitabilitas'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTypeSelector;
