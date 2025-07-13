import React, { useState, useEffect } from 'react';
import { Customer, Product } from '../../types';
import { XMarkIcon, PrinterIcon, CreditCardIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
}

interface PaymentModalProps {
  total: number;
  cart: CartItem[];
  customer: Customer | null;
  onClose: () => void;
  onPaymentComplete: () => void;
}

type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'ewallet';

const PaymentModal: React.FC<PaymentModalProps> = ({
  total,
  cart,
  customer,
  onClose,
  onPaymentComplete
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(total);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const change = paidAmount - total;

  useEffect(() => {
    // Auto-set paid amount to total for non-cash payments
    if (paymentMethod !== 'cash') {
      setPaidAmount(total);
    }
  }, [paymentMethod, total]);

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && paidAmount < total) {
      alert('Jumlah bayar tidak mencukupi');
      return;
    }

    setLoading(true);

    try {
      // Process payment via API
      const transactionData = {
        customer_id: customer?.id || null,
        payment_method: paymentMethod,
        subtotal: cart.reduce((sum, item) => sum + (item.quantity * item.product.selling_price), 0),
        discount_amount: cart.reduce((sum, item) => sum + item.discount, 0),
        tax_amount: 0,
        total_amount: total,
        paid_amount: paidAmount,
        change_amount: change,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
          total_price: (item.quantity * item.product.selling_price) - item.discount
        })),
        notes: notes || null
      };

      console.log('🔄 Creating transaction:', transactionData);
      console.log('📦 Transaction items detail:', transactionData.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })));

      toast.loading('Memproses transaksi...', { id: 'payment-loading' });

      const response = await apiService.createTransaction(transactionData);

      console.log('📊 Transaction response:', response);

      if (response.success && response.data) {
        toast.dismiss('payment-loading');
        toast.success(`Transaksi berhasil! No: ${response.data.transaction_number}`, {
          duration: 5000
        });

        console.log('✅ Transaction created successfully:', {
          id: response.data.id,
          transaction_number: response.data.transaction_number,
          total_amount: response.data.total_amount,
          customer: response.data.customer?.name || 'Walk-in Customer'
        });

        // Show change amount
        if (change > 0) {
          toast.success(`Kembalian: Rp ${change.toLocaleString('id-ID')}`, {
            duration: 3000
          });
        }
      } else {
        toast.dismiss('payment-loading');
        const errorMsg = response.message || 'Gagal membuat transaksi';
        console.warn('⚠️ Transaction failed:', errorMsg);
        toast.error(errorMsg);
        return;
      }

      // TODO: Print receipt
      handlePrintReceipt();

      onPaymentComplete();
      onClose();

    } catch (error: any) {
      toast.dismiss('payment-loading');
      console.error('❌ Payment error:', error);
      console.error('❌ Error response:', error.response?.data);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Gagal memproses pembayaran';

      // Special handling for stock errors
      if (message.includes('Insufficient stock') || message.includes('No stock record')) {
        toast.error(`Stok tidak mencukupi: ${message}`, { duration: 5000 });
      } else if (status === 401) {
        toast.error('Sesi telah berakhir, silakan login kembali');
      } else if (status === 403) {
        toast.error('Akses ditolak: Anda tidak memiliki permission untuk membuat transaksi');
      } else if (status === 422) {
        toast.error('Data tidak valid: ' + message);
      } else if (status === 500) {
        toast.error('Server error: ' + message);
      } else if (!status) {
        toast.error('Tidak dapat terhubung ke server');
      } else {
        toast.error(`Error ${status}: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    // TODO: Implement receipt printing
    console.log('Printing receipt...');
  };

  const paymentMethods = [
    { id: 'cash', name: 'Tunai', icon: BanknotesIcon, color: 'green' },
    { id: 'transfer', name: 'Transfer Bank', icon: CreditCardIcon, color: 'blue' },
    { id: 'qris', name: 'QRIS', icon: CreditCardIcon, color: 'purple' },
    { id: 'ewallet', name: 'E-Wallet', icon: CreditCardIcon, color: 'orange' }
  ];

  const getMethodColor = (method: PaymentMethod, selected: boolean) => {
    const colors = {
      cash: selected ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200',
      transfer: selected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      qris: selected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      ewallet: selected ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
    };
    return colors[method];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Pembayaran</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Ringkasan Pesanan</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} item):</span>
                <span>Rp {cart.reduce((sum, item) => sum + (item.quantity * item.product.selling_price), 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Diskon:</span>
                <span>-Rp {cart.reduce((sum, item) => sum + item.discount, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-1">
                <span>Total:</span>
                <span>Rp {total.toLocaleString()}</span>
              </div>
            </div>

            {customer && (
              <div className="mt-2 pt-2 border-t text-sm">
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Poin saat ini:</span>
                  <span>{customer.loyalty_points} poin</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Metode Pembayaran</h3>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      getMethodColor(method.id as PaymentMethod, paymentMethod === method.id)
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mx-auto mb-1" />
                    {method.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Amount */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah Bayar
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                min={total}
                step="1000"
              />

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[total, total + 5000, total + 10000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPaidAmount(amount)}
                    className="py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Rp {amount.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Change */}
              {paidAmount >= total && (
                <div className="mt-2 p-2 bg-green-50 rounded">
                  <div className="flex justify-between text-sm">
                    <span>Kembalian:</span>
                    <span className="font-semibold text-green-600">
                      Rp {change.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Non-cash payment info */}
          {paymentMethod !== 'cash' && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {paymentMethod === 'transfer' && 'Silakan transfer ke rekening yang tersedia'}
                {paymentMethod === 'qris' && 'Silakan scan QR Code untuk pembayaran'}
                {paymentMethod === 'ewallet' && 'Silakan gunakan aplikasi e-wallet Anda'}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk transaksi ini..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handlePayment}
            disabled={loading || (paymentMethod === 'cash' && paidAmount < total)}
            className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <PrinterIcon className="h-4 w-4" />
                Bayar & Cetak
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
