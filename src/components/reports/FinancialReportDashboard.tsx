import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import {
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
  Line
} from 'recharts';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { Outlet } from '../../types';

interface FinancialData {
  period: any;
  revenue: any;
  expenses: any;
  cogs: any;
  profit_loss: any;
  monthly_analysis: any[];
  expense_breakdown: any;
  cash_flow: any;
  financial_ratios: any;
  summary: any;
}

const FinancialReportDashboard: React.FC = () => {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [filters, setFilters] = useState({
    date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    outlet_id: null as number | null,
    period: 'monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: Math.ceil((new Date().getMonth() + 1) / 3),
    filter_type: 'custom' // custom, this_month, last_month, this_year, last_year, this_quarter, last_quarter
  });
  const [activeTab, setActiveTab] = useState('overview');

  // Function to set date range based on filter type
  const setDateRangeByFilter = (filterType: string) => {
    const now = new Date();
    let dateFrom: string, dateTo: string;

    switch (filterType) {
      case 'this_month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'last_month':
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'this_year':
        dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      case 'last_year':
        dateFrom = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
      case 'this_quarter':
        const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
        const quarterStartMonth = (currentQuarter - 1) * 3;
        dateFrom = new Date(now.getFullYear(), quarterStartMonth, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), quarterStartMonth + 3, 0).toISOString().split('T')[0];
        break;
      case 'last_quarter':
        const lastQuarter = Math.ceil((now.getMonth() + 1) / 3) - 1;
        const lastQuarterStartMonth = lastQuarter <= 0 ? 9 : (lastQuarter - 1) * 3;
        const lastQuarterYear = lastQuarter <= 0 ? now.getFullYear() - 1 : now.getFullYear();
        dateFrom = new Date(lastQuarterYear, lastQuarterStartMonth, 1).toISOString().split('T')[0];
        dateTo = new Date(lastQuarterYear, lastQuarterStartMonth + 3, 0).toISOString().split('T')[0];
        break;
      default:
        return; // Keep current dates for custom
    }

    setFilters(prev => ({
      ...prev,
      filter_type: filterType,
      date_from: dateFrom,
      date_to: dateTo
    }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Hanya kirim parameter yang diterima backend
      const params: any = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        period: filters.period,
      };
      
      if (filters.outlet_id) {
        params.outlet_id = filters.outlet_id;
      }
      
      const response = await apiService.getFinancialComprehensive(params);
      if (response.success) {
        setData(response.data);
      } else {
        console.error('Financial report error:', response);
        toast.error(response.message || 'Gagal memuat data laporan keuangan');
      }
    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan saat memuat data';
      toast.error(errorMessage);
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
  }, [filters, fetchData]);

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


  // Export functions
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportContent = generateFinancialReportHTML();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Keuangan Komprehensif</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { color: #333; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
            .summary-card { background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .summary-card h3 { margin: 0 0 10px 0; color: #333; font-size: 14px; }
            .summary-card .value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    toast.success('Laporan keuangan berhasil diekspor ke PDF');
  };

  const exportToExcel = () => {
    const csvData = generateFinancialCSVData();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Keuangan_${filters.date_from}_${filters.date_to}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan keuangan berhasil diekspor ke Excel');
  };

  const generateFinancialReportHTML = () => {
    const currentDate = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="header">
        <h1>Laporan Keuangan Komprehensif</h1>
        <p>Periode: ${new Date(data?.period?.from || new Date()).toLocaleDateString('id-ID')} - ${new Date(data?.period?.to || new Date()).toLocaleDateString('id-ID')}</p>
        <p>Dibuat pada: ${currentDate}</p>
        <p>Outlet: ${filters.outlet_id ? 'Outlet Terpilih' : 'Semua Outlet'}</p>
      </div>

      <div class="summary">
        <h2>Ringkasan Keuangan</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Pendapatan</h3>
            <div class="value" style="color: #10B981;">${formatCurrency(data?.summary?.total_revenue || 0)}</div>
          </div>
          <div class="summary-card">
            <h3>Total Pengeluaran</h3>
            <div class="value" style="color: #EF4444;">${formatCurrency(data?.summary?.total_expenses || 0)}</div>
          </div>
          <div class="summary-card">
            <h3>Laba Kotor</h3>
            <div class="value" style="color: #3B82F6;">${formatCurrency(data?.summary?.gross_profit || 0)}</div>
          </div>
          <div class="summary-card">
            <h3>Laba Bersih</h3>
            <div class="value" style="color: ${(data?.summary?.net_profit || 0) >= 0 ? '#10B981' : '#EF4444'};">${formatCurrency(data?.summary?.net_profit || 0)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Analisis Bulanan</h2>
        <table>
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Pendapatan</th>
              <th>Pengeluaran</th>
              <th>Laba Bersih</th>
              <th>Margin</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data?.monthly_analysis?.map((month: any) => `
              <tr>
                <td>${month.month_name}</td>
                <td>${formatCurrency(month.revenue)}</td>
                <td>${formatCurrency(month.expenses)}</td>
                <td>${formatCurrency(month.net_profit)}</td>
                <td>${month.profit_margin}%</td>
                <td>${month.is_profitable ? 'Menguntungkan' : 'Rugi'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Laporan ini dibuat secara otomatis oleh sistem Kasir POS</p>
        <p>© ${new Date().getFullYear()} - Semua hak dilindungi</p>
      </div>
    `;
  };

  const generateFinancialCSVData = () => {
    let csvContent = '';
    
    csvContent += `Laporan Keuangan Komprehensif\n`;
    csvContent += `Periode,${new Date(data?.period?.from || new Date()).toLocaleDateString('id-ID')} - ${new Date(data?.period?.to || new Date()).toLocaleDateString('id-ID')}\n`;
    csvContent += `Tanggal Dibuat,${new Date().toLocaleDateString('id-ID')}\n`;
    csvContent += `Outlet,${filters.outlet_id ? 'Outlet Terpilih' : 'Semua Outlet'}\n\n`;

    csvContent += `Ringkasan Keuangan\n`;
    csvContent += `Total Pendapatan,${data?.summary?.total_revenue || 0}\n`;
    csvContent += `Total Pengeluaran,${data?.summary?.total_expenses || 0}\n`;
    csvContent += `Laba Kotor,${data?.summary?.gross_profit || 0}\n`;
    csvContent += `Laba Bersih,${data?.summary?.net_profit || 0}\n`;
    csvContent += `Profit Margin,${data?.summary?.profit_margin || 0}%\n\n`;

    csvContent += `Analisis Bulanan\n`;
    csvContent += `Bulan,Pendapatan,Pengeluaran,Laba Bersih,Margin,Status\n`;
    data?.monthly_analysis?.forEach((month: any) => {
      csvContent += `${month.month_name},${month.revenue},${month.expenses},${month.net_profit},${month.profit_margin}%,${month.is_profitable ? 'Menguntungkan' : 'Rugi'}\n`;
    });

    return csvContent;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
          <p className="text-gray-500">Data laporan keuangan tidak tersedia untuk periode yang dipilih.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'revenue', name: 'Pendapatan', icon: ArrowUpIcon },
    { id: 'expenses', name: 'Pengeluaran', icon: ArrowDownIcon },
    { id: 'profit', name: 'Laba Rugi', icon: CalculatorIcon },
    { id: 'monthly', name: 'Analisis Bulanan', icon: CalendarIcon },
    { id: 'ratios', name: 'Rasio Keuangan', icon: BanknotesIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan Komprehensif</h1>
            <p className="text-gray-600 mt-1">
              Analisis lengkap pendapatan, pengeluaran, dan laba rugi • 
              {new Date(data?.period?.from || new Date()).toLocaleDateString('id-ID')} - 
              {new Date(data?.period?.to || new Date()).toLocaleDateString('id-ID')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export Excel
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filter Cepat</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateRangeByFilter('this_month')}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                filters.filter_type === 'this_month'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setDateRangeByFilter('last_month')}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                filters.filter_type === 'last_month'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => setDateRangeByFilter('this_quarter')}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                filters.filter_type === 'this_quarter'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Kuartal Ini
            </button>
            <button
              onClick={() => setDateRangeByFilter('last_quarter')}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                filters.filter_type === 'last_quarter'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Kuartal Lalu
            </button>
            <button
              onClick={() => setDateRangeByFilter('this_year')}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                filters.filter_type === 'this_year'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setDateRangeByFilter('last_year')}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                filters.filter_type === 'last_year'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tahun Lalu
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value, filter_type: 'custom' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value, filter_type: 'custom' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
            <select
              value={filters.outlet_id || ''}
              onChange={(e) => setFilters({ ...filters, outlet_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode Analisis</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Bulanan</option>
              <option value="quarterly">Kuartalan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendapatan Bersih</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.summary.net_revenue || data.summary.total_revenue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.revenue.transaction_count} transaksi
                {data.summary.total_refunds > 0 && (
                  <span className="block text-red-600">
                    Refund: -{formatCurrency(data.summary.total_refunds)}
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.summary.total_expenses)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.expenses.purchase_count} pembelian
                {data.summary.purchase_expenses !== undefined && data.summary.operational_expenses !== undefined && (
                  <span className="block text-xs text-gray-400">
                    Pembelian: {formatCurrency(data.summary.purchase_expenses)} | 
                    Operasional: {formatCurrency(data.summary.operational_expenses)}
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowDownIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Laba Kotor</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.summary.gross_profit)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                HPP: {formatCurrency(data.summary.total_cogs)}
                {data.summary.net_revenue !== undefined && (
                  <span className="block text-xs text-gray-400">
                    Net Revenue: {formatCurrency(data.summary.net_revenue)} - 
                    HPP: {formatCurrency(data.summary.total_cogs)} = 
                    Laba Kotor: {formatCurrency(data.summary.gross_profit)}
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalculatorIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Laba Bersih</p>
              <p className={`text-2xl font-bold ${data.summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.summary.net_profit)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Margin: {data.summary.profit_margin}%
              </p>
            </div>
            <div className={`p-3 rounded-lg ${data.summary.net_profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <BanknotesIcon className={`h-6 w-6 ${data.summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
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
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Revenue vs Expenses Chart */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pendapatan vs Pengeluaran</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.monthly_analysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="net_revenue" fill="#10B981" name="Pendapatan Bersih" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Pengeluaran" />
                    <Line type="monotone" dataKey="net_profit" stroke="#3B82F6" strokeWidth={2} name="Laba Bersih" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Cash Flow */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Arus Kas</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Kas Masuk</span>
                      <span className="font-semibold text-green-600">{formatCurrency(data.cash_flow.inflow)}</span>
                    </div>
                    <div className="pl-4 border-l-2 border-gray-300 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Refund</span>
                        <span className="text-xs text-red-500">-{formatCurrency(data.cash_flow.refunds || 0)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Kas Masuk Bersih</span>
                      <span className="font-semibold text-green-600">{formatCurrency(data.cash_flow.net_inflow || (data.cash_flow.inflow - (data.cash_flow.refunds || 0)))}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Kas Keluar</span>
                        <span className="font-semibold text-red-600">{formatCurrency(data.cash_flow.outflow)}</span>
                      </div>
                      <div className="pl-4 border-l-2 border-gray-300 space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Pengeluaran (Pembelian + Operasional)</span>
                          <span>{formatCurrency((data.cash_flow.outflow || 0) - (data.cash_flow.refunds || 0))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Refund</span>
                          <span>{formatCurrency(data.cash_flow.refunds || 0)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t pt-3">
                      <span className="text-sm font-medium text-gray-900">Net Cash Flow</span>
                      <span className={`font-bold ${data.cash_flow.is_positive ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.cash_flow.net_cash_flow)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cash Flow Ratio</span>
                      <span className="font-semibold">{data.cash_flow.cash_flow_ratio}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rasio Keuangan</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Profit Margin</span>
                      <span className="font-semibold">{data.financial_ratios.profit_margin}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gross Margin</span>
                      <span className="font-semibold">{data.financial_ratios.gross_margin}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expense Ratio</span>
                      <span className="font-semibold">{data.financial_ratios.expense_ratio}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">COGS Ratio</span>
                      <span className="font-semibold">{data.financial_ratios.cogs_ratio}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pendapatan per Metode Pembayaran</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data?.revenue?.by_payment_method || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="net_revenue"
                      >
                        {(data?.revenue?.by_payment_method || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Pendapatan Harian</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data.revenue.by_day}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Area
                        type="monotone"
                        dataKey="net_revenue"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran per Supplier</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.expenses.by_supplier}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="supplier_name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="total_expense" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pengeluaran per Kategori</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Pembelian</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pengeluaran</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.expense_breakdown.by_category.map((category: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {category.category_name || 'Tanpa Kategori'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(category.purchase_count)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(category.total_expense)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(category.avg_unit_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Profit Tab */}
          {activeTab === 'profit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis Laba Rugi</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Pendapatan</span>
                      <span className="font-semibold text-green-600">{formatCurrency(data.revenue.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">HPP (Cost of Goods Sold)</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(data.cogs.total)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm font-medium text-gray-900">Laba Kotor</span>
                      <span className="font-bold text-blue-600">{formatCurrency(data.profit_loss.gross_profit)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Biaya Operasional</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(data.profit_loss.operating_expenses)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm font-medium text-gray-900">Laba Bersih</span>
                      <span className={`font-bold ${data.profit_loss.is_profitable ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.profit_loss.net_profit)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Margin Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gross Profit Margin</span>
                      <span className="font-semibold">{data.profit_loss.gross_profit_margin}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Net Profit Margin</span>
                      <span className="font-semibold">{data.profit_loss.net_profit_margin}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`font-semibold ${data.profit_loss.is_profitable ? 'text-green-600' : 'text-red-600'}`}>
                        {data.profit_loss.is_profitable ? 'Menguntungkan' : 'Rugi'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Analysis Tab */}
          {activeTab === 'monthly' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis Bulanan</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={data.monthly_analysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar yAxisId="left" dataKey="net_revenue" fill="#10B981" name="Pendapatan Bersih" />
                    <Bar yAxisId="left" dataKey="expenses" fill="#EF4444" name="Pengeluaran" />
                    <Line yAxisId="right" type="monotone" dataKey="net_profit" stroke="#3B82F6" strokeWidth={2} name="Laba Bersih" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Bulanan</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bulan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendapatan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengeluaran</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laba Bersih</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.monthly_analysis.map((month: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(month.revenue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(month.expenses)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(month.net_profit)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.profit_margin}%</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              month.is_profitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {month.is_profitable ? 'Menguntungkan' : 'Rugi'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Financial Ratios Tab */}
          {activeTab === 'ratios' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rasio Profitabilitas</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Profit Margin</span>
                      <span className="font-semibold">{data.financial_ratios.profit_margin}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gross Margin</span>
                      <span className="font-semibold">{data.financial_ratios.gross_margin}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Return on Sales</span>
                      <span className="font-semibold">{data.financial_ratios.return_on_sales}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rasio Efisiensi</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expense Ratio</span>
                      <span className="font-semibold">{data.financial_ratios.expense_ratio}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">COGS Ratio</span>
                      <span className="font-semibold">{data.financial_ratios.cogs_ratio}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expense Efficiency</span>
                      <span className="font-semibold">{data.financial_ratios.expense_efficiency}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialReportDashboard;
