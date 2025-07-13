import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  UserIcon,
  CurrencyDollarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface TransactionFilters {
  date_from?: string;
  date_to?: string;
  cashier_id?: number;
  status?: string;
  payment_method?: string;
  search?: string;
}

const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({
    // Remove default date filter to show all transactions
    // date_from: new Date().toISOString().split('T')[0], // Today
    // date_to: new Date().toISOString().split('T')[0]    // Today
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  const fetchTransactions = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      console.log('🔄 Fetching transactions with filters:', filters);

      const params = {
        page,
        per_page: pagination.per_page,
        ...filters
      };

      const response = await apiService.getTransactions(params);
      console.log('📊 Transactions Response:', response);
      console.log('📊 Transactions Response Data:', response.data);

      if (response.success && response.data) {
        const data = response.data.data || response.data;
        console.log('📊 Processed Transactions Data:', data);
        console.log('📊 Is Array?', Array.isArray(data));

        // Map transaction_items to items for each transaction
        const mappedTransactions = Array.isArray(data) ? data.map((transaction: any) => ({
          ...transaction,
          items: transaction.transaction_items || transaction.transactionItems || transaction.items || []
        })) : [];

        console.log('📊 Mapped Transactions with items:', mappedTransactions);
        setTransactions(mappedTransactions);

        // Update pagination if available
        if (response.data.current_page) {
          setPagination({
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            per_page: response.data.per_page,
            total: response.data.total
          });
        }

        console.log('✅ Transactions loaded successfully:', data.length, 'items');
      } else {
        console.warn('⚠️ Transactions API failed:', response);
        setTransactions([]);
        toast.error('Gagal memuat data transaksi');
      }
    } catch (error: any) {
      console.error('❌ Error fetching transactions:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Gagal memuat data transaksi';

      if (status === 401) {
        toast.error('Sesi telah berakhir, silakan login kembali');
      } else if (status === 403) {
        toast.error('Akses ditolak: Anda tidak memiliki permission untuk melihat transaksi');
      } else {
        toast.error(`Error ${status || 'Network'}: ${message}`);
      }

      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.per_page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (key: keyof TransactionFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleSearch = () => {
    fetchTransactions(1); // Reset to first page when searching
  };

  const handleClearFilters = () => {
    setFilters({
      date_from: new Date().toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0]
    });
  };

  const handleViewDetail = (transaction: Transaction) => {
    console.log('Navigate to detail for transaction:', transaction);
    navigate(`/transactions/${transaction.id}`);
  };

  const handlePrintReceipt = async (transaction: Transaction) => {
    try {
      // Get printer settings from localStorage
      const printerSettings = localStorage.getItem('printerSettings');
      const settings = printerSettings ? JSON.parse(printerSettings) : { template: '58mm', scale: 90, autoScale: true };

      console.log('🖨️ Printing receipt for transaction:', transaction.id, 'Settings:', settings);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/public/transactions/${transaction.id}/receipt/${settings.template}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // For 58mm POS printer, open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          // Apply scale if auto scale is enabled
          if (settings.autoScale) {
            printWindow.document.body.style.transform = `scale(${settings.scale / 100})`;
            printWindow.document.body.style.transformOrigin = 'top left';
          }
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        // Fallback: download the PDF
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${transaction.transaction_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      window.URL.revokeObjectURL(url);
      toast.success('Struk berhasil dicetak');
    } catch (error) {
      console.error('❌ Error printing receipt:', error);
      toast.error('Gagal mencetak struk');
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      console.log(`Exporting transactions as ${format}...`);
      // TODO: Implement export functionality
      toast.success(`Export ${format.toUpperCase()} akan segera tersedia`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export data');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dibatalkan' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      cash: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Tunai' },
      transfer: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Transfer' },
      qris: { bg: 'bg-green-100', text: 'text-green-800', label: 'QRIS' },
      e_wallet: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'E-Wallet' }
    };

    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.cash;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Riwayat Transaksi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola dan pantau semua transaksi penjualan
          </p>
          <p className="mt-1 text-xs text-blue-600">
            ⚙️ Atur template dan scale printer di menu <strong>Pengaturan → Printer</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FunnelIcon className="h-5 w-5" />
            Filter
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Dari
              </label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Sampai
              </label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Semua Status</option>
                <option value="completed">Selesai</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={filters.payment_method || ''}
                onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Semua Metode</option>
                <option value="cash">Tunai</option>
                <option value="transfer">Transfer</option>
                <option value="qris">QRIS</option>
                <option value="e_wallet">E-Wallet</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSearch}
              className="btn btn-primary"
            >
              Terapkan Filter
            </button>
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor transaksi, pelanggan..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn btn-primary"
          >
            Cari
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kasir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pembayaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium">Tidak ada transaksi</p>
                      <p className="text-sm">Belum ada transaksi yang sesuai dengan filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.transaction_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.items?.length || 0} item
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.transaction_date || (transaction as any).created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {transaction.customer?.name || 'Walk-in Customer'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.user?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentMethodBadge(transaction.payment_method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetail(transaction)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Lihat Detail"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(transaction)}
                          className="text-green-600 hover:text-green-900"
                          title="Cetak Struk"
                        >
                          <PrinterIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchTransactions(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchTransactions(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.last_page}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((pagination.current_page - 1) * pagination.per_page) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => fetchTransactions(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => fetchTransactions(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.current_page
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => fetchTransactions(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TransactionHistory;
