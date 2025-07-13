import React, { useState, useEffect, useCallback } from 'react';
import { Customer, Transaction } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface CustomerDetailModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
}

interface CustomerStats {
  total_transactions: number;
  total_spent: number;
  last_transaction_date?: string;
  average_transaction: number;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, isOpen, onClose }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total_transactions: 0,
    total_spent: 0,
    average_transaction: 0
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'transactions' | 'stats'>('info');

  const fetchCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching customer data for:', customer.id);

      // Fetch customer transactions
      const transactionsResponse = await apiService.getTransactions({
        customer_id: customer.id,
        per_page: 10
      });

      if (transactionsResponse.success && transactionsResponse.data) {
        const transactionData = transactionsResponse.data.data || transactionsResponse.data;
        const transactionList = Array.isArray(transactionData) ? transactionData : [];
        setTransactions(transactionList);

        // Calculate stats
        const totalSpent = transactionList.reduce((sum: number, t: Transaction) => sum + t.total_amount, 0);
        const totalTransactions = transactionList.length;
        const averageTransaction = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
        const lastTransactionDate = transactionList.length > 0 ? transactionList[0].transaction_date : undefined;

        setStats({
          total_transactions: totalTransactions,
          total_spent: totalSpent,
          average_transaction: averageTransaction,
          last_transaction_date: lastTransactionDate
        });
      }
    } catch (error: any) {
      console.error('Error fetching customer data:', error);
      toast.error('Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    if (isOpen && customer) {
      fetchCustomerData();
    }
  }, [isOpen, customer, fetchCustomerData]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
              <p className="text-sm text-gray-600">Detail Pelanggan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Informasi
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Riwayat Transaksi
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistik
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Informasi Kontak</h3>

                      <div className="flex items-center gap-3">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">Nama Lengkap</div>
                        </div>
                      </div>

                      {customer.phone && (
                        <div className="flex items-center gap-3">
                          <PhoneIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{customer.phone}</div>
                            <div className="text-sm text-gray-500">Nomor Telepon</div>
                          </div>
                        </div>
                      )}

                      {customer.email && (
                        <div className="flex items-center gap-3">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{customer.email}</div>
                            <div className="text-sm text-gray-500">Email</div>
                          </div>
                        </div>
                      )}

                      {customer.address && (
                        <div className="flex items-start gap-3">
                          <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{customer.address}</div>
                            <div className="text-sm text-gray-500">Alamat</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Status Akun</h3>

                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${customer.is_active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {customer.is_active ? 'Aktif' : 'Nonaktif'}
                          </div>
                          <div className="text-sm text-gray-500">Status Pelanggan</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate((customer as any).created_at || new Date().toISOString())}
                          </div>
                          <div className="text-sm text-gray-500">Tanggal Bergabung</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Riwayat Transaksi Terbaru</h3>

                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada transaksi</h3>
                      <p className="mt-1 text-sm text-gray-500">Pelanggan ini belum melakukan transaksi</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              No. Transaksi
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Tanggal
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {transaction.transaction_number}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {formatDate(transaction.transaction_date || (transaction as any).created_at)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                {formatCurrency(transaction.total_amount)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : transaction.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.status === 'completed' ? 'Selesai' :
                                   transaction.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Statistik Pelanggan</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-lg font-medium text-blue-900">
                            {stats.total_transactions}
                          </div>
                          <div className="text-sm text-blue-600">Total Transaksi</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-lg font-medium text-green-900">
                            {formatCurrency(stats.total_spent)}
                          </div>
                          <div className="text-sm text-green-600">Total Belanja</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-lg font-medium text-purple-900">
                            {formatCurrency(stats.average_transaction)}
                          </div>
                          <div className="text-sm text-purple-600">Rata-rata Transaksi</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CalendarIcon className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-lg font-medium text-orange-900">
                            {stats.last_transaction_date ? formatDate(stats.last_transaction_date) : 'Belum ada'}
                          </div>
                          <div className="text-sm text-orange-600">Transaksi Terakhir</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
