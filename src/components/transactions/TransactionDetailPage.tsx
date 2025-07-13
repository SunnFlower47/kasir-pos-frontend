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
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

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
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTransactionDetail = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching transaction detail for ID:', id);
      const response = await apiService.getTransaction(Number(id));
      console.log('🔍 Raw API response:', response);

      if (response.success && response.data) {
        // Map transaction_items to items for frontend compatibility
        const mappedData = {
          ...response.data,
          items: response.data.transaction_items || response.data.transactionItems || response.data.items || []
        };
        setTransaction(mappedData);
        console.log('Transaction detail loaded:', mappedData);
        console.log('Items count:', mappedData.items?.length || 0);
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
    if (!transaction) return;

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Selesai', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Dibatalkan', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] ||
                  { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
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
    </div>
  );
};

export default TransactionDetailPage;
