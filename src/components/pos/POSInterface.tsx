import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFullscreen } from '../../contexts/FullscreenContext';
import { Product, Customer } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { useElectron } from '../../hooks/useElectron';
import { useSearchDebounce } from '../../hooks/useDebounce';
import { usePOSShortcuts } from '../../hooks/useKeyboardShortcuts';
import ProductSearch from './ProductSearch';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import CustomerSelect from './CustomerSelect';
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  CreditCardIcon,
  ClockIcon,
  UserIcon,
  ShoppingCartIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
  useWholesalePrice?: boolean; // Flag to use wholesale price instead of selling price
}

const POSInterface: React.FC = () => {
  const { user } = useAuth();
  const clearProductCacheRef = useRef<(() => void) | null>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { isElectron, printPOSReceipt } = useElectron();

  // Refs for keyboard shortcuts
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalDiscountInput, setTotalDiscountInput] = useState<string>('0');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [heldTransactions, setHeldTransactions] = useState<Array<{
    id: string;
    cart: CartItem[];
    customer: Customer | null;
    discount: number;
    timestamp: Date;
  }>>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [mobileDrawerTab, setMobileDrawerTab] = useState<'cart' | 'held'>('cart');

  // Debounced search
  const { debouncedSearchValue: debouncedBarcode } = useSearchDebounce('', 300);

  // Keyboard shortcuts
  usePOSShortcuts({
    onFocusBarcode: () => {
      // Try barcodeInputRef first, fallback to searchInputRef
      const inputToFocus = barcodeInputRef.current || searchInputRef.current;
      if (inputToFocus) {
        inputToFocus.focus();
        inputToFocus.select();
      }
    },
    onSubmitTransaction: () => cart.length > 0 && setShowPaymentModal(true),
    onFocusSearch: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    },
    onCancelTransaction: () => {
      if (showPaymentModal) {
        setShowPaymentModal(false);
      } else if (cart.length > 0) {
        clearCart();
        toast.success('Transaksi dibatalkan');
      }
    },
    onToggleFullscreen: toggleFullscreen,
  });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate total 
  const calculateTotal = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    return subtotal - totalDiscount;
  }, [cart, totalDiscount]);

  // Handle total discount input change
  const handleTotalDiscountChange = (value: string) => {
    // Allow empty string for clearing input - user can clear all text
    setTotalDiscountInput(value);
    // Only update numeric value - if empty, keep discount at 0 but let input be empty
    const numValue = value === '' ? 0 : (Number(value) || 0);
    if (numValue >= 0) {
      setTotalDiscount(numValue);
    } else {
      setTotalDiscount(0);
    }
  };

  // Handle total discount input blur - format the value
  const handleTotalDiscountBlur = () => {
    const numValue = Number(totalDiscountInput) || 0;
    setTotalDiscount(numValue);
    // Set input to '0' if empty or 0, otherwise show the number
    setTotalDiscountInput(numValue === 0 ? '0' : numValue.toString());
  };

  // Handle debounced barcode search
  useEffect(() => {
    if (debouncedBarcode.trim()) {
      handleBarcodeSearch(debouncedBarcode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedBarcode]); // handleBarcodeSearch intentionally excluded - it's defined after this hook

  // Electron print receipt handler
  useEffect(() => {
    if (!isElectron) return;

    const handleElectronPrint = () => {
      if (cart.length === 0) {
        toast.error('Tidak ada item untuk dicetak');
        return;
      }

      // Create receipt data
      const receiptData = {
        items: cart,
        customer: selectedCustomer,
        total: calculateTotal(),
        discount: totalDiscount,
        timestamp: new Date().toISOString()
      };

      printPOSReceipt(receiptData)
        .then((result) => {
          if (result.success) {
            toast.success('Struk berhasil dicetak');
          } else {
            toast.error('Gagal mencetak struk: ' + result.error);
          }
        })
        .catch((error) => {
          toast.error('Error printing: ' + error.message);
        });
    };

    window.addEventListener('electron-print-receipt', handleElectronPrint);

    return () => {
      window.removeEventListener('electron-print-receipt', handleElectronPrint);
    };
  }, [isElectron, cart, selectedCustomer, totalDiscount, printPOSReceipt, calculateTotal]); 

  // Get the active price for a cart item (wholesale or selling)
  const getItemPrice = (item: CartItem): number => {
    if (item.useWholesalePrice && item.product.wholesale_price > 0) {
      return item.product.wholesale_price;
    }
    return item.product.selling_price;
  };

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
      // Preserve the useWholesalePrice setting when adding quantity
      const price = existingItem.useWholesalePrice && product.wholesale_price > 0 
        ? product.wholesale_price 
        : product.selling_price;
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * price - item.discount }
          : item
      ));
      toast.success(`${product.name} ditambahkan ke keranjang (${totalQuantity})`);
    } else {
      setCart([...cart, {
        product,
        quantity,
        discount: 0,
        useWholesalePrice: false, // Default to selling price
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

    // Find the item to check stock
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    // Check stock availability
    const stockQuantity = item.product.stock_quantity || 0;
    if (quantity > stockQuantity) {
      toast.error(`Stok tidak mencukupi! Stok tersedia: ${stockQuantity}`);
      // Reset to available stock
      quantity = stockQuantity;
    }

    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const price = getItemPrice(item);
        return { ...item, quantity, subtotal: quantity * price - item.discount };
      }
      return item;
    }));
  };

  const updateItemDiscount = (productId: number, discount: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const price = getItemPrice(item);
        return { ...item, discount, subtotal: item.quantity * price - discount };
      }
      return item;
    }));
  };

  // Toggle between selling price and wholesale price
  const toggleItemPriceType = (productId: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const useWholesale = !item.useWholesalePrice;
        // Only allow wholesale if product has wholesale_price > 0
        if (useWholesale && (!item.product.wholesale_price || item.product.wholesale_price <= 0)) {
          toast.error('Produk ini tidak memiliki harga grosir');
          return item;
        }
        const price = useWholesale ? item.product.wholesale_price! : item.product.selling_price;
        return {
          ...item,
          useWholesalePrice: useWholesale,
          subtotal: item.quantity * price - item.discount
        };
      }
      return item;
    }));
  };

  const handleBarcodeSearch = async (searchBarcode: string) => {
    const outletId = user?.outlet_id || user?.outlet?.id;
    if (!searchBarcode.trim()) {
      return;
    }

    if (!outletId) {
      toast.error('Outlet belum ditentukan, tidak dapat memindai barcode');
      return;
    }

    toast.loading('Mencari produk...', { id: 'barcode-search' });
    try {
      const response = await apiService.getProductByBarcode(searchBarcode.trim(), outletId);
      toast.dismiss('barcode-search');

      if (response.success && response.data) {
        addToCart(response.data as Product);
        return;
      }

      toast.error(response.message || 'Produk tidak ditemukan');
    } catch (error) {
      toast.dismiss('barcode-search');
      toast.error('Gagal mencari produk');
    }
  };


  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setTotalDiscount(0);
    setTotalDiscountInput('0');
    // Clear product cache after transaction
    if (clearProductCacheRef.current) {
      clearProductCacheRef.current();
    }
  };

  const holdTransaction = () => {
    if (cart.length === 0) {
      toast.error('Tidak ada item untuk di-hold');
      return;
    }

    const heldTransaction = {
      id: `HOLD-${Date.now()}`,
      cart: [...cart],
      customer: selectedCustomer,
      discount: totalDiscount,
      timestamp: new Date()
    };

    setHeldTransactions(prev => [...prev, heldTransaction]);
    clearCart();
    toast.success(`Transaksi di-hold: ${heldTransaction.id}`);
  };

  const recallTransaction = (heldId: string) => {
    const held = heldTransactions.find(h => h.id === heldId);
    if (!held) {
      toast.error('Transaksi hold tidak ditemukan');
      return;
    }

    // Clear current cart first
    clearCart();

    // Restore held transaction
    setTimeout(() => {
      setCart(held.cart);
      setSelectedCustomer(held.customer);
      setTotalDiscount(held.discount);
      setTotalDiscountInput(held.discount > 0 ? held.discount.toString() : '0');

      // Remove from held transactions
      setHeldTransactions(prev => prev.filter(h => h.id !== heldId));
      
      // Switch to cart tab if drawer is open
      if (isMobileCartOpen) {
        setMobileDrawerTab('cart');
      }
      
      toast.success(`Transaksi dipulihkan: ${heldId}`);
    }, 100);
  };

  return (
    <div className="h-full w-full overflow-hidden flex bg-gray-50">
      {/* Left Panel - Products (55%) */}
      <div className="w-full lg:w-[55%] flex flex-col h-full">
        {/* Professional Header - Minimalist */}
        <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left Section - Title & Status */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
                  <h1 className="text-lg md:text-xl font-semibold text-gray-900">
                    Point of Sale
                  </h1>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-green-700">Online</span>
                </div>
              </div>

              {/* Center Section - Clock */}
              <div className="hidden md:flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-gray-500" />
                <div className="text-sm font-mono text-gray-700">
                  {currentTime.toLocaleTimeString('id-ID')}
                </div>
              </div>

              {/* Right Section - User Info & Controls */}
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">{user?.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 hidden md:block">
                    {user?.outlet?.name || 'Outlet Utama'}
                  </div>
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-600"
                  title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'}
                >
                  {isFullscreen ? (
                    <ArrowsPointingInIcon className="w-4 h-4" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Product Search with Barcode */}
        <div className="flex-1 overflow-hidden bg-white">
          <ProductSearch
            onAddToCart={addToCart}
            searchRef={searchInputRef}
            barcodeInputRef={barcodeInputRef}
            onBarcodeSearch={handleBarcodeSearch}
            onClearCache={(clearFn) => {
              clearProductCacheRef.current = clearFn;
            }}
          />
        </div>
      </div>

      {/* Right Panel - Cart (45%) - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] flex-col bg-white border-l border-gray-200 h-full">
        {/* Customer Selection */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <CustomerSelect
            selectedCustomer={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
          />
        </div>  

        {/* Cart - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onUpdateDiscount={updateItemDiscount}
            onRemoveItem={removeFromCart}
            onTogglePriceType={toggleItemPriceType}
          />
        </div>

        {/* Total Section - Footer Tetap */}
        <div className="p-3 border-t bg-gray-50 border-gray-200">
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal ({cart.length} item):</span>
              <span className="font-semibold">
                Rp {cart.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Diskon Total:
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={totalDiscountInput}
                onChange={(e) => handleTotalDiscountChange(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={handleTotalDiscountBlur}
                className="flex-1 px-3 py-2 text-sm rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between text-xl font-bold border-t pt-4 border-gray-300 text-gray-900">
              <span>TOTAL:</span>
              <span className="text-2xl text-green-600">
                Rp {calculateTotal().toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Footer Tetap */}
        <div className="p-3 border-t space-y-3 bg-white border-gray-200">
          {/* Main Payment Button */}
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-lg font-semibold text-base transition-all duration-200 ${
              cart.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <CreditCardIcon className="w-5 h-5" />
              <span>Process Payment</span>
              <span className="text-xs opacity-75 bg-white/20 px-2 py-1 rounded">F2</span>
            </div>
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className={`py-2 rounded-lg font-medium text-sm transition-colors ${
                cart.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <XMarkIcon className="w-4 h-4 inline mr-1" />
              Clear
            </button>
            <button
              onClick={holdTransaction}
              disabled={cart.length === 0}
              className={`py-2 rounded-lg font-medium text-sm transition-colors ${
                cart.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              <ClockIcon className="w-4 h-4 inline mr-1" />
              Hold
            </button>
          </div>

          {/* Held Transactions */}
          {heldTransactions.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Held Transactions ({heldTransactions.length})
              </h4>
              <div className="space-y-2">
                {heldTransactions.map(held => (
                  <div
                    key={held.id}
                    onClick={() => recallTransaction(held.id)}
                    className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:bg-yellow-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">{held.id}</div>
                      <div className="text-xs text-gray-500">
                        {held.cart.length} items • {held.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-yellow-700">
                      Rp {held.cart.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setMobileDrawerTab('cart');
            setIsMobileCartOpen(true);
          }}
          className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110"
        >
          <ShoppingCartIcon className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Cart Drawer */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
          />
          
          {/* Drawer Content - Slide from right */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl transform transition-transform flex flex-col">
            {/* Drawer Header with Tabs */}
            <div className="border-b bg-blue-600 text-white">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 px-2 pt-2">
                <button
                  onClick={() => setMobileDrawerTab('cart')}
                  className={`flex-1 px-2 py-1.5 rounded-t-lg text-xs font-medium transition-colors ${
                    mobileDrawerTab === 'cart'
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <ShoppingCartIcon className="w-3.5 h-3.5" />
                    <span>Keranjang</span>
                    {cart.length > 0 && (
                      <span className={`px-1 py-0.5 rounded-full text-[10px] font-bold ${
                        mobileDrawerTab === 'cart'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-600'
                      }`}>
                        {cart.length}
                      </span>
                    )}
                  </div>
                </button>
                {heldTransactions.length > 0 && (
                  <button
                    onClick={() => setMobileDrawerTab('held')}
                    className={`flex-1 px-2 py-1.5 rounded-t-lg text-xs font-medium transition-colors ${
                      mobileDrawerTab === 'held'
                        ? 'bg-white text-blue-600'
                        : 'bg-blue-500 text-white hover:bg-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span>Hold</span>
                      <span className={`px-1 py-0.5 rounded-full text-[10px] font-bold ${
                        mobileDrawerTab === 'held'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-600'
                      }`}>
                        {heldTransactions.length}
                      </span>
                    </div>
                  </button>
                )}
              </div>
              {/* Close button */}
              <div className="flex items-center justify-between px-2 pb-1.5 pt-1.5">
                <div className="flex-1"></div>
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 hover:bg-blue-700 rounded-lg border-2 border-white/30 hover:border-white/50 transition-all"
                  title="Tutup"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {mobileDrawerTab === 'cart' ? (
              <>
                {/* Customer Select - Moved to top of drawer */}
                <div className="p-2 border-b bg-gray-50">
                  <CustomerSelect
                    selectedCustomer={selectedCustomer}
                    onCustomerSelect={setSelectedCustomer}
                  />
                </div>

                {/* Cart Items - Scrollable */}
                <div className="flex-1 overflow-hidden">
                  <Cart
                    items={cart}
                    onUpdateQuantity={updateQuantity}
                    onUpdateDiscount={updateItemDiscount}
                    onRemoveItem={removeFromCart}
                    onTogglePriceType={toggleItemPriceType}
                  />
                </div>

                {/* Total Section */}
                <div className="p-2 border-t bg-gray-50 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Subtotal ({cart.length} item):</span>
                    <span className="font-semibold">
                      Rp {cart.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium flex-shrink-0">Diskon:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={totalDiscountInput}
                      onChange={(e) => handleTotalDiscountChange(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={handleTotalDiscountBlur}
                      className="flex-1 px-2 py-1.5 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex justify-between text-base font-bold border-t pt-1.5">
                    <span>TOTAL:</span>
                    <span className="text-lg text-green-600">
                      Rp {calculateTotal().toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-2 border-t space-y-1.5 bg-white">
                  <button
                    onClick={() => {
                      setIsMobileCartOpen(false);
                      setShowPaymentModal(true);
                    }}
                    disabled={cart.length === 0}
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm ${
                      cart.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <CreditCardIcon className="w-4 h-4" />
                      <span>Process Payment</span>
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={clearCart}
                      disabled={cart.length === 0}
                      className={`py-2 rounded-lg font-medium text-sm ${
                        cart.length === 0
                          ? 'bg-gray-200 text-gray-400'
                          : 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800'
                      }`}
                    >
                      <XMarkIcon className="w-4 h-4 inline mr-1" />
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        holdTransaction();
                        // After holding, switch to held tab if drawer is open
                        setTimeout(() => {
                          if (isMobileCartOpen) {
                            setMobileDrawerTab('held');
                          }
                        }, 100);
                      }}
                      disabled={cart.length === 0}
                      className={`py-2 rounded-lg font-medium text-sm ${
                        cart.length === 0
                          ? 'bg-gray-200 text-gray-400'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800'
                      }`}
                    >
                      <ClockIcon className="w-4 h-4 inline mr-1" />
                      Hold
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Held Transactions Content */}
                <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
                  {heldTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                      <ClockIcon className="w-8 h-8 mb-1 text-gray-400" />
                      <p className="text-xs">Tidak ada transaksi yang di-hold</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {heldTransactions.map(held => (
                        <div
                          key={held.id}
                          onClick={() => {
                            recallTransaction(held.id);
                            setMobileDrawerTab('cart');
                          }}
                          className="p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-yellow-50 hover:border-yellow-300 transition-all active:bg-yellow-100 shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-900 mb-0.5">
                                {held.id}
                              </div>
                              <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                                <span>{held.cart.length} items</span>
                                <span>•</span>
                                <span>{held.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {held.customer && (
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  <UserIcon className="w-2.5 h-2.5 inline mr-0.5" />
                                  {held.customer.name}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-sm font-bold text-yellow-700">
                                Rp {held.cart.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('id-ID')}
                              </div>
                              {held.discount > 0 && (
                                <div className="text-[10px] text-gray-500 line-through">
                                  Rp {(held.cart.reduce((sum, item) => sum + item.subtotal, 0) + held.discount).toLocaleString('id-ID')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-gray-100">
                            <div className="text-[10px] text-gray-600 flex-1">
                              <span className="font-medium">Diskon:</span> Rp {held.discount.toLocaleString('id-ID')}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setHeldTransactions(prev => prev.filter(h => h.id !== held.id));
                                toast.success('Transaksi di-hold dihapus');
                              }}
                              className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={calculateTotal()}
          cart={cart}
          customer={selectedCustomer}
          totalDiscount={totalDiscount}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={clearCart}
        />
      )}
    </div>
  );
};

export default POSInterface;
