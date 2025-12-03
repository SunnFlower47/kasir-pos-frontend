import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { TrashIcon, MinusIcon, PlusIcon, ShoppingCartIcon, TagIcon } from '@heroicons/react/24/outline';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
  useWholesalePrice?: boolean;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onUpdateDiscount: (productId: number, discount: number) => void;
  onRemoveItem: (productId: number) => void;
  onTogglePriceType: (productId: number) => void;
}

const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem,
  onTogglePriceType
}) => {
  // Local state for quantity inputs (to allow empty string for deletion)
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>({});
  const [discountInputs, setDiscountInputs] = useState<Record<number, string>>({});

  // Initialize and sync local state with items
  useEffect(() => {
    setQuantityInputs(prev => {
      const updated = { ...prev };
      items.forEach(item => {
        // Always sync with actual item quantity to keep in sync with button clicks
        updated[item.product.id] = item.quantity.toString();
      });
      // Clean up entries for removed items
      Object.keys(updated).forEach(id => {
        if (!items.find(item => item.product.id === Number(id))) {
          delete updated[Number(id)];
        }
      });
      return updated;
    });

    setDiscountInputs(prev => {
      const updated = { ...prev };
      items.forEach(item => {
        if (updated[item.product.id] === undefined) {
          updated[item.product.id] = item.discount === 0 ? '' : item.discount.toString();
        }
      });
      // Clean up entries for removed items
      Object.keys(updated).forEach(id => {
        if (!items.find(item => item.product.id === Number(id))) {
          delete updated[Number(id)];
        }
      });
      return updated;
    });
  }, [items.map(i => `${i.product.id}:${i.quantity}`).join(',')]); // Update when item IDs or quantities change

  // Get the active price for display
  const getDisplayPrice = (item: CartItem): number => {
    if (item.useWholesalePrice && item.product.wholesale_price > 0) {
      return item.product.wholesale_price;
    }
    return item.product.selling_price;
  };

  // Check if product has wholesale price
  const hasWholesalePrice = (product: Product): boolean => {
    return product.wholesale_price > 0;
  };

  const handleQuantityChange = (productId: number, value: string) => {
    setQuantityInputs(prev => ({ ...prev, [productId]: value }));
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      // Check stock before updating
      const item = items.find(i => i.product.id === productId);
      if (item) {
        const stockQuantity = item.product.stock_quantity || 0;
        if (numValue > stockQuantity) {
          // Don't update if exceeds stock, but allow typing
          return;
        }
        onUpdateQuantity(productId, numValue);
      }
    }
  };

  const handleQuantityBlur = (productId: number, currentValue: string) => {
    const numValue = parseInt(currentValue);
    const item = items.find(i => i.product.id === productId);
    
    if (!item) return;

    const stockQuantity = item.product.stock_quantity || 0;

    if (isNaN(numValue) || numValue < 1) {
      // Reset to 1 if invalid or empty
      onUpdateQuantity(productId, 1);
      setQuantityInputs(prev => ({ ...prev, [productId]: '1' }));
    } else if (numValue > stockQuantity) {
      // Reset to available stock if exceeds
      onUpdateQuantity(productId, stockQuantity);
      setQuantityInputs(prev => ({ ...prev, [productId]: stockQuantity.toString() }));
    } else {
      // Ensure input matches the actual quantity
      setQuantityInputs(prev => ({ ...prev, [productId]: item.quantity.toString() }));
    }
  };

  const handleDiscountChange = (productId: number, value: string) => {
    setDiscountInputs(prev => ({ ...prev, [productId]: value }));
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdateDiscount(productId, numValue);
    }
  };

  const handleDiscountBlur = (productId: number, currentValue: string) => {
    const numValue = parseInt(currentValue);
    if (isNaN(numValue) || numValue < 0 || currentValue === '') {
      // Reset to 0 if invalid or empty
      onUpdateDiscount(productId, 0);
      setDiscountInputs(prev => ({ ...prev, [productId]: '' }));
    } else {
      // Ensure input matches the actual discount after update
      setDiscountInputs(prev => ({ ...prev, [productId]: numValue.toString() }));
    }
  };
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <ShoppingCartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-600">Cart is empty</p>
          <p className="text-sm mt-1 text-gray-500">Add products to start transaction</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
          <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
          <span>Cart ({items.length} item{items.length !== 1 ? 's' : ''})</span>
        </h3>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-3 space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              {/* Product Info - Compact */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {item.product.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${item.useWholesalePrice ? 'text-green-600' : 'text-blue-600'}`}>
                      Rp {getDisplayPrice(item).toLocaleString('id-ID')}
                    </p>
                    {item.useWholesalePrice && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                        Grosir
                      </span>
                    )}
                  </div>
                  {hasWholesalePrice(item.product) && (
                    <button
                      onClick={() => onTogglePriceType(item.product.id)}
                      className="mt-1 flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                      title={item.useWholesalePrice ? 'Ganti ke harga eceran' : 'Ganti ke harga grosir'}
                    >
                      <TagIcon className="w-3 h-3" />
                      <span>{item.useWholesalePrice ? 'Harga Eceran: Rp ' + item.product.selling_price.toLocaleString('id-ID') : 'Harga Grosir: Rp ' + item.product.wholesale_price.toLocaleString('id-ID')}</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1 rounded transition-colors text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  title="Hapus"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Quantity Controls - Compact */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const newQuantity = item.quantity - 1;
                      onUpdateQuantity(item.product.id, newQuantity);
                      // Immediately update local state
                      setQuantityInputs(prev => ({ ...prev, [item.product.id]: newQuantity.toString() }));
                    }}
                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={item.quantity <= 1}
                  >
                    <MinusIcon className="h-3 w-3" />
                  </button>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      value={quantityInputs[item.product.id] ?? item.quantity.toString()}
                      onChange={(e) => handleQuantityChange(item.product.id, e.target.value)}
                      onBlur={(e) => handleQuantityBlur(item.product.id, e.target.value)}
                      className={`w-12 px-1 py-1 text-center text-sm border rounded focus:outline-none focus:ring-1 ${
                        (parseInt(quantityInputs[item.product.id] || item.quantity.toString()) || 0) > (item.product.stock_quantity || 0)
                          ? 'border-red-300 bg-red-50 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      min="1"
                      max={item.product.stock_quantity || 999999}
                    />
                    <span className="text-xs text-gray-500 mt-0.5">
                      Stok: {item.product.stock_quantity || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const newQuantity = item.quantity + 1;
                      onUpdateQuantity(item.product.id, newQuantity);
                      // Immediately update local state
                      setQuantityInputs(prev => ({ ...prev, [item.product.id]: newQuantity.toString() }));
                    }}
                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={(item.product.stock_quantity || 0) <= item.quantity}
                    title={(item.product.stock_quantity || 0) <= item.quantity ? 'Stok tidak mencukupi' : ''}
                  >
                    <PlusIcon className="h-3 w-3" />
                  </button>
                  <span className="text-xs text-gray-500">{item.product.unit?.name || 'pcs'}</span>
                </div>
                <span className="text-sm font-bold text-green-600">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Discount Input - Compact */}
              {item.discount > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-600">Diskon:</label>
                  <input
                    type="number"
                    value={discountInputs[item.product.id] ?? (item.discount === 0 ? '' : item.discount)}
                    onChange={(e) => handleDiscountChange(item.product.id, e.target.value)}
                    onBlur={(e) => handleDiscountBlur(item.product.id, e.target.value)}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="0"
                    max={item.quantity * getDisplayPrice(item)}
                    placeholder="0"
                  />
                </div>
              )}

              {/* Calculation Details - Compact */}
              <div className="text-xs text-gray-500">
                {item.quantity} × Rp {getDisplayPrice(item).toLocaleString('id-ID')}
                {item.discount > 0 && (
                  <span className="text-red-600"> - Rp {item.discount.toLocaleString('id-ID')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cart;
