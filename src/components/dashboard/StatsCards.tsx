import React from 'react';
import { DashboardData } from '../../types';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UsersIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface StatsCardsProps {
  data: DashboardData;
}

const StatsCards: React.FC<StatsCardsProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const stats = [
    {
      name: 'Penjualan Hari Ini',
      value: formatCurrency(data.transaction_stats.revenue_today),
      subValue: `${formatNumber(data.transaction_stats.transactions_today)} transaksi`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      change: data.revenue_growth,
      changeType: data.revenue_growth >= 0 ? 'increase' : 'decrease',
    },
    {
      name: 'Penjualan Bulan Ini',
      value: formatCurrency(data.transaction_stats.revenue_this_month),
      subValue: `${formatNumber(data.transaction_stats.transactions_this_month)} transaksi`,
      icon: ShoppingCartIcon,
      color: 'bg-blue-500',
      change: data.revenue_growth,
      changeType: data.revenue_growth >= 0 ? 'increase' : 'decrease',
    },
    {
      name: 'Total Pelanggan',
      value: formatNumber(data.stats.total_customers),
      subValue: 'Pelanggan terdaftar',
      icon: UsersIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Produk',
      value: formatNumber(data.stats.total_products),
      subValue: 'Produk aktif',
      icon: CubeIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Stok Menipis',
      value: formatNumber(data.stock_stats.low_stock_products),
      subValue: 'Produk perlu restock',
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500',
      alert: data.stock_stats.low_stock_products > 0,
    },
    {
      name: 'Nilai Stok',
      value: formatCurrency(data.stock_stats.total_stock_value),
      subValue: 'Total nilai inventori',
      icon: CubeIcon,
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`card p-6 ${stat.alert ? 'border-yellow-200 bg-yellow-50' : ''}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.subValue}</p>
                </div>
                {stat.change !== undefined && (
                  <div className="flex items-center">
                    {stat.changeType === 'increase' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
