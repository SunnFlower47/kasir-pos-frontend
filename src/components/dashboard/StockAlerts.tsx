import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductStock } from '../../types';
import { 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface StockAlertsProps {
  lowStockProducts: ProductStock[];
  outOfStockProducts: ProductStock[];
  loading?: boolean;
}

const StockAlerts: React.FC<StockAlertsProps> = ({ 
  lowStockProducts, 
  outOfStockProducts, 
  loading = false 
}) => {
  const navigate = useNavigate();

  const totalAlerts = lowStockProducts.length + outOfStockProducts.length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="p-4 sm:p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (totalAlerts === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Stock Status</h3>
          </div>
        </div>
        <div className="p-4 sm:p-6 text-center">
          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h4 className="text-sm font-medium text-gray-900 mb-1">Semua Stok Aman</h4>
          <p className="text-sm text-gray-500">Tidak ada produk yang memerlukan restock</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Stock Alerts</h3>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {totalAlerts} alerts
          </span>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Out of Stock Products */}
          {outOfStockProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-red-900 flex items-center">
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  Stok Habis ({outOfStockProducts.length})
                </h4>
                {outOfStockProducts.length > 3 && (
                  <button
                    onClick={() => navigate('/stocks?filter=out_of_stock')}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Lihat Semua
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {outOfStockProducts.slice(0, 3).map((stock) => (
                  <div key={`out-${stock.id}`} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {stock.product?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {stock.outlet?.name}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        HABIS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Products */}
          {lowStockProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-yellow-900 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  Stok Menipis ({lowStockProducts.length})
                </h4>
                {lowStockProducts.length > 3 && (
                  <button
                    onClick={() => navigate('/stocks?filter=low_stock')}
                    className="text-xs text-yellow-600 hover:text-yellow-800 font-medium"
                  >
                    Lihat Semua
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 3).map((stock) => (
                  <div key={`low-${stock.id}`} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {stock.product?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {stock.outlet?.name}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 text-right">
                      <p className="text-xs font-medium text-yellow-600">
                        Sisa: {stock.quantity}
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {stock.product?.min_stock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-3 border-t border-gray-200">
            <button
              onClick={() => navigate('/stocks')}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Kelola Semua Stok
              <ArrowRightIcon className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAlerts;
