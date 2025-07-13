import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { ChartData, TopProduct } from '../../../hooks/useReportData';

interface TopProductChartProps {
  chartData: ChartData[];
  topProducts: TopProduct[];
  reportType: string;
  loading?: boolean;
}

const TopProductChart: React.FC<TopProductChartProps> = ({
  chartData,
  topProducts,
  reportType,
  loading = false
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getChartTitle = (reportType: string) => {
    switch (reportType) {
      case 'sales': return 'Trend Penjualan';
      case 'purchases': return 'Trend Pembelian';
      case 'stocks': return 'Nilai Stok';
      case 'profit': return 'Trend Keuntungan';
      default: return 'Trend Data';
    }
  };

  const getChartColor = (reportType: string) => {
    switch (reportType) {
      case 'sales': return '#3B82F6'; // blue
      case 'purchases': return '#8B5CF6'; // purple
      case 'stocks': return '#10B981'; // green
      case 'profit': return '#F59E0B'; // orange
      default: return '#3B82F6';
    }
  };

  const getTopItemsTitle = (reportType: string) => {
    switch (reportType) {
      case 'sales': return 'Produk Terlaris';
      case 'purchases': return 'Pembelian Terbesar';
      case 'stocks': return 'Stok Tertinggi';
      case 'profit': return 'Profit Tertinggi';
      default: return 'Top Items';
    }
  };

  const getDataKey = (reportType: string) => {
    switch (reportType) {
      case 'sales': return 'total_revenue';
      case 'purchases': return 'total_amount';
      case 'stocks': return 'stock_value';
      case 'profit': return 'profit_amount';
      default: return 'total_revenue';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Loading */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
        </div>

        {/* Top Products Chart Loading */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
            {getChartTitle(reportType)}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Periode terpilih</span>
          </div>
        </div>
        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => {
                    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
                    return value.toString();
                  }}
                />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                    name === 'revenue' ? 'Revenue' : 'Transaksi'
                  ]}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={reportType === 'purchases' ? 'amount' : 'revenue'}
                  stroke={getChartColor(reportType)}
                  strokeWidth={3}
                  dot={{ fill: getChartColor(reportType), strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: getChartColor(reportType), strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Tidak ada data untuk ditampilkan</p>
                <p className="text-sm text-gray-400 mt-2">Coba ubah filter tanggal atau outlet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Products Pie Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-green-600" />
            {getTopItemsTitle(reportType)}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Top 5</span>
          </div>
        </div>
        <div className="h-80">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Memuat data...</p>
              </div>
            </div>
          ) : topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey={getDataKey(reportType)}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {topProducts.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Tidak ada data produk</p>
                <p className="text-sm text-gray-400 mt-2">Data akan muncul setelah ada transaksi</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopProductChart;
