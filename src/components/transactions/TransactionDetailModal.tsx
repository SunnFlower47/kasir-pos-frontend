import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types';
import { apiService } from '../../services/api';
import { printerService, ReceiptData } from '../../services/printerService';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  XMarkIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  PrinterIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface TransactionDetailModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onRefundSuccess?: () => void; // Callback after successful refund
}

interface TransactionDetail {
  id: number;
  transaction_number: string;
  transaction_date?: string;
  total_amount: number;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  paid_amount?: number;
  change_amount?: number;
  status: string;
  payment_method: string;
  customer?: {
    id: number;
    name: string;
    phone?: string;
  };
  user?: {
    id: number;
    name: string;
  };
  items: Array<{
    id: number;
    product_id: number;
    product: {
      id: number;
      name: string;
      sku: string;
      unit?: { name: string };
    };
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  payments: Array<{
    id: number;
    payment_method: string;
    amount: number;
    reference_number?: string;
  }>;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onRefundSuccess
}) => {
  const { hasPermission } = useAuth();
  const [transactionDetail, setTransactionDetail] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      fetchTransactionDetail();
    }
  }, [isOpen, transaction]);

  const fetchTransactionDetail = async () => {
    setLoading(true);
    try {
      const response = await apiService.getTransaction(transaction.id);

      if (response.success && response.data) {
        // Map transaction_items to items for frontend compatibility
        const mappedData = {
          ...response.data,
          items: response.data.transaction_items || response.data.transactionItems || response.data.items || []
        };
        setTransactionDetail(mappedData);
      } else {
        toast.error('Gagal memuat detail transaksi');
      }
    } catch (error: any) {
      console.error('Error fetching transaction detail:', error);
      toast.error('Gagal memuat detail transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async () => {
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

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('Alasan refund harus diisi');
      return;
    }

    setRefunding(true);
    try {
      const response = await apiService.refundTransaction(transaction.id, refundReason.trim());

      if (response.success) {
        toast.success('Transaksi berhasil direfund!');
        setShowRefundModal(false);
        setRefundReason('');
        // Refresh transaction detail
        await fetchTransactionDetail();
        // Call callback to refresh parent component
        if (onRefundSuccess) {
          onRefundSuccess();
        }
        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 1000);
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
    const methodLabels = {
      cash: 'Tunai',
      transfer: 'Transfer Bank',
      qris: 'QRIS',
      e_wallet: 'E-Wallet',
      credit_card: 'Kartu Kredit',
      debit_card: 'Kartu Debit'
    };
    return methodLabels[method as keyof typeof methodLabels] || method;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Detail Transaksi
              </h2>
              <p className="text-sm text-gray-600">
                {transaction.transaction_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {transaction.status === 'completed' && hasPermission('transactions.refund') && (
              <button
                onClick={() => setShowRefundModal(true)}
                className="btn btn-warning flex items-center gap-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Refund
              </button>
            )}
            <button
              onClick={handlePrintReceipt}
              className="btn btn-secondary flex items-center gap-2"
            >
              <PrinterIcon className="h-4 w-4" />
              Cetak Struk
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Informasi Transaksi</h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.transaction_number}
                        </div>
                        <div className="text-sm text-gray-500">Nomor Transaksi</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(transaction.transaction_date || (transaction as any).created_at)}
                        </div>
                        <div className="text-sm text-gray-500">Tanggal Transaksi</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.user?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">Kasir</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="text-sm text-gray-500">Status</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Informasi Pelanggan</h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.customer?.name || 'Walk-in Customer'}
                        </div>
                        <div className="text-sm text-gray-500">Nama Pelanggan</div>
                      </div>
                    </div>

                    {transaction.customer?.phone && (
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.customer.phone}
                          </div>
                          <div className="text-sm text-gray-500">Nomor Telepon</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <CreditCardIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getPaymentMethodLabel(transaction.payment_method)}
                        </div>
                        <div className="text-sm text-gray-500">Metode Pembayaran</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Items */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Item Transaksi</h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Produk
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Harga Satuan
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionDetail?.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{item.product.name}</div>
                              <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-900">
                              {item.quantity} {item.product.unit?.name || 'pcs'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-900">
                              {formatCurrency(item.unit_price)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.total_price)}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {(!transactionDetail?.items || transactionDetail.items.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            {loading ? 'Memuat item...' : 'Tidak ada item ditemukan'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ringkasan Pembayaran</h3>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(transaction.subtotal || transaction.total_amount)}
                    </span>
                  </div>

                  {transaction.tax_amount && transaction.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pajak</span>
                      <span className="text-sm text-gray-900">
                        {formatCurrency(transaction.tax_amount)}
                      </span>
                    </div>
                  )}

                  {transaction.discount_amount && transaction.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Diskon</span>
                      <span className="text-sm text-red-600">
                        -{formatCurrency(transaction.discount_amount)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-gray-900">Total</span>
                      <span className="text-base font-bold text-gray-900">
                        {formatCurrency(transaction.total_amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dibayar</span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(transaction.paid_amount || transaction.total_amount)}
                    </span>
                  </div>

                  {transaction.change_amount && transaction.change_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Kembalian</span>
                      <span className="text-sm text-green-600">
                        {formatCurrency(transaction.change_amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Refund Transaksi</h3>
              <p className="text-sm text-gray-600 mt-1">
                Nomor: {transaction.transaction_number}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
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
                className="btn btn-secondary"
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

export default TransactionDetailModal;
