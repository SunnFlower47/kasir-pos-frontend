import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  CalculatorIcon
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
  ComposedChart,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { Outlet } from '../../types';

interface BusinessIntelligenceData {
  kpis: {
    revenue: { 
      total?: number;
      refunds?: number;
      net_revenue?: number;
      current: number; 
      previous: number; 
      growth_rate: number; 
      growth_direction: string 
    };
    transactions: { current: number; previous: number; growth_rate: number; growth_direction: string };
    avg_transaction_value: { current: number; previous: number; growth_rate: number; growth_direction: string };
    discounts: { total: number; percentage: number };
    taxes: { total: number; percentage: number };
    customers: { active: number; total: number; engagement_rate: number };
    products: { active: number; total: number; utilization_rate: number };
  };
  revenue_analytics: {
    by_payment_method: Array<{ payment_method: string; transaction_count: number; total_revenue: number; avg_transaction_value: number }>;
    by_hour: Array<{ hour: string; transaction_count: number; total_revenue: number }>;
    by_day_of_week: Array<{ day_of_week: string; transaction_count: number; total_revenue: number }>;
    monthly_trend: Array<{ month: string; month_name: string; transaction_count: number; total_revenue: number }>;
  };
  customer_analytics: {
    segmentation: Array<any>;
    lifetime_value: Array<any>;
    new_vs_returning: { new_customers: number; returning_customers: number; total_active_customers: number };
    summary: { total_customers: number; active_customers: number; customer_retention_rate: number };
  };
  product_analytics: {
    top_products: Array<any>;
    category_performance: Array<any>;
    slow_moving_products: Array<any>;
    summary: { total_products: number; active_products: number; categories_count: number; slow_moving_count: number };
  };
  operational_metrics: {
    avg_processing_time: number;
    peak_hours: Array<{ hour: string; transaction_count: number; total_revenue: number; refunds?: number; net_revenue?: number }>;
    staff_performance: Array<any>;
    outlet_performance: Array<any>;
    summary: { total_staff: number; total_outlets: number; busiest_hour: string; top_performing_outlet: string };
  };
  financial_health: {
    revenue: number;
    refunds?: number;
    net_revenue?: number;
    expenses: number;
    purchase_expenses?: number;
    operational_expenses?: number;
    cogs?: number;
    gross_profit: number;
    operating_expenses?: number;
    net_profit?: number;
    profit_margin: number;
    cash_flow: { inflow: number; outflow: number; net_cash_flow: number; cash_flow_ratio: number; refunds?: number; net_inflow?: number };
    inventory_turnover: number;
    financial_ratios: { profit_margin: number; cash_flow_ratio: number; revenue_growth: number; expense_ratio: number };
  };
  trend_analysis: {
    daily_trends: Array<{ date: string; day_name: string; transaction_count: number; total_revenue: number; refunds?: number; net_revenue?: number; avg_transaction_value: number }>;
    trend_direction: { revenue: string; transactions: string };
    summary: { best_day: any; worst_day: any; avg_daily_revenue: number; avg_daily_transactions: number };
  };
  comparative_analysis: {
    period_comparison: {
      current: { period: string; transaction_count: number; total_revenue: number; avg_transaction_value: number };
      previous: { period: string; transaction_count: number; total_revenue: number; avg_transaction_value: number };
      growth: { revenue_growth: number; transaction_growth: number; avg_value_growth: number };
    };
    year_over_year: {
      current: { period: string; total_revenue: number };
      previous_year: { period: string; total_revenue: number };
      yoy_growth: number;
    };
  };
  report_metadata: {
    generated_at: string;
    date_range: { from: string; to: string };
    outlet_id: number | null;
    outlet_name: string;
  };
}

const AdvancedReportDashboard: React.FC = () => {
  const [data, setData] = useState<BusinessIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    outlet_id: null as number | null,
    period: 'month' // today, week, month, quarter, year, all
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'revenue', name: 'Revenue', icon: CurrencyDollarIcon },
    { id: 'customers', name: 'Customers', icon: UsersIcon },
    { id: 'products', name: 'Products', icon: ShoppingBagIcon },
    { id: 'operations', name: 'Operations', icon: BuildingStorefrontIcon },
    { id: 'financial', name: 'Financial Health', icon: BanknotesIcon }
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getBusinessIntelligence(filters);
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast.error('Gagal memuat data Business Intelligence');
      }
    } catch (error) {
      console.error('Error fetching BI data:', error);
      toast.error('Terjadi kesalahan saat memuat data');
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
    if (growth < 0) return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
    return <div className="h-5 w-5 bg-gray-300 rounded-full" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Quick filter handlers
  const setDateRangeByPeriod = (period: string) => {
    const now = new Date();
    let dateFrom: string, dateTo: string;

    switch (period) {
      case 'today':
        dateFrom = dateTo = now.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        dateFrom = weekAgo.toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        dateFrom = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
        break;
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      date_from: dateFrom,
      date_to: dateTo,
      period
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Tidak ada data yang tersedia untuk periode yang dipilih.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Intelligence Dashboard</h1>
          <p className="text-gray-600">Analisis mendalam untuk pengambilan keputusan strategis</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setDateRangeByPeriod('today')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filters.period === 'today' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setDateRangeByPeriod('week')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filters.period === 'week' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          7 Hari Terakhir
        </button>
        <button
          onClick={() => setDateRangeByPeriod('month')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filters.period === 'month' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Bulan Ini
        </button>
        <button
          onClick={() => setDateRangeByPeriod('quarter')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filters.period === 'quarter' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Kuartal Ini
        </button>
        <button
          onClick={() => setDateRangeByPeriod('year')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filters.period === 'year' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tahun Ini
        </button>
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value, period: 'custom' }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <span className="self-center text-gray-600">s/d</span>
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value, period: 'custom' }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filters.outlet_id || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, outlet_id: e.target.value ? Number(e.target.value) : null }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Outlet</option>
          {outlets.map((outlet) => (
            <option key={outlet.id} value={outlet.id}>
              {outlet.name}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue KPI */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Pendapatan Bersih</h3>
            <CurrencyDollarIcon className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(data.kpis.revenue.net_revenue || data.kpis.revenue.current)}
          </p>
          <div className="flex items-center gap-2">
            {getGrowthIcon(data.kpis.revenue.growth_rate)}
            <span className={`text-sm ${getGrowthColor(data.kpis.revenue.growth_rate)}`}>
              {data.kpis.revenue.growth_rate > 0 ? '+' : ''}{data.kpis.revenue.growth_rate}%
            </span>
            <span className="text-xs text-gray-500">vs periode sebelumnya</span>
          </div>
          {data.kpis.revenue.refunds !== undefined && data.kpis.revenue.refunds > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Total: {formatCurrency(data.kpis.revenue.total || data.kpis.revenue.current)} - 
              Refund: {formatCurrency(data.kpis.revenue.refunds)}
            </p>
          )}
        </div>

        {/* Transactions KPI */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Transaksi</h3>
            <ChartBarIcon className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{formatNumber(data.kpis.transactions.current)}</p>
          <div className="flex items-center gap-2">
            {getGrowthIcon(data.kpis.transactions.growth_rate)}
            <span className={`text-sm ${getGrowthColor(data.kpis.transactions.growth_rate)}`}>
              {data.kpis.transactions.growth_rate > 0 ? '+' : ''}{data.kpis.transactions.growth_rate}%
            </span>
          </div>
        </div>

        {/* Avg Transaction Value */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Rata-rata Transaksi</h3>
            <CalculatorIcon className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(data.kpis.avg_transaction_value.current)}</p>
          <div className="flex items-center gap-2">
            {getGrowthIcon(data.kpis.avg_transaction_value.growth_rate)}
            <span className={`text-sm ${getGrowthColor(data.kpis.avg_transaction_value.growth_rate)}`}>
              {data.kpis.avg_transaction_value.growth_rate > 0 ? '+' : ''}{data.kpis.avg_transaction_value.growth_rate}%
            </span>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Customer Aktif</h3>
            <UsersIcon className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{formatNumber(data.kpis.customers.active)}</p>
          <p className="text-sm text-gray-500">
            {data.kpis.customers.engagement_rate}% dari total {formatNumber(data.kpis.customers.total)} customer
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Revenue Trend */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Revenue Bulanan</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.revenue_analytics.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month_name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="net_revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Methods */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Payment Method</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.revenue_analytics.by_payment_method}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="payment_method" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="net_revenue" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Produk</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terjual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.product_analytics.top_products.slice(0, 10).map((product: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(product.total_sold)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.total_revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(product.total_profit || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue per Jam (Peak Hours)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.revenue_analytics.by_hour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="net_revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue per Hari dalam Seminggu</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.revenue_analytics.by_day_of_week}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day_of_week" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="net_revenue" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Customers</h3>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(data.customer_analytics.summary.total_customers)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Active Customers</h3>
                <p className="text-3xl font-bold text-green-600">{formatNumber(data.customer_analytics.summary.active_customers)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Retention Rate</h3>
                <p className="text-3xl font-bold text-blue-600">{data.customer_analytics.summary.customer_retention_rate}%</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New vs Returning Customers</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'New Customers', value: data.customer_analytics.new_vs_returning.new_customers },
                      { name: 'Returning Customers', value: data.customer_analytics.new_vs_returning.returning_customers }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Products</h3>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(data.product_analytics.summary.total_products)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Active Products</h3>
                <p className="text-3xl font-bold text-green-600">{formatNumber(data.product_analytics.summary.active_products)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Categories</h3>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(data.product_analytics.summary.categories_count)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Slow Moving</h3>
                <p className="text-3xl font-bold text-orange-600">{formatNumber(data.product_analytics.summary.slow_moving_count)}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.product_analytics.category_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category_name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="total_revenue" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Operations Tab */}
        {activeTab === 'operations' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.operational_metrics.peak_hours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="transaction_count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Outlet Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaksi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rata-rata</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.operational_metrics.outlet_performance.map((outlet: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{outlet.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(outlet.transaction_count)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(outlet.total_revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(outlet.avg_transaction_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Financial Health Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Pendapatan Bersih</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.financial_health.net_revenue || data.financial_health.revenue)}
                </p>
                {data.financial_health.refunds !== undefined && data.financial_health.refunds > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {formatCurrency(data.financial_health.revenue)} - 
                    Refund: {formatCurrency(data.financial_health.refunds)}
                  </p>
                )}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Pengeluaran</h3>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(data.financial_health.expenses)}</p>
                {data.financial_health.purchase_expenses !== undefined && data.financial_health.operational_expenses !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pembelian: {formatCurrency(data.financial_health.purchase_expenses)} | 
                    Operasional: {formatCurrency(data.financial_health.operational_expenses)}
                  </p>
                )}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Laba Kotor</h3>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.financial_health.gross_profit)}</p>
                {data.financial_health.net_revenue !== undefined && data.financial_health.cogs !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    Net Revenue: {formatCurrency(data.financial_health.net_revenue)} - 
                    HPP: {formatCurrency(data.financial_health.cogs)}
                  </p>
                )}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Laba Bersih</h3>
                <p className={`text-2xl font-bold ${(data.financial_health.net_profit ?? data.financial_health.gross_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.financial_health.net_profit ?? data.financial_health.gross_profit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Margin: {data.financial_health.profit_margin}%
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Arus Kas</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Kas Masuk</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.financial_health.cash_flow.inflow)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kas Keluar</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(data.financial_health.cash_flow.outflow)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Cash Flow</p>
                    <p className={`text-xl font-bold ${data.financial_health.cash_flow.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.financial_health.cash_flow.net_cash_flow)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cash Flow Ratio</p>
                    <p className="text-xl font-bold text-blue-600">{data.financial_health.cash_flow.cash_flow_ratio.toFixed(2)}</p>
                  </div>
                </div>
                <div className="border-t pt-3 mt-3 text-sm text-gray-500">
                  <p className="font-medium mb-2">Breakdown:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p>Kas Masuk Bersih:</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(data.financial_health.cash_flow.net_inflow || (data.financial_health.cash_flow.inflow - (data.financial_health.cash_flow.refunds || 0)))}
                      </p>
                    </div>
                    <div>
                      <p>Pengeluaran:</p>
                      <p className="font-semibold text-red-600">
                        {formatCurrency((data.financial_health.cash_flow.outflow || 0) - (data.financial_health.cash_flow.refunds || 0))}
                      </p>
                    </div>
                    <div>
                      <p>Refund:</p>
                      <p className="font-semibold text-orange-600">
                        {formatCurrency(data.financial_health.cash_flow.refunds || 0)}
                      </p>
                    </div>
                    <div>
                      <p>Note:</p>
                      <p className="text-xs">Kas Keluar = Pengeluaran + Refund</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Ratios</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-xl font-bold">{data.financial_health.financial_ratios.profit_margin}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cash Flow Ratio</p>
                  <p className="text-xl font-bold">{data.financial_health.financial_ratios.cash_flow_ratio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expense Ratio</p>
                  <p className="text-xl font-bold">{data.financial_health.financial_ratios.expense_ratio}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inventory Turnover</p>
                  <p className="text-xl font-bold">{data.financial_health.inventory_turnover}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedReportDashboard;

