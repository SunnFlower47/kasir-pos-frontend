import React from 'react';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { TopProduct } from '../../../hooks/useReportData';

interface TopProductsTableProps {
  topProducts: TopProduct[];
  reportType: string;
  loading?: boolean;
}

const TopProductsTable: React.FC<TopProductsTableProps> = ({ 
  topProducts, 
  reportType, 
  loading = false 
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getTopItemsTitle = (reportType: string) => {
    switch (reportType) {
      case 'sales': return 'Produk Terlaris';
      case 'purchases': return 'Pembelian Terbesar';
      case 'stocks': return 'Stok Tertinggi';
      case 'profit': return 'Profit Tertinggi';
      default: return 'Top Items';
    }
  };

  const getTableDescription = (reportType: string) => {
    switch (reportType) {
      case 'sales': return 'Daftar produk dengan penjualan tertinggi';
      case 'purchases': return 'Daftar item dengan pembelian terbanyak';
      case 'stocks': return 'Daftar produk dengan stok tertinggi';
      case 'profit': return 'Daftar produk dengan profit tertinggi';
      default: return 'Daftar item teratas';
    }
  };

  const getTableHeaders = (reportType: string) => {
    switch (reportType) {
      case 'sales':
        return ['Produk', 'Kategori', 'Terjual', 'Revenue'];
      case 'purchases':
        return ['Supplier', 'Kategori', 'Quantity', 'Total Cost'];
      case 'stocks':
        return ['Produk', 'Kategori', 'Stok', 'Nilai Stok', 'Status'];
      case 'profit':
        return ['Produk', 'Kategori', 'Terjual', 'Revenue', 'Profit'];
      default:
        return ['Item', 'Kategori', 'Quantity', 'Value'];
    }
  };

  const renderTableRow = (product: TopProduct, index: number) => {
    const baseClasses = "px-6 py-4 whitespace-nowrap";
    
    switch (reportType) {
      case 'sales':
        return (
          <tr key={product.id || index} className="hover:bg-gray-50">
            <td className={baseClasses}>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</div>
                </div>
              </div>
            </td>
            <td className={baseClasses}>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                {product.category_name}
              </span>
            </td>
            <td className={baseClasses}>
              <div className="text-sm text-gray-900 font-medium">{formatNumber(product.total_sold)}</div>
              <div className="text-sm text-gray-500">unit</div>
            </td>
            <td className={baseClasses}>
              <div className="text-sm font-medium text-green-600">{formatCurrency(product.total_revenue)}</div>
            </td>
          </tr>
        );

      case 'purchases':
        return (
          <tr key={product.id || index} className="hover:bg-gray-50">
            <td className={baseClasses}>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-medium text-sm">{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{product.supplier_name || product.name}</div>
                  <div className="text-sm text-gray-500">Purchase Order</div>
                </div>
              </div>
            </td>
            <td className={baseClasses}>
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                {product.category_name}
              </span>
            </td>
            <td className={baseClasses}>
              <div className="text-sm text-gray-900 font-medium">{formatNumber(product.purchase_quantity || product.total_sold)}</div>
              <div className="text-sm text-gray-500">items</div>
            </td>
            <td className={baseClasses}>
              <div className="text-sm font-medium text-purple-600">{formatCurrency(product.purchase_cost || product.total_revenue)}</div>
            </td>
          </tr>
        );

      case 'stocks':
        return (
          <tr key={product.id || index} className="hover:bg-gray-50">
            <td className={baseClasses}>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-medium text-sm">{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{product.product_name || product.name}</div>
                  <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</div>
                </div>
              </div>
            </td>
            <td className={baseClasses}>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {product.category_name}
              </span>
            </td>
            <td className={baseClasses}>
              <div className="text-sm text-gray-900 font-medium">{formatNumber(product.quantity || product.total_sold)}</div>
              <div className="text-sm text-gray-500">Min: {formatNumber(product.min_stock || 0)}</div>
            </td>
            <td className={baseClasses}>
              <div className="text-sm font-medium text-green-600">{formatCurrency(product.stock_value || product.total_revenue)}</div>
            </td>
            <td className={baseClasses}>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                product.is_low_stock 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {product.is_low_stock ? 'Stok Menipis' : 'Stok Aman'}
              </span>
            </td>
          </tr>
        );

      case 'profit':
        return (
          <tr key={product.id || index} className="hover:bg-gray-50">
            <td className={baseClasses}>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-medium text-sm">{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</div>
                </div>
              </div>
            </td>
            <td className={baseClasses}>
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                {product.category_name}
              </span>
            </td>
            <td className={baseClasses}>
              <div className="text-sm text-gray-900 font-medium">{formatNumber(product.total_sold)}</div>
              <div className="text-sm text-gray-500">unit</div>
            </td>
            <td className={baseClasses}>
              <div className="text-sm font-medium text-blue-600">{formatCurrency(product.total_revenue)}</div>
            </td>
            <td className={baseClasses}>
              <div className="text-sm font-medium text-green-600">{formatCurrency(product.profit_amount || 0)}</div>
              <div className="text-sm text-gray-500">
                {product.total_revenue > 0 ? 
                  `${(((product.profit_amount || 0) / product.total_revenue) * 100).toFixed(1)}%` : 
                  '0%'
                } margin
              </div>
            </td>
          </tr>
        );

      default:
        return (
          <tr key={product.id || index} className="hover:bg-gray-50">
            <td className={baseClasses}>
              <div className="text-sm font-medium text-gray-900">{product.name}</div>
            </td>
            <td className={baseClasses}>
              <div className="text-sm text-gray-500">{product.category_name}</div>
            </td>
            <td className={baseClasses}>
              <div className="text-sm text-gray-900">{formatNumber(product.total_sold)}</div>
            </td>
            <td className={baseClasses}>
              <div className="text-sm text-gray-900">{formatCurrency(product.total_revenue)}</div>
            </td>
          </tr>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ArchiveBoxIcon className="h-6 w-6 text-gray-600" />
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Array.from({ length: 4 }).map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {Array.from({ length: 4 }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <ArchiveBoxIcon className="h-6 w-6 text-gray-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Detail {getTopItemsTitle(reportType)}</h3>
            <p className="text-gray-600 text-sm mt-1">
              {getTableDescription(reportType)}
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        {topProducts.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {getTableHeaders(reportType).map((header, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((product, index) => renderTableRow(product, index))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <ArchiveBoxIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Tidak ada data {getTopItemsTitle(reportType).toLowerCase()}</p>
            <p className="text-sm text-gray-400 mt-2">Data akan muncul setelah ada transaksi</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopProductsTable;
