import React from 'react';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UsersIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { ReportStats } from '../../../hooks/useReportData';

interface SummaryCardsProps {
  stats: ReportStats | null;
  reportType: string;
  loading?: boolean;
}

interface StatsLabels {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  quintary: string;
  sextary: string;
}

const getStatsLabels = (reportType: string): StatsLabels => {
  switch (reportType) {
    case 'sales':
      return {
        primary: 'Total Penjualan',
        secondary: 'Transaksi',
        tertiary: 'Customer',
        quaternary: 'Produk Terjual',
        quintary: 'Rata-rata/Transaksi',
        sextary: 'Pertumbuhan'
      };
    case 'purchases':
      return {
        primary: 'Total Pembelian',
        secondary: 'Purchase Order',
        tertiary: 'Supplier',
        quaternary: 'Item Dibeli',
        quintary: 'Rata-rata/PO',
        sextary: 'Efisiensi'
      };
    case 'expenses':
      return {
        primary: 'Total Pengeluaran',
        secondary: 'Transaksi',
        tertiary: 'Supplier',
        quaternary: 'Item Dibeli',
        quintary: 'Rata-rata/Transaksi',
        sextary: 'Tingkat Pembayaran'
      };
    case 'stocks':
      return {
        primary: 'Nilai Stok',
        secondary: 'Total Produk',
        tertiary: 'Stok Menipis',
        quaternary: 'Kategori',
        quintary: 'Stok Habis',
        sextary: 'Turnover'
      };
    case 'profit':
      return {
        primary: 'Total Profit',
        secondary: 'Transaksi',
        tertiary: 'Margin',
        quaternary: 'Produk',
        quintary: 'Profit/Transaksi',
        sextary: 'ROI'
      };
    default:
      return {
        primary: 'Total Revenue',
        secondary: 'Transaksi',
        tertiary: 'Customer',
        quaternary: 'Produk',
        quintary: 'Rata-rata',
        sextary: 'Pertumbuhan'
      };
  }
};

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

const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, reportType, loading = false }) => {
  const labels = getStatsLabels(reportType);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Ringkasan Metrik</h2>
          <p className="text-gray-600 text-sm mt-1">Memuat data...</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="text-center animate-pulse">
                <div className="p-3 bg-gray-200 rounded-lg mx-auto w-fit mb-3">
                  <div className="h-6 w-6 bg-gray-300 rounded"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Ringkasan Metrik</h2>
          <p className="text-gray-600 text-sm mt-1">Tidak ada data tersedia</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
            <p className="text-sm text-gray-400 mt-1">Coba ubah filter atau periode</p>
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: labels.primary,
      value: formatCurrency(stats.totalRevenue),
      change: stats.growth > 0 ? `+${formatPercentage(stats.growth)}` : formatPercentage(stats.growth),
      icon: CurrencyDollarIcon,
      color: 'green',
      isPositive: stats.growth >= 0
    },
    {
      label: labels.secondary,
      value: formatNumber(stats.totalTransactions),
      change: 'periode ini',
      icon: ShoppingCartIcon,
      color: 'blue',
      isPositive: true
    },
    {
      label: labels.tertiary,
      value: formatNumber(stats.totalCustomers),
      change: 'terdaftar',
      icon: UsersIcon,
      color: 'purple',
      isPositive: true
    },
    {
      label: labels.quaternary,
      value: formatNumber(stats.totalProducts),
      change: 'aktif',
      icon: ArchiveBoxIcon,
      color: 'orange',
      isPositive: true
    },
    {
      label: labels.quintary,
      value: formatCurrency(stats.avgTransactionValue),
      change: 'rata-rata',
      icon: ChartBarIcon,
      color: 'indigo',
      isPositive: true
    },
    {
      label: labels.sextary,
      value: formatPercentage(stats.growth),
      change: 'vs periode lalu',
      icon: ArrowTrendingUpIcon,
      color: stats.growth >= 0 ? 'green' : 'red',
      isPositive: stats.growth >= 0
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      red: 'bg-red-100 text-red-600'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Ringkasan Metrik</h2>
        <p className="text-gray-600 text-sm mt-1">
          Data utama untuk periode yang dipilih
        </p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {cards.map((card, index) => (
            <div key={index} className="text-center">
              <div className={`p-3 ${getColorClasses(card.color)} rounded-lg mx-auto w-fit mb-3`}>
                <card.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
              <p className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                card.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {card.isPositive && card.change.includes('%') && (
                  <ArrowTrendingUpIcon className="h-3 w-3" />
                )}
                {card.change}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
