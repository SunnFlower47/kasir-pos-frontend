import React, { useEffect, useState, useCallback } from 'react';
import { DashboardData } from '../../types';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardCard from './DashboardCard';
import QuickActions from './QuickActions';
import StockAlerts from './StockAlerts';
import SalesChart from './SalesChart';
import {
  BuildingStorefrontIcon,
  CubeIcon,
  UsersIcon,
  TruckIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async (outletId?: number | null, signal?: AbortSignal) => {
    setLoading(true);
    
    try {
      const params = outletId ? { outlet_id: outletId } : {};
      const response = await apiService.getDashboard(params);
      
      if (signal?.aborted) return;

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData(null);
        toast.error('Gagal memuat data dashboard');
      }
    } catch (error: any) {
      if (signal?.aborted) return;
      
      console.error('❌ Dashboard API Error:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Gagal memuat data dashboard';

      if (status === 401) {
        toast.error('Sesi telah berakhir, silakan login kembali');
      } else if (status === 403) {
        toast.error('Akses ditolak: Anda tidak memiliki permission untuk melihat dashboard');
      } else if (status === 422) {
        toast.error('Data tidak valid: ' + message);
      } else if (status === 500) {
        toast.error('Server error: ' + message);
      } else {
        toast.error(`Error ${status || 'Network'}: ${message}`);
      }

      setData(null);
    } finally {
      if (!signal?.aborted) {
      setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchDashboardData(selectedOutletId, abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [selectedOutletId, fetchDashboardData]);

  const handleOutletChange = useCallback((outletId: number | null) => {
    setSelectedOutletId(outletId);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchDashboardData(selectedOutletId);
  }, [fetchDashboardData, selectedOutletId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-500">Memuat data dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-gray-500 mb-4">Gagal memuat data dashboard</p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selamat datang, {user?.name || 'User'}
            {data?.stats?.access_scope === 'global' && data?.stats?.filtered_outlet_id && (
              <span className="ml-2 text-primary-600">
                • Viewing: {data.user_outlet?.name || 'Unknown Outlet'}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Outlet Selector for Global Access Users */}
          {data?.stats?.access_scope === 'global' && Array.isArray(data?.available_outlets) && data.available_outlets.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter Outlet:</label>
              <select
                value={selectedOutletId || ''}
                onChange={(e) => handleOutletChange(e.target.value ? parseInt(e.target.value) : null)}
                className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-0"
              >
                <option value="">Semua Outlet</option>
                {data.available_outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name || `Outlet ${outlet.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stock Alerts */}
          {(data?.stock_alerts?.total_alerts || 0) > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {(data?.stock_alerts?.low_stock_count || 0) > 0 && (
                <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
                  <ExclamationTriangleIcon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  {data.stock_alerts.low_stock_count} stok menipis
                </div>
              )}
              {(data?.stock_alerts?.out_of_stock_count || 0) > 0 && (
                <div className="flex items-center bg-red-100 text-red-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
                  <ExclamationTriangleIcon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  {data.stock_alerts.out_of_stock_count} stok habis
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 md:px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-1 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">↻</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6">
        <DashboardCard
          title="Pendapatan Hari Ini"
          value={`Rp ${(Number(data?.transaction_stats?.revenue_today || data?.transaction_stats?.net_revenue_today || 0)).toLocaleString('id-ID')}`}
          subtitle={`${Number(data?.transaction_stats?.transactions_today || 0)} transaksi`}
          icon={CurrencyDollarIcon}
          color="blue"
          onClick={() => navigate('/transactions?filter=today')}
          loading={loading}
        />

        <DashboardCard
          title="Pendapatan Bulan Ini"
          value={`Rp ${(Number(data?.transaction_stats?.revenue_this_month || data?.transaction_stats?.net_revenue_this_month || 0)).toLocaleString('id-ID')}`}
          subtitle="bulan ini"
          icon={ChartBarIcon}
          color="green"
          trend={{
            value: Number(data?.revenue_growth || 0),
            isPositive: Number(data?.revenue_growth || 0) >= 0
          }}
          onClick={() => navigate('/reports?type=sales&period=this_month')}
          loading={loading}
        />

        <DashboardCard
          title="Total Produk"
          value={data.stats?.total_products || 0}
          subtitle="produk aktif"
          icon={CubeIcon}
          color="purple"
          onClick={() => navigate('/products')}
          loading={loading}
        />

        <DashboardCard
          title="Stok Alert"
          value={data.stock_alerts?.total_alerts || 0}
          subtitle="perlu perhatian"
          icon={ExclamationTriangleIcon}
          color="red"
          onClick={() => navigate('/stocks?filter=alerts')}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => navigate('/outlets')}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BuildingStorefrontIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Outlets</h3>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{data.stats?.total_outlets || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCartIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Transaksi</h3>
              <p className="text-2xl font-bold text-gray-900">{data.transaction_stats?.transactions_this_month || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Pelanggan</h3>
              <p className="text-2xl font-bold text-gray-900">{data.stats?.total_customers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Supplier</h3>
              <p className="text-2xl font-bold text-gray-900">{data.stats?.total_suppliers || 0}</p>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stock Alerts */}
        <div className="lg:col-span-1">
          <StockAlerts
            lowStockProducts={data.low_stock_products || []}
            outOfStockProducts={data.out_of_stock_products || []}
            loading={loading}
          />
        </div>

        {/* Sales Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Sales Trend</h3>
              <p className="text-sm text-gray-500 mt-1">Grafik penjualan 7 hari terakhir</p>
            </div>
            <div className="p-6">
              <SalesChart data={data.sales_chart_data || []} />
            </div>
          </div>
        </div>
      </div>





    </div>
  );
};

export default Dashboard;
