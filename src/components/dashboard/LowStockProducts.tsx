import React from 'react';
import { Link } from 'react-router-dom';
import { ProductStock } from '../../types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface LowStockProductsProps {
  products: ProductStock[];
}

const LowStockProducts: React.FC<LowStockProductsProps> = ({ products }) => {
  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return {
        label: 'Habis',
        color: 'bg-red-100 text-red-800',
        icon: true,
      };
    } else if (quantity <= minStock) {
      return {
        label: 'Menipis',
        color: 'bg-yellow-100 text-yellow-800',
        icon: true,
      };
    }
    return {
      label: 'Normal',
      color: 'bg-green-100 text-green-800',
      icon: false,
    };
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Stok Menipis</h3>
        <Link
          to="/stocks"
          className="text-sm text-primary-600 hover:text-primary-500 font-medium"
        >
          Kelola Stok
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-green-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-gray-500">Semua produk memiliki stok yang cukup</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outlet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok Saat Ini
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min. Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((stock) => {
                const status = getStockStatus(
                  stock.quantity,
                  stock.product?.min_stock || 0
                );
                
                return (
                  <tr key={`${stock.product_id}-${stock.outlet_id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {stock.product?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stock.product?.sku}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stock.outlet?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stock.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stock.product?.min_stock || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon && (
                          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                        )}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/stocks/adjust?product_id=${stock.product_id}&outlet_id=${stock.outlet_id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Sesuaikan
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LowStockProducts;
