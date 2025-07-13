import React from 'react';
import { Product } from '../../types';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onUpdateDiscount: (productId: number, discount: number) => void;
  onRemoveItem: (productId: number) => void;
}

const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem
}) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keranjang kosong</h3>
          <p className="mt-1 text-sm text-gray-500">
            Pilih produk untuk memulai transaksi
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Keranjang ({items.length} item)
        </h3>
        
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
              {/* Product Info */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-xs text-gray-500">{item.product.sku}</p>
                  <p className="text-sm text-primary-600 font-medium">
                    Rp {item.product.selling_price.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="ml-2 p-1 text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    <MinusIcon className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-center text-sm border border-gray-300 rounded"
                    min="1"
                  />
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-xs text-gray-500">{item.product.unit?.name}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-600">Diskon:</label>
                <input
                  type="number"
                  value={item.discount}
                  onChange={(e) => onUpdateDiscount(item.product.id, parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                  min="0"
                  max={item.quantity * item.product.selling_price}
                  placeholder="0"
                />
              </div>

              {/* Subtotal */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-600">Subtotal:</span>
                <span className="text-sm font-semibold text-gray-900">
                  Rp {item.subtotal.toLocaleString()}
                </span>
              </div>

              {/* Calculation Details */}
              <div className="mt-1 text-xs text-gray-500">
                {item.quantity} × Rp {item.product.selling_price.toLocaleString()}
                {item.discount > 0 && ` - Rp ${item.discount.toLocaleString()}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cart;
