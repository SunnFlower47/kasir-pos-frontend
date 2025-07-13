import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Product, Customer } from '../../types';
import toast from 'react-hot-toast';
import ProductSearch from './ProductSearch';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import CustomerSelect from './CustomerSelect';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
}

const POSInterface: React.FC = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [barcode, setBarcode] = useState('');

  const addToCart = (product: Product, quantity: number = 1) => {
    // Check stock availability
    const stockQuantity = product.stock_quantity || 0;
    const existingItem = cart.find(item => item.product.id === product.id);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const totalQuantity = currentCartQuantity + quantity;

    if (stockQuantity <= 0) {
      toast.error(`Produk ${product.name} tidak tersedia (stok habis)`);
      return;
    }

    if (totalQuantity > stockQuantity) {
      toast.error(`Stok tidak mencukupi! Tersedia: ${stockQuantity}, diminta: ${totalQuantity}`);
      return;
    }

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * product.selling_price }
          : item
      ));
      toast.success(`${product.name} ditambahkan ke keranjang (${totalQuantity})`);
    } else {
      setCart([...cart, {
        product,
        quantity,
        discount: 0,
        subtotal: quantity * product.selling_price
      }]);
      toast.success(`${product.name} ditambahkan ke keranjang`);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity, subtotal: quantity * item.product.selling_price - item.discount }
        : item
    ));
  };

  const updateItemDiscount = (productId: number, discount: number) => {
    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, discount, subtotal: item.quantity * item.product.selling_price - discount }
        : item
    ));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    return subtotal - totalDiscount;
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      // TODO: Search product by barcode and add to cart
      console.log('Searching for barcode:', barcode);
      setBarcode('');
    }
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setTotalDiscount(0);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel - Product Search & Cart */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">POS Kasir</h1>
            <div className="text-sm text-gray-500">
              Kasir: {user?.name} | Outlet: {user?.outlet?.name || 'Outlet Utama'}
            </div>
          </div>
        </div>

        {/* Barcode Scanner */}
        <div className="bg-white border-b p-4">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan barcode atau ketik kode produk..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Cari
            </button>
          </form>
        </div>

        {/* Product Search */}
        <div className="flex-1 overflow-hidden">
          <ProductSearch onAddToCart={addToCart} />
        </div>
      </div>

      {/* Right Panel - Cart & Payment */}
      <div className="w-96 bg-white shadow-lg flex flex-col">
        {/* Customer Selection */}
        <div className="p-4 border-b">
          <CustomerSelect
            selectedCustomer={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
          />
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-hidden">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onUpdateDiscount={updateItemDiscount}
            onRemoveItem={removeFromCart}
          />
        </div>

        {/* Total & Discount */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>Rp {cart.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Diskon Total:</label>
              <input
                type="number"
                value={totalDiscount}
                onChange={(e) => setTotalDiscount(Number(e.target.value))}
                className="flex-1 px-2 py-1 text-sm border rounded"
                min="0"
              />
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>Rp {calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t space-y-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300"
          >
            Bayar (F2)
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={clearCart}
              className="py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Clear
            </button>
            <button className="py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
              Hold
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={calculateTotal()}
          cart={cart}
          customer={selectedCustomer}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={clearCart}
        />
      )}
    </div>
  );
};

export default POSInterface;
