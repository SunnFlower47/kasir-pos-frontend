import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { Outlet } from '../../types';

interface ReportData {
  summary: {
    total_revenue: number;
    total_refunds?: number;
    net_revenue?: number;
    total_transactions: number;
    total_products: number;
    total_customers: number;
    avg_transaction_value: number;
    revenue_growth: number;
    transaction_growth: number;
    product_growth: number;
    customer_growth: number;
    profit_margin: number;
    net_profit: number;
  };
  daily_revenue: Array<{
    date: string;
    revenue: number;
    refunds?: number;
    net_revenue?: number;
    transactions: number;
    avg_value: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
    refunds?: number;
    net_revenue?: number;
    transactions: number;
    growth: number;
  }>;
  yearly_revenue: Array<{
    year: string;
    revenue: number;
    refunds?: number;
    net_revenue?: number;
    transactions: number;
    growth: number;
  }>;
  top_products: Array<{
    name: string;
    sales: number;
    revenue: number;
    percentage: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  customer_segments: Array<{
    segment: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  hourly_analysis: Array<{
    hour: string;
    transactions: number;
    revenue: number;
  }>;
  category_performance: Array<{
    category: string;
    revenue: number;
    products: number;
    percentage: number;
  }>;
}

const EnhancedReportDashboard: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    outlet_id: '',
    period: 'daily', // daily, monthly, yearly
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'revenue', name: 'Revenue', icon: CurrencyDollarIcon },
    { id: 'products', name: 'Products', icon: ShoppingBagIcon },
    { id: 'customers', name: 'Customers', icon: UsersIcon },
    { id: 'analytics', name: 'Analytics', icon: ClockIcon }
  ];

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/reports/enhanced', filters);
      
      if (response.success) {
        setData(response.data);
      } else {
        // Fallback data jika API gagal
        setData({
          summary: {
            total_revenue: 0,
            total_transactions: 0,
            total_products: 0,
            total_customers: 0,
            avg_transaction_value: 0,
            revenue_growth: 0,
            transaction_growth: 0,
            product_growth: 0,
            customer_growth: 0,
            profit_margin: 0,
            net_profit: 0
          },
          daily_revenue: [],
          monthly_revenue: [],
          yearly_revenue: [],
          top_products: [],
          payment_methods: [],
          customer_segments: [],
          hourly_analysis: [],
          category_performance: []
        });
        toast.error('Gagal memuat data laporan, menggunakan data kosong');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Fallback data jika error
      setData({
        summary: {
          total_revenue: 0,
          total_transactions: 0,
          total_products: 0,
          total_customers: 0,
          avg_transaction_value: 0,
          revenue_growth: 0,
          transaction_growth: 0,
          product_growth: 0,
          customer_growth: 0,
          profit_margin: 0,
          net_profit: 0
        },
        daily_revenue: [],
        monthly_revenue: [],
        yearly_revenue: [],
        top_products: [],
        payment_methods: [],
        customer_segments: [],
        hourly_analysis: [],
        category_performance: []
      });
      toast.error('Terjadi kesalahan saat memuat data, menggunakan data kosong');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch outlets on mount
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const response = await apiService.getOutlets();
        if (response.success && response.data) {
          const outletData = response.data.data || response.data;
          setOutlets(Array.isArray(outletData) ? outletData : []);
        }
      } catch (error) {
        console.error('Error fetching outlets:', error);
      }
    };
    fetchOutlets();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const setDateRange = (range: string) => {
    const today = new Date();
    let dateFrom = new Date();
    let dateTo = new Date();

    switch (range) {
      case 'today':
        dateFrom = new Date(today);
        dateTo = new Date(today);
        break;
      case 'yesterday':
        dateFrom = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        dateTo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'this_week':
        dateFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateTo = new Date(today);
        break;
      case 'last_week':
        dateFrom = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
        dateTo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'this_month':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        dateTo = new Date(today);
        break;
      case 'last_month':
        dateFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        dateTo = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'this_year':
        dateFrom = new Date(today.getFullYear(), 0, 1);
        dateTo = new Date(today);
        break;
      case 'last_year':
        dateFrom = new Date(today.getFullYear() - 1, 0, 1);
        dateTo = new Date(today.getFullYear() - 1, 11, 31);
        break;
    }

    setFilters(prev => ({
      ...prev,
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: dateTo.toISOString().split('T')[0]
    }));
  };

  const exportToPDF = () => {
    toast.success('Fitur export PDF akan segera tersedia');
  };

  const exportToExcel = () => {
    toast.success('Fitur export Excel akan segera tersedia');
  };

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-20"></div>
          ))}
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200 p-6">
          <div className="flex space-x-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded w-20"></div>
            ))}
          </div>
        </div>
        <div className="p-6">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tidak ada data laporan tersedia</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan </h1>
          <p className="text-gray-600">Analisis pejualan pendapatan dan keuntungan mendalam dengan chart dan filter lanjutan</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode Analisis
            </label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Harian</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tahun
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outlet
            </label>
            <select
              value={filters.outlet_id}
              onChange={(e) => setFilters(prev => ({ ...prev, outlet_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: 'today', label: 'Hari Ini' },
            { key: 'yesterday', label: 'Kemarin' },
            { key: 'this_week', label: 'Minggu Ini' },
            { key: 'last_week', label: 'Minggu Lalu' },
            { key: 'this_month', label: 'Bulan Ini' },
            { key: 'last_month', label: 'Bulan Lalu' },
            { key: 'this_year', label: 'Tahun Ini' },
            { key: 'last_year', label: 'Tahun Lalu' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateRange(key)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendapatan Bersih</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(data.summary.net_revenue || data.summary.total_revenue)}
                      </p>
                      <div className="flex items-center mt-1">
                        {getGrowthIcon(data.summary.revenue_growth)}
                        <span className={`text-sm ml-1 ${getGrowthColor(data.summary.revenue_growth)}`}>
                          {data.summary.revenue_growth > 0 ? '+' : ''}{data.summary.revenue_growth}%
                        </span>
                      </div>
                      {data.summary.total_refunds !== undefined && data.summary.total_refunds > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Total: {formatCurrency(data.summary.total_revenue)} - 
                          Refund: {formatCurrency(data.summary.total_refunds)}
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatNumber(data.summary.total_transactions)}
                      </p>
                      <div className="flex items-center mt-1">
                        {getGrowthIcon(data.summary.transaction_growth)}
                        <span className={`text-sm ml-1 ${getGrowthColor(data.summary.transaction_growth)}`}>
                          {data.summary.transaction_growth > 0 ? '+' : ''}{data.summary.transaction_growth}%
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Produk</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatNumber(data.summary.total_products)}
                      </p>
                      <div className="flex items-center mt-1">
                        {getGrowthIcon(data.summary.product_growth || 0)}
                        <span className={`text-sm ml-1 ${getGrowthColor(data.summary.product_growth || 0)}`}>
                          {data.summary.product_growth && data.summary.product_growth !== 0 
                            ? `${data.summary.product_growth > 0 ? '+' : ''}${data.summary.product_growth}%`
                            : '0%'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <ShoppingBagIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Customer</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatNumber(data.summary.total_customers)}
                      </p>
                      <div className="flex items-center mt-1">
                        {getGrowthIcon(data.summary.customer_growth || 0)}
                        <span className={`text-sm ml-1 ${getGrowthColor(data.summary.customer_growth || 0)}`}>
                          {data.summary.customer_growth && data.summary.customer_growth !== 0 
                            ? `${data.summary.customer_growth > 0 ? '+' : ''}${data.summary.customer_growth}%`
                            : '0%'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <UsersIcon className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.daily_revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Area type="monotone" dataKey="net_revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.payment_methods}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, percentage }) => `${method} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {data.payment_methods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analysis</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={data.monthly_revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => [
                      name === 'net_revenue' || name === 'revenue' ? formatCurrency(Number(value)) : value,
                      name === 'net_revenue' || name === 'revenue' ? 'Net Revenue' : 'Growth %'
                    ]} />
                    <Bar yAxisId="left" dataKey="net_revenue" fill="#10b981" />
                    <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#ef4444" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Revenue</h3>
                {data.top_products && data.top_products.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={Math.max(400, data.top_products.length * 50)}>
                      <BarChart data={data.top_products} layout="horizontal" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          tickFormatter={(value) => formatCurrency(value).replace('Rp', '').trim()}
                          label={{ value: 'Revenue (Rp)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={120}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: any, name: string, props: any) => {
                            if (name === 'revenue') {
                              return [
                                formatCurrency(Number(value)),
                                'Revenue'
                              ];
                            }
                            if (name === 'sales') {
                              return [
                                `${value} unit`,
                                'Quantity Sold'
                              ];
                            }
                            return [value, name];
                          }}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '4px' }}
                          labelFormatter={(label) => `Produk: ${label}`}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="#8b5cf6"
                          name="Revenue"
                          radius={[0, 4, 4, 0]}
                        >
                          {data.top_products.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${260 + index * 20}, 70%, ${60 + index * 3}%)`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Detail Table */}
                    <div className="mt-6 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ranking
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nama Produk
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity Terjual
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Revenue
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Persentase
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {data.top_products.map((product, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{index + 1}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {product.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                                {formatNumber(product.sales)} unit
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                {formatCurrency(product.revenue)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {product.percentage}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Tidak ada data produk untuk periode yang dipilih</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={data.customer_segments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, percentage }) => `${segment} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {data.customer_segments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Yearly Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.yearly_revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="net_revenue" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.daily_revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="transactions" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedReportDashboard;

