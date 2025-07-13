import React, { useState } from 'react';
import { ChartBarIcon, FunnelIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Custom Hook
import { useReportData } from '../../hooks/useReportData';

// Modular Components
import SummaryCards from './components/SummaryCards';
import DateRangeSelector from './components/DateRangeSelector';
import ReportTypeSelector from './components/ReportTypeSelector';
import TopProductChart from './components/TopProductChart';
import ExportButtons from './components/ExportButtons';
import TopProductsTable from './components/TopProductsTable';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSkeleton from './components/LoadingSkeleton';

const ReportDashboard: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);

  // Use custom hook for all data management
  const {
    loading,
    stats,
    topProducts,
    chartData,
    outlets,
    filters,
    setFilters,
    refreshData
  } = useReportData();

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: 'month',
      selectedOutlet: null,
      reportType: 'sales',
      customDateFrom: '',
      customDateTo: '',
      transactionStatus: '',
      paymentMethod: ''
    });
    toast.success('Filter berhasil direset');
  };

  const handleOutletChange = (outletId: string) => {
    setFilters({ selectedOutlet: outletId ? Number(outletId) : null });
    // Force refresh after outlet change
    setTimeout(() => refreshData(), 100);
  };

  const handleAdvancedFiltersChange = (filterType: string, value: string) => {
    setFilters({ [filterType]: value });
    // Force refresh after filter change
    setTimeout(() => refreshData(), 100);
  };

  if (loading && !stats) {
    return (
      <ErrorBoundary>
        <LoadingSkeleton type="full" />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-full mx-auto space-y-6 px-2 sm:px-4">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Title Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <ReportTypeSelector
                  filters={filters}
                  onFiltersChange={setFilters}
                  onRefresh={refreshData}
                />
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

              {/* Date Range Selector */}
              <div>
                <DateRangeSelector
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>

              {/* Outlet Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Outlet</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={filters.selectedOutlet || ''}
                    onChange={(e) => handleOutletChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  >
                    <option value="">🏪 Semua Outlet</option>
                    {outlets.map(outlet => (
                      <option key={outlet.id} value={outlet.id}>
                        🏪 {outlet.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={toggleFilters}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FunnelIcon className="h-4 w-4" />
                  {showFilters ? 'Sembunyikan Filter' : 'Filter Lanjutan'}
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Filter Lanjutan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Transaction Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Transaksi</label>
                    <select
                      value={filters.transactionStatus}
                      onChange={(e) => handleAdvancedFiltersChange('transactionStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Semua Status</option>
                      <option value="completed">Selesai</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>

                  {/* Payment Method Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                    <select
                      value={filters.paymentMethod}
                      onChange={(e) => handleAdvancedFiltersChange('paymentMethod', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Semua Metode</option>
                      <option value="cash">Tunai</option>
                      <option value="transfer">Transfer</option>
                      <option value="qris">QRIS</option>
                      <option value="e_wallet">E-Wallet</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between mt-6">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    🔄 Reset Filter
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={refreshData}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Terapkan Filter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Export Actions */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {loading ? 'Memuat data...' : `Menampilkan data ${filters.reportType}`}
              </div>
              <ExportButtons
                stats={stats}
                topProducts={topProducts}
                chartData={chartData}
                reportType={filters.reportType}
                dateRange={filters.dateRange}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards
          stats={stats}
          reportType={filters.reportType}
          loading={loading}
        />

        {/* Charts Section */}
        <TopProductChart
          chartData={chartData}
          topProducts={topProducts}
          reportType={filters.reportType}
          loading={loading}
        />

        {/* Top Products Table */}
        <TopProductsTable
          topProducts={topProducts}
          reportType={filters.reportType}
          loading={loading}
        />

        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ReportDashboard;
