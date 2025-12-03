import React, { useState, useEffect } from 'react';
import { Customer, Product } from '../../types';
import { XMarkIcon, PrinterIcon, CreditCardIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import { printerService, ReceiptData } from '../../services/printerService';
import toast from 'react-hot-toast';
import { invalidateTransactionCache, invalidateStockCache, invalidateProductCache } from '../../utils/cacheInvalidation';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
  useWholesalePrice?: boolean;
}

interface PaymentModalProps {
  total: number;
  cart: CartItem[];
  customer: Customer | null;
  totalDiscount: number; // Total discount at transaction level
  onClose: () => void;
  onPaymentComplete: () => void;
}

interface TransactionResponse {
  id: number;
  transaction_number: string;
  total_amount: number;
  customer?: {
    name: string;
  };
}

type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'ewallet';

const PaymentModal: React.FC<PaymentModalProps> = ({
  total,
  cart,
  customer,
  totalDiscount,
  onClose,
  onPaymentComplete
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(total);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionResponse | null>(null);

  const change = paidAmount - total;

  // Helper function to round up to nearest multiple
  const roundUpToNearest = (value: number, multiple: number): number => {
    if (value % multiple === 0) return value;
    return Math.ceil(value / multiple) * multiple;
  };

  // Calculate smart quick amount buttons with rounded values
  const getQuickAmounts = (): number[] => {
    // Round up to nearest 10k first as base
    const baseAmount = roundUpToNearest(total, 10000);
    
    // Calculate three options:
    // 1. Base rounded to 10k
    // 2. Rounded to 50k (or base + 50k if total is close to 50k)
    // 3. Rounded to 100k (or base + 100k if total is close to 100k)
    
    const option1 = baseAmount;
    
    // For option 2, round to nearest 50k, but ensure it's higher than option1
    const rounded50k = roundUpToNearest(total, 50000);
    const option2 = rounded50k > baseAmount ? rounded50k : roundUpToNearest(baseAmount + 50000, 10000);
    
    // For option 3, round to nearest 100k, but ensure it's higher than option2
    const rounded100k = roundUpToNearest(total, 100000);
    const option3 = rounded100k > option2 
      ? rounded100k 
      : roundUpToNearest(option2 + 50000, 10000);
    
    // Return unique values in ascending order
    const amounts = [option1, option2, option3]
      .filter((amount, index, arr) => arr.indexOf(amount) === index)
      .sort((a, b) => a - b);
    
    // Ensure we always have 3 different amounts with minimum 10k spacing
    const finalAmounts: number[] = [amounts[0]];
    
    for (let i = 1; i < amounts.length && finalAmounts.length < 3; i++) {
      const diff = amounts[i] - finalAmounts[finalAmounts.length - 1];
      if (diff >= 10000) {
        finalAmounts.push(amounts[i]);
      } else {
        // Add 50k increment instead
        finalAmounts.push(roundUpToNearest(finalAmounts[finalAmounts.length - 1] + 50000, 10000));
      }
    }
    
    // Fill remaining slots
    while (finalAmounts.length < 3) {
      const last = finalAmounts[finalAmounts.length - 1];
      finalAmounts.push(roundUpToNearest(last + 50000, 10000));
    }
    
    return finalAmounts.slice(0, 3);
  };

  const quickAmounts = getQuickAmounts();

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
        // Send local time in format YYYY-MM-DDTHH:mm:ss (local time, not UTC)
        transaction_date: (() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        })(),
        subtotal: cart.reduce((sum, item) => sum + item.subtotal, 0),
        discount_amount: totalDiscount, // Total discount at transaction level
        tax_amount: 0,
        total_amount: total,
        paid_amount: paidAmount,
        change_amount: change,
        items: cart.map(item => {
          // Use wholesale price if enabled, otherwise use selling price
          // Ensure we always have a valid unit price
          let unitPrice: number;
          if (item.useWholesalePrice && item.product.wholesale_price && item.product.wholesale_price > 0) {
            unitPrice = item.product.wholesale_price;
          } else {
            unitPrice = item.product.selling_price || 0;
          }
          
          // Ensure unit_price is never null or undefined
          if (!unitPrice || unitPrice <= 0) {
            console.error('[PaymentModal] Invalid unit_price:', {
              product_id: item.product.id,
              product_name: item.product.name,
              useWholesalePrice: item.useWholesalePrice,
              selling_price: item.product.selling_price,
              wholesale_price: item.product.wholesale_price,
              calculated_unit_price: unitPrice
            });
            // Fallback to selling price if unit price is invalid
            unitPrice = item.product.selling_price || 0;
          }
          
          
          return {
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: Number(unitPrice), // Always send unit_price explicitly as number
            discount_amount: item.discount || 0, // Item-level discount
            total_price: item.subtotal
          };
        }),
        notes: notes || null
      };

      toast.loading('Memproses transaksi...', { id: 'payment-loading' });

      const response = await apiService.createTransaction(transactionData);

      if (response.success && response.data) {
        toast.dismiss('payment-loading');
        toast.success(`Transaksi berhasil! No: ${response.data.transaction_number}`, {
          duration: 5000
        });

        // Store transaction data for printing
        setTransactionData(response.data);

        // Show change amount
        if (change > 0) {
          toast.success(`Kembalian: Rp ${change.toLocaleString('id-ID')}`, {
            duration: 3000
          });
        }

        // Always print receipt after successful payment
        try {
          await handlePrintReceipt(response.data);
        } catch (printError) {
          console.error('❌ Auto-print failed:', printError);
          // Don't block the transaction if print fails
          toast.error('Transaksi berhasil, tapi gagal mencetak struk. Gunakan tombol "Cetak Ulang"');
        }

        // Invalidate cache after successful transaction
        invalidateTransactionCache(); // Transactions, dashboard, reports
        invalidateStockCache(); // Stock changes after transaction
        invalidateProductCache(); // Product stock info updates
      } else {
        toast.dismiss('payment-loading');
        const errorMsg = response.message || 'Gagal membuat transaksi';
        console.warn('⚠️ Transaction failed:', errorMsg);
        toast.error(errorMsg);
        return;
      }

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

  const handlePrintReceipt = async (transactionResponse?: TransactionResponse) => {
    try {
      const txData = transactionResponse || transactionData;
      if (!txData) {
        toast.error('Data transaksi tidak tersedia');
        return;
      }

      // Get current user info
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

      // Prepare receipt data (company settings will be auto-loaded by printerService)
      const receiptData: ReceiptData = {
        transaction_id: txData.transaction_number,
        date: new Date().toLocaleDateString('id-ID'),
        time: new Date().toLocaleTimeString('id-ID'),
        cashier_name: userInfo.name || 'Kasir',
        customer_name: customer?.name,
        items: cart.map(item => {
          // Use the actual price that was used (wholesale or selling)
          const unitPrice = item.useWholesalePrice && item.product.wholesale_price > 0
            ? item.product.wholesale_price
            : item.product.selling_price;
          return {
            name: item.product.name,
            quantity: item.quantity,
            price: unitPrice,
            total: item.subtotal
          };
        }),
        subtotal: cart.reduce((sum, item) => sum + item.subtotal, 0),
        tax: 0,
        discount: cart.reduce((sum, item) => sum + item.discount, 0),
        total: total,
        payment_method: paymentMethod.toUpperCase(),
        paid_amount: paidAmount,
        change: change,
        // Company settings will be auto-loaded from backend by printerService
        company_name: '',
        company_address: '',
        company_phone: '',
        receipt_footer: ''
      };

      toast.loading('Mencetak struk...', { id: 'printing' });

      const success = await printerService.printReceipt(receiptData);

      toast.dismiss('printing');

      if (success) {
        toast.success('Struk berhasil dicetak!');
      } else {
        toast.error('Gagal mencetak struk');
      }
    } catch (error: any) {
      toast.dismiss('printing');
      console.error('Print error:', error);
      toast.error('Gagal mencetak struk: ' + error.message);
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-2.5 md:p-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base md:text-lg font-bold text-gray-900">
            💳 Pembayaran
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-2.5 md:p-3 space-y-2.5 md:space-y-3 overflow-y-auto flex-1">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-2">
            <h3 className="text-xs font-medium text-gray-900 mb-1.5">Ringkasan Pesanan</h3>
            <div className="space-y-0.5 text-xs">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} item):</span>
                <span>Rp {cart.reduce((sum, item) => sum + (item.quantity * item.product.selling_price), 0).toLocaleString()}</span>
              </div>
              {(cart.reduce((sum, item) => sum + item.discount, 0) > 0 || totalDiscount > 0) && (
                <>
                  {cart.reduce((sum, item) => sum + item.discount, 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Diskon Item:</span>
                      <span>-Rp {cart.reduce((sum, item) => sum + item.discount, 0).toLocaleString()}</span>
                    </div>
                  )}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>Diskon Total:</span>
                      <span className="font-semibold text-red-600">-Rp {totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between font-semibold text-sm border-t pt-0.5 mt-0.5">
                <span>Total:</span>
                <span>Rp {total.toLocaleString()}</span>
              </div>
            </div>

            {customer && (
              <div className="mt-1.5 pt-1.5 border-t text-xs">
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="truncate ml-2">{customer.name}</span>
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
            <h3 className="text-xs font-medium text-gray-900 mb-1.5">Metode Pembayaran</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                      getMethodColor(method.id as PaymentMethod, paymentMethod === method.id)
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mx-auto mb-0.5" />
                    {method.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Amount */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Jumlah Bayar
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                min={total}
                step="1000"
              />

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPaidAmount(amount)}
                    className="py-1 px-1.5 text-[10px] bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Rp {amount.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>

              {/* Change */}
              {paidAmount >= total && (
                <div className="mt-1.5 p-1.5 bg-green-50 rounded">
                  <div className="flex justify-between text-xs">
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
            <div className="p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                {paymentMethod === 'transfer' && 'Silakan transfer ke rekening yang tersedia'}
                {paymentMethod === 'qris' && 'Silakan scan QR Code untuk pembayaran'}
                {paymentMethod === 'ewallet' && 'Silakan gunakan aplikasi e-wallet Anda'}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan..."
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-1.5 md:gap-2 p-2 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 border border-gray-300 rounded-md text-xs md:text-sm text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>

          {/* Show print button if transaction is completed */}
          {transactionData && (
            <button
              onClick={() => handlePrintReceipt()}
              className="py-2 px-2 md:px-3 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 flex items-center gap-1 text-xs md:text-sm"
            >
              <PrinterIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Cetak Ulang</span>
            </button>
          )}

          <button
            onClick={handlePayment}
            disabled={loading || (paymentMethod === 'cash' && paidAmount < total) || !!transactionData}
            className="flex-1 py-2 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-1.5 text-xs md:text-sm font-medium"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 md:h-4 md:w-4 border-b-2 border-white"></div>
            ) : transactionData ? (
              'Selesai'
            ) : (
              <>
                <PrinterIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>Bayar & Cetak</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
