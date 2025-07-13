import React, { useState, useEffect, useCallback } from 'react';
import { ProductStock, Outlet } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import StockAdjustmentForm from './StockAdjustmentForm';
import StockTransferForm from './StockTransferForm';
import StockOpnameForm from './StockOpnameForm';
import StockHistory from './StockHistory';
import {
  MagnifyingGlassIcon,
  // FunnelIcon, // TODO: Implement filter functionality
  // PlusIcon, // TODO: Implement add stock functionality
  // MinusIcon, // TODO: Implement reduce stock functionality
  ArrowsRightLeftIcon,
  AdjustmentsHorizontalIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const StockList: React.FC = () => {
  const [stocks, setStocks] = useState<ProductStock[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showOpnameForm, setShowOpnameForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'stocks' | 'history'>('stocks');

  // No more mock data - 100% API backend

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedOutlet) params.outlet_id = selectedOutlet;
      // Note: status filtering is done on frontend, not sent to backend

      console.log('🔍 StockList - Fetching data with params:', params);

      // Fetch data in parallel
      const [stocksResponse, outletsResponse] = await Promise.all([
        apiService.get('/stocks', params),
        apiService.get('/outlets')
      ]);

      console.log('🔍 StockList - Raw stocks response:', stocksResponse);
      console.log('🔍 StockList - Raw outlets response:', outletsResponse);

      // Handle stocks
      if (stocksResponse.success && stocksResponse.data) {
        const stocksData = stocksResponse.data.data || stocksResponse.data;
        const stocksArray = Array.isArray(stocksData) ? stocksData : [];
        setStocks(stocksArray);
        console.log('✅ StockList - Stocks loaded:', stocksArray.length, 'items');
        console.log('📊 StockList - Sample stock data:', stocksArray.slice(0, 2));
      } else {
        console.warn('⚠️ StockList - Stocks API failed:', stocksResponse?.message);
        console.warn('📍 StockList - Full stocks response:', stocksResponse);
        setStocks([]);
      }

      // Handle outlets
      if (outletsResponse && outletsResponse.success && outletsResponse.data) {
        // Handle paginated response
        const outletsData = outletsResponse.data.data || outletsResponse.data;
        const outletsArray = Array.isArray(outletsData) ? outletsData : [];
        setOutlets(outletsArray);
        console.log('✅ StockList - Outlets loaded:', outletsArray.length, 'items');
        console.log('📍 StockList - Outlets data:', outletsArray);
      } else {
        console.warn('⚠️ StockList - Outlets API failed:', outletsResponse?.message);
        console.warn('📍 StockList - Full outlets response:', outletsResponse);
        setOutlets([]);
      }
    } catch (error) {
      console.error('❌ StockList - Error fetching data:', error);
      toast.error('Gagal memuat data');
      setStocks([]);
      setOutlets([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedOutlet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedOutlet, selectedStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSuccess = () => {
    fetchData();
    toast.success('Data berhasil diperbarui');
  };

  const getStockStatus = (quantity: number, minStock: number = 10) => {
    if (quantity === 0) return { label: 'Habis', color: 'text-red-600 bg-red-50' };
    if (quantity <= minStock) return { label: 'Rendah', color: 'text-yellow-600 bg-yellow-50' };
    return { label: 'Normal', color: 'text-green-600 bg-green-50' };
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = !searchTerm ||
      stock.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOutlet = !selectedOutlet || stock.outlet_id === selectedOutlet;

    const matchesStatus = !selectedStatus || (() => {
      const status = getStockStatus(stock.quantity);
      return status.label.toLowerCase() === selectedStatus.toLowerCase();
    })();

    const result = matchesSearch && matchesOutlet && matchesStatus;

    // Debug logging untuk troubleshooting filter
    if (!result && !searchTerm && !selectedOutlet && !selectedStatus) {
      console.log('🔍 StockList - Item filtered out unexpectedly:', {
        stock: stock,
        quantity: stock.quantity,
        status: getStockStatus(stock.quantity),
        matchesSearch,
        matchesOutlet,
        matchesStatus
      });
    }

    return result;
  });

  // Debug logging untuk hasil filter
  console.log('📊 StockList - Filter results:', {
    totalStocks: stocks.length,
    filteredStocks: filteredStocks.length,
    searchTerm,
    selectedOutlet,
    selectedStatus,
    stocksByStatus: {
      habis: stocks.filter(s => s.quantity === 0).length,
      rendah: stocks.filter(s => s.quantity > 0 && s.quantity <= 10).length,
      normal: stocks.filter(s => s.quantity > 10).length
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manajemen Stok</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola stok produk di semua outlet
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAdjustmentForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            Penyesuaian
          </button>
          <button
            onClick={() => setShowTransferForm(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowsRightLeftIcon className="h-5 w-5" />
            Transfer
          </button>
          <button
            onClick={() => setShowOpnameForm(true)}
            className="btn btn-warning flex items-center gap-2"
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            Opname
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stocks'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Data Stok
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Riwayat Pergerakan
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'stocks' && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari produk atau SKU..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Outlet Filter */}
              <div>
                <select
                  value={selectedOutlet || ''}
                  onChange={(e) => setSelectedOutlet(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Semua Outlet</option>
                  {outlets.map(outlet => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Semua Status</option>
                  <option value="normal">Normal</option>
                  <option value="rendah">Rendah</option>
                  <option value="habis">Habis</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
                      Stok
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStocks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        {searchTerm || selectedOutlet || selectedStatus
                          ? 'Tidak ada data yang sesuai dengan filter'
                          : 'Belum ada data stok'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.map((stock) => {
                      const status = getStockStatus(stock.quantity);
                      const outlet = outlets.find(o => o.id === stock.outlet_id);

                      return (
                        <tr key={`${stock.product_id}-${stock.outlet_id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {stock.product?.name || 'Produk tidak ditemukan'}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {stock.product?.sku || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {outlet?.name || 'Outlet tidak ditemukan'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {stock.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rp {stock.product?.selling_price?.toLocaleString('id-ID') || '0'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock History Tab */}
      {activeTab === 'history' && <StockHistory />}

      {/* Modal Forms - Outside tab content */}
      <StockAdjustmentForm
        isOpen={showAdjustmentForm}
        onClose={() => setShowAdjustmentForm(false)}
        onSuccess={handleFormSuccess}
      />

      <StockTransferForm
        isOpen={showTransferForm}
        onClose={() => setShowTransferForm(false)}
        onSuccess={handleFormSuccess}
      />

      {showOpnameForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <StockOpnameForm
                onSuccess={() => {
                  setShowOpnameForm(false);
                  handleFormSuccess();
                }}
                onCancel={() => setShowOpnameForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockList;
