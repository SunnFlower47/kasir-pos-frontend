import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface SalesChartProps {
  data?: any[];
  loading?: boolean;
}

type ChartType = 'revenue' | 'transactions' | 'both';

const SalesChart: React.FC<SalesChartProps> = ({ data, loading }) => {
  const [chartType, setChartType] = React.useState<ChartType>('both');
  const formatCurrency = (value: number) => {
    const numValue = Number(value);
    if (isNaN(numValue) || !isFinite(numValue)) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Use only real data from API - no mock data
  const rawData = data && data.length > 0 ? data : [];

  const chartData = rawData.map(item => ({
    ...item,
    date: formatDate(item.date),
    revenue: Number(item.revenue || 0),
    transactions: Number(item.transactions || 0),
  }));

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-500">
        <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">Tidak ada data penjualan</p>
        <p className="text-xs text-gray-400 mt-1">Data akan muncul setelah ada transaksi</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#4b5563' }}
                stroke="#d1d5db"
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => {
                    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
                    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
                    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
                    return value.toLocaleString('id-ID');
                }}
                />


              <Tooltip
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'transactions':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip
                formatter={(value: number) => [`${value} transaksi`, 'Jumlah Transaksi']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar
                dataKey="transactions"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default: // 'both'
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                yAxisId="revenue"
                orientation="left"
                tick={{ fontSize: 12, fill: '#4b5563' }}
                stroke="#d1d5db"
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => {
                if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
                if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
                if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
                return `${value.toLocaleString('id-ID')} Rp`;
                }}
                />

              <YAxis
                yAxisId="transactions"
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') {
                    return [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan'];
                  }
                  return [`${value} transaksi`, 'Jumlah Transaksi'];
                }}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Line
                yAxisId="transactions"
                type="monotone"
                dataKey="transactions"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Grafik Penjualan (7 Hari Terakhir)</h3>

        {/* Filter Dropdown */}
        <div className="flex items-center space-x-3">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="both">Pendapatan & Transaksi</option>
            <option value="revenue">Pendapatan Saja</option>
            <option value="transactions">Transaksi Saja</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex space-x-4 text-sm mb-4">
        {(chartType === 'both' || chartType === 'revenue') && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Pendapatan</span>
          </div>
        )}
        {(chartType === 'both' || chartType === 'transactions') && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Transaksi</span>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="bg-gray-50 rounded-lg p-4">
        {renderChart()}
      </div>



      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(
                chartData.reduce((sum, item) => {
                  const revenue = Number(item.revenue) || 0;
                  return sum + revenue;
                }, 0)
              )}
            </p>
            <p className="text-sm text-gray-600">Total Pendapatan</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">
              {chartData.reduce((sum, item) => {
                const transactions = Number(item.transactions) || 0;
                return sum + transactions;
              }, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Transaksi</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">
              {(() => {
                const totalRevenue = chartData.reduce((sum, item) => {
                  const revenue = Number(item.revenue) || 0;
                  return sum + revenue;
                }, 0);
                const totalTransactions = chartData.reduce((sum, item) => {
                  const transactions = Number(item.transactions) || 0;
                  return sum + transactions;
                }, 0);
                const average = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
                return formatCurrency(average);
              })()}
            </p>
            <p className="text-sm text-gray-600">Rata-rata per Transaksi</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;
