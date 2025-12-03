import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PrinterIcon,
  UserIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import { printerService, ReceiptData } from '../../services/printerService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

interface TransactionDetail {
  id: number;
  transaction_number: string;
  transaction_date: string;
  customer?: {
    id: number;
    name: string;
    phone?: string;
  };
  outlet?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
  };
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: string;
  status: string;
  notes?: string;
  items: Array<{
    id: number;
    product: {
      id: number;
      name: string;
      sku: string;
      category?: {
        name: string;
      };
    };
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  const fetchTransactionDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getTransaction(Number(id));

      if (response.success && response.data) {
        // Map transaction_items to items for frontend compatibility
        const mappedData = {
          ...response.data,
          items: response.data.transaction_items || response.data.transactionItems || response.data.items || []
        };
        setTransaction(mappedData);
      } else {
        toast.error('Gagal memuat detail transaksi');
        navigate('/transactions');
      }
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      toast.error('Terjadi kesalahan saat memuat data');
      navigate('/transactions');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchTransactionDetail();
    }
  }, [id, fetchTransactionDetail]);


  const handlePrintReceipt = async () => {
    if (!transaction) {
      toast.error('Data transaksi tidak tersedia');
      return;
    }

    try {

      // Prepare receipt data (company settings will be auto-loaded by printerService with outlet priority)
      const receiptData: ReceiptData = {
        transaction_id: transaction.transaction_number,
        date: new Date(transaction.transaction_date).toLocaleDateString('id-ID'),
        time: new Date(transaction.transaction_date).toLocaleTimeString('id-ID'),
        cashier_name: transaction.user?.name || 'Kasir',
        customer_name: transaction.customer?.name,
        items: transaction.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total_price
        })),
        subtotal: transaction.subtotal,
        tax: transaction.tax_amount,
        discount: transaction.discount_amount,
        total: transaction.total_amount,
        payment_method: transaction.payment_method.toUpperCase(),
        paid_amount: transaction.paid_amount,
        change: transaction.change_amount,
        // Company settings will be auto-loaded by printerService with outlet priority
        company_name: '',
        company_address: '',
        company_phone: '',
        receipt_footer: ''
      };

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
    } catch (error: any) {
      toast.dismiss('printing');
      console.error('❌ Error printing receipt:', error);
      toast.error('Gagal mencetak struk: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Selesai', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Dibatalkan', className: 'bg-red-100 text-red-800' },
      refunded: { label: 'Direfund', className: 'bg-orange-100 text-orange-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] ||
                  { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('Alasan refund harus diisi');
      return;
    }

    if (!transaction) return;

    setRefunding(true);
    try {
      const response = await apiService.refundTransaction(transaction.id, refundReason.trim());

      if (response.success) {
        toast.success('Transaksi berhasil direfund!');
        setShowRefundModal(false);
        setRefundReason('');
        // Refresh transaction detail
        await fetchTransactionDetail();
      } else {
        toast.error(response.message || 'Gagal melakukan refund');
      }
    } catch (error: any) {
      console.error('Error refunding transaction:', error);
      toast.error(error.response?.data?.message || 'Gagal melakukan refund');
    } finally {
      setRefunding(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      cash: 'Tunai',
      transfer: 'Transfer Bank',
      qris: 'QRIS',
      e_wallet: 'E-Wallet'
    };
    return methods[method as keyof typeof methods] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat detail transaksi...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Transaksi tidak ditemukan</p>
          <button
            onClick={() => navigate('/transactions')}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Kembali ke Daftar Transaksi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/transactions')}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Detail Transaksi #{transaction.transaction_number}
              </h1>
            </div>
            <div className="flex space-x-2">
              {transaction.status === 'completed' && hasPermission('transactions.refund') && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="btn btn-warning inline-flex items-center"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Refund
                </button>
              )}
              <button
                onClick={handlePrintReceipt}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Cetak Struk
              </button>
            </div>
          </div>
          <div className="px-4 sm:px-6 lg:px-8 pb-2">
            <p className="text-xs text-blue-600">
              ⚙️ Atur template dan scale printer di menu <strong>Pengaturan → Printer</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transaction Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Transaksi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Nomor Transaksi</p>
                    <p className="font-medium">{transaction.transaction_number}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Tanggal</p>
                    <p className="font-medium">{formatDateTime(transaction.transaction_date)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Pelanggan</p>
                    <p className="font-medium">{transaction.customer?.name || 'Umum'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Outlet</p>
                    <p className="font-medium">{transaction.outlet?.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CreditCardIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Metode Pembayaran</p>
                    <p className="font-medium">{getPaymentMethodLabel(transaction.payment_method)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 mr-3 flex items-center justify-center">
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              </div>
              {transaction.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Catatan</p>
                  <p className="mt-1 text-gray-900">{transaction.notes}</p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  Item Transaksi ({transaction.items?.length || 0} item)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produk
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Harga Satuan
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transaction.items?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.name || 'Produk'}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {item.product?.sku || '-'}
                              {item.product?.category && (
                                <span className="ml-2">• {item.product.category.name}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}

                    {(!transaction.items || transaction.items.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          Tidak ada item ditemukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ringkasan Pembayaran</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(transaction.subtotal)}</span>
                </div>
                {transaction.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Diskon</span>
                    <span className="text-red-600">-{formatCurrency(transaction.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pajak</span>
                  <span className="text-gray-900">{formatCurrency(transaction.tax_amount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-base font-medium">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatCurrency(transaction.total_amount)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Dibayar</span>
                  <span className="text-gray-900">{formatCurrency(transaction.paid_amount)}</span>
                </div>
                {transaction.change_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Kembalian</span>
                    <span className="text-green-600">{formatCurrency(transaction.change_amount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Aksi Cepat</h3>
              <div className="space-y-3">
                <button
                  onClick={handlePrintReceipt}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Cetak Struk
                </button>
                <button
                  onClick={() => navigate('/transactions')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Kembali ke Daftar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && transaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Refund Transaksi</h3>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Nomor: <strong>{transaction.transaction_number}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan Refund <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Masukkan alasan refund transaksi ini..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={refunding}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Catatan: Refund akan mengembalikan stok produk dan mengurangi loyalty points (jika ada).
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan. Stok produk akan dikembalikan dan loyalty points akan dikurangi.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason('');
                }}
                disabled={refunding}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleRefund}
                disabled={refunding || !refundReason.trim()}
                className="btn btn-warning"
                disabled={refunding || !refundReason.trim()}
              >
                {refunding ? 'Memproses...' : 'Konfirmasi Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetailPage;
