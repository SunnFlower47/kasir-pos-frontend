import React from 'react';
import { Link } from 'react-router-dom';

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  category_name: string;
  total_sold: number;
  total_revenue: number;
}

interface TopProductsProps {
  products: TopProduct[];
}

const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Produk Terlaris</h3>
        <Link
          to="/reports?tab=products"
          className="text-sm text-primary-600 hover:text-primary-500 font-medium"
        >
          Lihat Laporan
        </Link>
      </div>

      <div className="space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Belum ada data penjualan</p>
          </div>
        ) : (
          products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-600">
                      {index + 1}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">
                    {product.sku} • {product.category_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatNumber(product.total_sold)} terjual
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(product.total_revenue)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopProducts;
