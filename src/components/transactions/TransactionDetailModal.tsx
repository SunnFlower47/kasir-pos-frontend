import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  PrinterIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface TransactionDetailModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
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
  onClose
}) => {
  const [transactionDetail, setTransactionDetail] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      fetchTransactionDetail();
    }
  }, [isOpen, transaction]);

  const fetchTransactionDetail = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching transaction detail for ID:', transaction.id);
      const response = await apiService.getTransaction(transaction.id);
      console.log('🔍 Raw API response:', response);

      if (response.success && response.data) {
        // Map transaction_items to items for frontend compatibility
        const mappedData = {
          ...response.data,
          items: response.data.transaction_items || response.data.transactionItems || response.data.items || []
        };
        setTransactionDetail(mappedData);
        console.log('Transaction detail loaded:', mappedData);
        console.log('Items count:', mappedData.items?.length || 0);
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
      console.log('🖨️ Printing receipt for transaction:', transaction.id);

      // Generate PDF receipt
      const response = await fetch(`${process.env.REACT_APP_API_URL}/transactions/${transaction.id}/receipt/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
          printWindow.print();
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
    </div>
  );
};

export default TransactionDetailModal;
