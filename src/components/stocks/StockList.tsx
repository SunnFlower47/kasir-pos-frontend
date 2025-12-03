import React, { useState, useEffect, useCallback } from 'react';
import { ProductStock, Outlet, Product } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { invalidateStockCache, invalidateProductCache } from '../../utils/cacheInvalidation';
import StockAdjustmentForm from './StockAdjustmentForm';
import StockTransferForm from './StockTransferForm';
import StockOpnameForm from './StockOpnameForm';
import StockHistory from './StockHistory';
import Pagination, { PaginationData } from '../common/Pagination';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  MinusIcon,
  EyeIcon,
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
  const [showFilters, setShowFilters] = useState(true);
  const [quickAdjustLoading, setQuickAdjustLoading] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productStockDistribution, setProductStockDistribution] = useState<ProductStock[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showOpnameForm, setShowOpnameForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'stocks' | 'history'>('stocks');
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  // No more mock data - 100% API backend

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // Build query parameters
      const params: any = {
        page,
        per_page: pagination.per_page
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedOutlet) params.outlet_id = selectedOutlet;
      // Note: status filtering is done on frontend, not sent to backend

      // Fetch data in parallel
      const [stocksResponse, outletsResponse] = await Promise.all([
        apiService.get('/stocks', params),
        apiService.get('/outlets')
      ]);

      // Handle stocks
      if (stocksResponse.success && stocksResponse.data) {
        const responseData: any = stocksResponse.data;
        
        // Check if it's paginated response (Laravel pagination format)
        if (responseData && typeof responseData === 'object' && 'data' in responseData && 'total' in responseData) {
          const stocksArray = Array.isArray(responseData.data) ? responseData.data : [];
          setStocks(stocksArray);
          
          // Update pagination state
          setPagination({
            current_page: responseData.current_page ?? page,
            last_page: responseData.last_page ?? Math.ceil((responseData.total || 0) / (responseData.per_page || pagination.per_page)),
            per_page: responseData.per_page ?? pagination.per_page,
            total: responseData.total ?? 0
          });
        } else {
          const stocksData = responseData.data || responseData;
          const stocksArray = Array.isArray(stocksData) ? stocksData : [];
          setStocks(stocksArray);
        }
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
  }, [searchTerm, selectedOutlet, pagination.per_page]);

  // Fetch data when dependencies change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData(1); // Reset to page 1 when filters change
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedOutlet]); // Only reset on filter changes, not fetchData

  const handleFormSuccess = () => {
    // Invalidate cache before refreshing
    invalidateStockCache();
    invalidateProductCache(); // Products show stock info
    fetchData(pagination.current_page);
    toast.success('Data berhasil diperbarui');
  };

  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  const getStockStatus = (quantity: number, minStock: number = 10) => {
    if (quantity === 0) return { label: 'Habis', color: 'text-red-600 bg-red-50' };
    if (quantity <= minStock) return { label: 'Rendah', color: 'text-yellow-600 bg-yellow-50' };
    return { label: 'Normal', color: 'text-green-600 bg-green-50' };
  };

  const handleQuickAdjust = useCallback(async (stock: ProductStock, delta: number) => {
    const stockKey = `${stock.product_id}-${stock.outlet_id}`;
    const newQuantity = stock.quantity + delta;

    if (newQuantity < 0) {
      toast.error('Stok tidak boleh negatif');
      return;
    }

    setQuickAdjustLoading(stockKey);
    try {
      const response = await apiService.adjustStock({
        product_id: stock.product_id,
        outlet_id: stock.outlet_id,
        new_quantity: newQuantity,
        notes: delta > 0 ? `Quick add ${delta}` : `Quick reduce ${Math.abs(delta)}`
      });

      if (response.success) {
        toast.success(`Stok ${delta > 0 ? 'bertambah' : 'berkurang'} ${Math.abs(delta)} unit`);
        // Invalidate cache and refresh
        invalidateStockCache();
        invalidateProductCache(); // Products show stock info
        fetchData();
      } else {
        toast.error(response.message || 'Gagal memperbarui stok');
      }
    } catch (error: any) {
      console.error('❌ Quick adjust error:', error);
      toast.error(error.response?.data?.message || error.message || 'Gagal memperbarui stok');
    } finally {
      setQuickAdjustLoading(null);
    }
  }, [fetchData]);

  const handleViewProduct = useCallback(async (stock: ProductStock) => {
    // If product data is already available, use it immediately
    if (stock.product && stock.product.id) {
      // Set product first so modal appears immediately
      setSelectedProduct(stock.product);
      
      // Set initial distribution from current stocks data
      const initialDistribution = stocks.filter(s => s.product_id === stock.product_id);
      setProductStockDistribution(initialDistribution);
      
      // Still fetch distribution for all outlets in background
      setDetailLoading(true);
      try {
        const stocksResponse = await apiService.get('/stocks', { 
          product_id: stock.product_id,
          per_page: 1000 
        });
        
        if (stocksResponse.success && stocksResponse.data) {
          const data = stocksResponse.data.data || stocksResponse.data;
          const distribution = (Array.isArray(data) ? data : []).filter(
            (item: ProductStock) => item.product_id === stock.product_id
          );
          setProductStockDistribution(distribution);
        }
      } catch (error) {
        console.error('Error fetching stock distribution:', error);
        // Keep using initial distribution
      } finally {
        setDetailLoading(false);
      }
      return;
    }

    // Otherwise, fetch product details from API
    setDetailLoading(true);
    try {
      const [productResponse, stocksResponse] = await Promise.all([
        apiService.getProduct(stock.product_id),
        apiService.get('/stocks', { 
          product_id: stock.product_id,
          per_page: 1000 
        })
      ]);

      if (productResponse.success && productResponse.data) {
        setSelectedProduct(productResponse.data);
      } else {
        console.error('❌ Failed to load product:', productResponse.message);
        toast.error('Gagal memuat detail produk: ' + (productResponse.message || 'Unknown error'));
        setSelectedProduct(null);
        setDetailLoading(false);
        return;
      }

      if (stocksResponse.success && stocksResponse.data) {
        const data = stocksResponse.data.data || stocksResponse.data;
        const distribution = (Array.isArray(data) ? data : []).filter(
          (item: ProductStock) => item.product_id === stock.product_id
        );
        setProductStockDistribution(distribution);
      } else {
        // Fallback to current stocks data
        const distribution = stocks.filter(s => s.product_id === stock.product_id);
        setProductStockDistribution(distribution);
      }
    } catch (error: any) {
      console.error('❌ Error fetching product detail:', error);
      toast.error('Gagal memuat detail produk: ' + (error.message || 'Unknown error'));
      setSelectedProduct(null);
      setProductStockDistribution([]);
    } finally {
      setDetailLoading(false);
    }
  }, [stocks]);

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = !searchTerm ||
      stock.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOutlet = !selectedOutlet || stock.outlet_id === selectedOutlet;

    const matchesStatus = !selectedStatus || (() => {
      const status = getStockStatus(stock.quantity);
      return status.label.toLowerCase() === selectedStatus.toLowerCase();
    })();

    return matchesSearch && matchesOutlet && matchesStatus;
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
            onClick={() => setShowFilters(prev => !prev)}
            className="btn btn-light flex items-center gap-2"
          >
            <FunnelIcon className="h-5 w-5" />
            {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
          </button>
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
          {showFilters && (
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
          )}

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
                            <div className="flex items-center justify-between gap-2">
                              <span>{stock.quantity}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleQuickAdjust(stock, -1)}
                                  disabled={stock.quantity === 0 || quickAdjustLoading === `${stock.product_id}-${stock.outlet_id}`}
                                  className="p-1 rounded-full border text-gray-500 hover:text-red-600 hover:border-red-200 disabled:opacity-40"
                                  title="Kurangi 1"
                                >
                                  <MinusIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleQuickAdjust(stock, 1)}
                                  disabled={quickAdjustLoading === `${stock.product_id}-${stock.outlet_id}`}
                                  className="p-1 rounded-full border text-gray-500 hover:text-green-600 hover:border-green-200 disabled:opacity-40"
                                  title="Tambah 1"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center justify-between gap-2">
                              <span>Rp {stock.product?.selling_price?.toLocaleString('id-ID') || '0'}</span>
                              <button
                                onClick={() => handleViewProduct(stock)}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-medium"
                              >
                                <EyeIcon className="h-4 w-4" />
                                Detail
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {!loading && pagination.total > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
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

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full shadow-xl">
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-500">
                  SKU: {selectedProduct.sku} • Barcode: {selectedProduct.barcode || '-'}
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Kategori</p>
                  <p className="text-gray-900 font-medium">{selectedProduct.category?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Satuan</p>
                  <p className="text-gray-900 font-medium">{selectedProduct.unit?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Harga Jual</p>
                  <p className="text-gray-900 font-medium">
                    Rp {selectedProduct.selling_price?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Harga Modal</p>
                  <p className="text-gray-900 font-medium">
                    Rp {selectedProduct.purchase_price?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stok Minimum</p>
                  <p className="text-gray-900 font-medium">{selectedProduct.min_stock}</p>
                </div>
              </div>

                  <div>
                    <h4 className="text-md font-semibold mb-3">Distribusi Stok per Outlet</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {productStockDistribution.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                                Distribusi stok tidak tersedia
                              </td>
                            </tr>
                          ) : (
                            productStockDistribution.map(stock => {
                              const status = getStockStatus(stock.quantity, selectedProduct.min_stock);
                              const outlet = outlets.find(o => o.id === stock.outlet_id);
                              return (
                                <tr key={`${stock.product_id}-${stock.outlet_id}`}>
                                  <td className="px-4 py-3 text-sm text-gray-900">{outlet?.name || '-'}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{stock.quantity}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                      {status.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-4 border-t text-right">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockList;
