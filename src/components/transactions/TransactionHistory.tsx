import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '../../types';
import { apiService } from '../../services/api';
import { printerService, ReceiptData } from '../../services/printerService';
import toast from 'react-hot-toast';
import Pagination, { PaginationData } from '../common/Pagination';
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
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  const fetchTransactions = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {

      const params = {
        page,
        per_page: pagination.per_page,
        ...filters
      };

      const response = await apiService.getTransactions(params);

      if (response.success && response.data) {
        const data = response.data.data || response.data;

        // Map transaction_items to items for each transaction
        const mappedTransactions = Array.isArray(data) ? data.map((transaction: any) => ({
          ...transaction,
          items: transaction.transaction_items || transaction.transactionItems || transaction.items || []
        })) : [];

        setTransactions(mappedTransactions);

        // Update pagination if available
        const responseData: any = response.data;
        if (responseData && typeof responseData === 'object' && 'current_page' in responseData) {
          setPagination({
            current_page: responseData.current_page ?? page,
            last_page: responseData.last_page ?? Math.ceil((responseData.total || 0) / (responseData.per_page || pagination.per_page)),
            per_page: responseData.per_page ?? pagination.per_page,
            total: responseData.total ?? 0
          });
        }

      } else {
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

  const handlePageChange = (page: number) => {
    fetchTransactions(page);
  };

  const handleClearFilters = () => {
    setFilters({
      date_from: new Date().toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0]
    });
  };

  const handleViewDetail = (transaction: Transaction) => {
    navigate(`/transactions/${transaction.id}`);
  };

  const handlePrintReceipt = async (transaction: Transaction) => {
    try {
      toast.loading('Menyiapkan struk...', { id: 'print-prep' });

      // Prepare receipt data (company settings will be auto-loaded by printerService with outlet priority)
      const receiptData: ReceiptData = {
        transaction_id: transaction.transaction_number,
        date: new Date(transaction.transaction_date).toLocaleDateString('id-ID'),
        time: new Date(transaction.transaction_date).toLocaleTimeString('id-ID'),
        cashier_name: transaction.user?.name || 'Kasir',
        customer_name: transaction.customer?.name,
        items: transaction.transaction_items?.map(item => ({
          name: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price,
          total: item.subtotal
        })) || [],
        subtotal: transaction.subtotal || 0,
        tax: transaction.tax_amount || 0,
        discount: transaction.discount_amount || 0,
        total: transaction.total_amount,
        payment_method: transaction.payment_method || 'cash',
        paid_amount: transaction.paid_amount || transaction.total_amount,
        change: transaction.change_amount || 0,
        // Company settings will be auto-loaded by printerService with outlet priority
        company_name: '',
        company_address: '',
        company_phone: '',
        receipt_footer: ''
      };

      toast.dismiss('print-prep');
      toast.loading('Mencetak struk...', { id: 'printing' });

      // Pass outlet_id from transaction if available
      const outletId = transaction.outlet_id || transaction.outlet?.id || null;
      const success = await printerService.printReceipt(receiptData, outletId);

      toast.dismiss('printing');

      if (success) {
        toast.success('Struk berhasil dicetak!');
      } else {
        toast.error('Gagal mencetak struk');
      }
    } catch (error) {
      console.error('❌ Error printing receipt:', error);
      toast.dismiss('print-prep');
      toast.dismiss('printing');
      toast.error('Gagal mencetak struk');
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
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
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dibatalkan' },
      refunded: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Direfund' }
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
                <option value="refunded">Direfund</option>
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
        {!loading && pagination.total > 0 && (
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={loading}
          />
        )}

      </div>
    </div>
  );
};

export default TransactionHistory;
