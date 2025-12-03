import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Category, Unit } from '../../types';
import { apiService } from '../../services/api';
import { useApiCache } from '../../hooks/useApiCache';
import { invalidateProductCache, invalidateStockCache } from '../../utils/cacheInvalidation';
import useDebounce from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import ProductForm from './ProductForm';
import CategoryList from '../categories/CategoryList';
import UnitList from '../units/UnitList';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ProductList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'units'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // Units are loaded via cache but not stored in state (used by ProductForm directly via UnitList component)
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showOnlyInactive, setShowOnlyInactive] = useState(false);
  
  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  // const [showBulkActions, setShowBulkActions] = useState(false); // TODO: Implement bulk actions
  const [categoriesError, setCategoriesError] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productStockDistribution, setProductStockDistribution] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10, 
    total: 0
  });

  // Cache categories and units (static data, persist to localStorage)
  const { data: cachedCategories, refetch: refetchCategories } = useApiCache<Category[]>(
    'categories-list',
    async () => {
      const response = await apiService.getCategories();
      if (response.success && response.data) {
        const categoriesData = response.data.data || response.data;
        return Array.isArray(categoriesData) ? categoriesData : [];
      }
      return [];
    },
    { ttl: 30 * 60 * 1000, useLocalStorage: true } // 30 minutes, persist
  );

  const { data: cachedUnits, refetch: refetchUnits } = useApiCache<Unit[]>(
    'units-list',
    async () => {
      const response = await apiService.getUnits();
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    },
    { ttl: 30 * 60 * 1000, useLocalStorage: true } // 30 minutes, persist
  );

  // Load cached data when available (only once when cached data changes)
  useEffect(() => {
    if (cachedCategories && cachedCategories.length > 0) {
      setCategories(cachedCategories);
      setCategoriesLoading(false);
      setCategoriesError(false);
    }
  }, [cachedCategories]);

  // Fetch categories/units on mount if not cached
  useEffect(() => {
    if (!cachedCategories) {
      refetchCategories();
    }
    if (!cachedUnits) {
      refetchUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - refetch functions are stable

  const fetchData = useCallback(async (page: number = 1, signal?: AbortSignal) => {
    setLoading(true);
    setCategoriesLoading(true);
    setCategoriesError(false);
    
    try {
      const productsResponse = await apiService.getProducts({
        search: debouncedSearchTerm || undefined,
        category_id: selectedCategory || undefined,
        is_active: showOnlyInactive ? false : undefined, // Only filter when showing inactive
        with_stock: true, // Include stock information
        page: page,
        per_page: pagination.per_page
      });

      if (signal?.aborted) return;

      // Handle products with pagination
      if (productsResponse.success && productsResponse.data) {
        // productsResponse.data is already the Laravel pagination object
        // It has: current_page, data, last_page, per_page, total, etc.
        const paginationData: any = productsResponse.data;
        
        // Check if it's paginated response (Laravel pagination format)
        if (paginationData && typeof paginationData === 'object' && 'data' in paginationData && 'total' in paginationData) {
          // Laravel pagination format: { current_page, data: [...], last_page, per_page, total, ... }
          const products = Array.isArray(paginationData.data) ? paginationData.data : [];
          setProducts(products);
          
          // Update pagination state from Laravel pagination response
          const newPagination = {
            current_page: paginationData.current_page ?? page,
            last_page: paginationData.last_page ?? Math.ceil((paginationData.total || 0) / (paginationData.per_page || pagination.per_page)),
            per_page: paginationData.per_page ?? pagination.per_page,
            total: paginationData.total ?? 0
          };
          
          // Ensure last_page is calculated correctly if missing
          if (!paginationData.last_page && newPagination.total > 0) {
            newPagination.last_page = Math.ceil(newPagination.total / newPagination.per_page);
          }
          
          setPagination(newPagination);
        } else if (Array.isArray(paginationData)) {
          // Direct array format (fallback) - calculate pagination manually
          setProducts(paginationData);
          const calculatedLastPage = Math.ceil(paginationData.length / pagination.per_page);
          setPagination({
            current_page: page,
            last_page: calculatedLastPage,
            per_page: pagination.per_page,
            total: paginationData.length
          });
        } else {
          setProducts([]);
          console.warn('⚠️ Unknown response format:', paginationData);
        }
      } else {
        setProducts([]);
        toast.error('Gagal memuat data produk');
      }
    } catch (error: any) {
      if (signal?.aborted) return;
      
      console.error('❌ Error fetching data:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Gagal memuat data produk';

      if (status === 401) {
        toast.error('Sesi telah berakhir, silakan login kembali');
      } else if (status === 403) {
        toast.error('Akses ditolak: Anda tidak memiliki permission untuk melihat data produk');
      } else if (status === 422) {
        toast.error('Data tidak valid: ' + message);
      } else if (status === 500) {
        toast.error('Server error: ' + message);
      } else {
        toast.error(`Error ${status || 'Network'}: ${message}`);
      }

      // Show empty state on error
      setProducts([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setCategoriesLoading(false);
      }
    }
  }, [debouncedSearchTerm, selectedCategory, showOnlyInactive, pagination.per_page]); // Removed refetch functions from deps to prevent infinite loop

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
  }, [debouncedSearchTerm, selectedCategory, showOnlyInactive]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchData(pagination.current_page, abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchData, pagination.current_page]);

  // All categories are shown (no filtering needed for categories)
  const filteredCategories = categories;

  // Don't filter on frontend - API already handles filtering
  // Just use products directly from API response
  const filteredProducts = useMemo(() => {
    // Only do minimal client-side filtering if needed (for status)
    // Search and category are already filtered by API
    return products.filter(product => {
      // Status filtering logic (API might not support this filter)
      const matchesStatus = showOnlyInactive ? !product.is_active : product.is_active;
      return matchesStatus;
    });
  }, [products, showOnlyInactive]);

  const getStockStatus = (product: Product | any, quantity?: number) => {
    // Use real stock data from API
    const currentStock = quantity !== undefined ? quantity : (product.stock_quantity || 0);
    const minStock = product.min_stock || 0;

    if (currentStock === 0) {
      return { status: 'out', text: 'Habis', color: 'text-red-600 bg-red-100', quantity: currentStock };
    } else if (currentStock <= minStock) {
      return { status: 'low', text: 'Menipis', color: 'text-yellow-600 bg-yellow-100', quantity: currentStock };
    } else {
      return { status: 'good', text: 'Tersedia', color: 'text-green-600 bg-green-100', quantity: currentStock };
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleViewDetail = async (product: Product) => {
    
    // Set product immediately to show modal
    setSelectedProduct(product);
    
    // Fetch stock distribution and outlets
    setDetailLoading(true);
    try {
      const [stocksResponse, outletsResponse] = await Promise.all([
        apiService.get('/stocks', { 
          product_id: product.id,
          per_page: 1000 
        }),
        apiService.get('/outlets')
      ]);
      
      if (stocksResponse.success && stocksResponse.data) {
        const data = stocksResponse.data.data || stocksResponse.data;
        const distribution = (Array.isArray(data) ? data : []).filter(
          (item: any) => item.product_id === product.id
        );
        setProductStockDistribution(distribution);
      } else {
        setProductStockDistribution([]);
      }
      
      if (outletsResponse && outletsResponse.success && outletsResponse.data) {
        const outletsData = outletsResponse.data.data || outletsResponse.data;
        const outletsArray = Array.isArray(outletsData) ? outletsData : [];
        setOutlets(outletsArray);
      }
    } catch (error) {
      console.error('❌ Error fetching product detail:', error);
      toast.error('Gagal memuat detail produk');
      setProductStockDistribution([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const response = await apiService.deleteProduct(product.id);

      if (response.success) {
        toast.success('Product deleted successfully');
        // Invalidate cache and refresh
        invalidateProductCache();
        invalidateStockCache(); // Stock is related to products
        fetchData(); // Refresh list
      } else {
        toast.error(response.message || 'Failed to delete product');
      }
    } catch (error: any) {
      console.error('❌ Delete product error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to delete product';
      toast.error(message);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const response = await apiService.updateProduct(product.id, {
        ...product,
        is_active: !product.is_active
      });

      if (response.success) {
        toast.success(`Product ${product.is_active ? 'deactivated' : 'activated'} successfully`);
        // Invalidate cache and refresh
        invalidateProductCache();
        fetchData(); // Refresh list
      } else {
        toast.error(response.message || 'Failed to update product status');
      }
    } catch (error: any) {
      console.error('❌ Toggle status error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to update product status';
      toast.error(message);
    }
  };

  const handleFormSuccess = () => {
    // Invalidate cache before refreshing
    invalidateProductCache();
    invalidateStockCache(); // Stock might be affected by product changes
    fetchData(); // Refresh list after successful create/update
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkActivate = async () => {
    if (selectedProducts.length === 0) return;

    try {
      const promises = selectedProducts.map(id => {
        const product = products.find(p => p.id === id);
        if (product) {
          return apiService.updateProduct(id, { ...product, is_active: true });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      toast.success(`✅ ${selectedProducts.length} produk berhasil diaktifkan`);
      setSelectedProducts([]);
      await fetchData();
    } catch (error: any) {
      console.error('❌ Error bulk activating products:', error);
      toast.error('Gagal mengaktifkan produk');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedProducts.length === 0) return;

    try {
      const promises = selectedProducts.map(id => {
        const product = products.find(p => p.id === id);
        if (product) {
          return apiService.updateProduct(id, { ...product, is_active: false });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      toast.success(`✅ ${selectedProducts.length} produk berhasil dinonaktifkan`);
      setSelectedProducts([]);
      await fetchData();
    } catch (error: any) {
      console.error('❌ Error bulk deactivating products:', error);
      toast.error('Gagal menonaktifkan produk');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manajemen Produk</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola produk, kategori, dan satuan
          </p>
          {activeTab === 'products' && (
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span>Total: {products.length} produk</span>
              <span>•</span>
              <span>Aktif: {products.filter(p => p.is_active).length}</span>
              <span>•</span>
              <span>Nonaktif: {products.filter(p => !p.is_active).length}</span>
              <span>•</span>
              <span>Ditampilkan: {filteredProducts.length}</span>
            </div>
          )}
        </div>
        {activeTab === 'products' && (
          <button
            onClick={handleAdd}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Tambah Produk
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Produk
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kategori
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'units'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Satuan
          </button>
        </nav>
      </div>

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <>
          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedProducts.length} produk dipilih
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkActivate}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Aktifkan Semua
              </button>
              <button
                onClick={handleBulkDeactivate}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Nonaktifkan Semua
              </button>
              <button
                onClick={() => setSelectedProducts([])}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">Filter Cepat:</span>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowOnlyInactive(false);
              setSearchTerm('');
            }}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              !selectedCategory && !showOnlyInactive && !searchTerm
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua ({pagination.total})
          </button>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowOnlyInactive(false);
            }}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              !selectedCategory && !showOnlyInactive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Aktif ({!showOnlyInactive ? pagination.total : products.filter(p => p.is_active).length})
          </button>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowOnlyInactive(true);
              setSearchTerm(''); // Clear search when filtering inactive
            }}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              showOnlyInactive
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hanya Nonaktif ({showOnlyInactive ? pagination.total : products.filter(p => !p.is_active).length})
          </button>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowOnlyInactive(false);
              // Filter produk dengan stok rendah
            }}
            className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          >
            Stok Rendah ({products.filter(p => (p.stock_quantity || 0) <= p.min_stock).length})
          </button>
        </div>

        {/* Search dan Filter dalam satu baris */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari produk (nama, SKU, barcode)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Kategori
            </label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                const newValue = e.target.value ? Number(e.target.value) : null;
                setSelectedCategory(newValue);
                setShowOnlyInactive(false); // Reset inactive filter when category changes
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                categoriesError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={categoriesError || categoriesLoading}
            >
              <option value="">
                {categoriesError
                  ? 'Error - Backend tidak tersedia'
                  : categoriesLoading
                    ? 'Memuat kategori...'
                    : `Semua Kategori (${filteredCategories.length} tersedia)`
                }
              </option>
              {!categoriesError && !categoriesLoading && filteredCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {categoriesError && (
              <p className="mt-1 text-xs text-red-600">
                ⚠️ Tidak dapat memuat kategori. Pastikan backend Laravel berjalan.
              </p>
            )}
          </div>

          {/* Checkbox Filter Nonaktif */}
          <div className="flex items-center space-x-2 pb-2">
            <input
              type="checkbox"
              id="showInactiveProducts"
              checked={showOnlyInactive}
              onChange={(e) => {
                setShowOnlyInactive(e.target.checked);
              }}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="showInactiveProducts" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Hanya nonaktif
            </label>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);

                  return (
                    <tr key={product.id} className={!product.is_active ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <div className={`h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center ${!product.is_active ? 'opacity-50' : ''}`}>
                              <span className="text-xs font-medium text-gray-600">
                                {product.name.charAt(0)}
                              </span>
                            </div>
                            {!product.is_active && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">!</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-medium ${product.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                              {product.name}
                              {!product.is_active && (
                                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.sku} • {product.barcode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category?.name}</div>
                        <div className="text-sm text-gray-500">{product.unit?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Rp {product.selling_price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Beli: Rp {product.purchase_price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{stockStatus.quantity}</span>
                          {stockStatus.status === 'low' && (
                            <ExclamationTriangleIcon className="ml-1 h-4 w-4 text-yellow-500" />
                          )}
                          {stockStatus.status === 'out' && (
                            <ExclamationTriangleIcon className="ml-1 h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className={`inline-flex px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                          {stockStatus.text}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          product.is_active
                            ? 'text-green-800 bg-green-100'
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {product.is_active ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetail(product)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Lihat Detail"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                              product.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                            title={product.is_active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                          >
                            {product.is_active ? 'NonAktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            {/* Mobile view */}
            <div className="sm:hidden space-y-3">
              {/* Keterangan pagination untuk mobile */}
              <div className="text-center">
                <p className="text-sm text-gray-700">
                  Menampilkan{' '}
                  <span className="font-medium">
                    {((pagination.current_page - 1) * pagination.per_page) + 1}
                  </span>{' '}
                  sampai{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                  </span>{' '}
                  dari{' '}
                  <span className="font-medium">{pagination.total}</span> hasil
                </p>
              </div>
              {/* Tombol pagination mobile */}
              <div className="flex justify-between">
                <button
                  onClick={() => fetchData(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => fetchData(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.last_page}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Menampilkan{' '}
                  <span className="font-medium">
                    {((pagination.current_page - 1) * pagination.per_page) + 1}
                  </span>{' '}
                  sampai{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                  </span>{' '}
                  dari{' '}
                  <span className="font-medium">{pagination.total}</span> hasil
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => fetchData(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  
                  {/* Always show page 1 */}
                  {pagination.current_page > 3 && pagination.last_page > 5 && (
                    <>
                      <button
                        onClick={() => fetchData(1)}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        1
                      </button>
                      {pagination.current_page > 4 && (
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Show pages around current page */}
                  {Array.from({ length: pagination.last_page }, (_, i) => {
                    const pageNum = i + 1;
                    // Show pages: current-2, current-1, current, current+1, current+2
                    // But only if they're within valid range and not already shown
                    if (
                      pageNum >= Math.max(1, pagination.current_page - 2) &&
                      pageNum <= Math.min(pagination.last_page, pagination.current_page + 2) &&
                      !(pagination.current_page > 3 && pagination.last_page > 5 && pageNum === 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchData(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.current_page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Show ellipsis and last page if needed */}
                  {pagination.current_page < pagination.last_page - 2 && pagination.last_page > 5 && (
                    <>
                      {pagination.current_page < pagination.last_page - 3 && (
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => fetchData(pagination.last_page)}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        {pagination.last_page}
                      </button>
                    </>
                  )}
                  
                  {/* If last_page <= 5, show all pages (already handled above) */}
                  
                  <button
                    onClick={() => fetchData(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada produk</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Mulai dengan menambahkan produk pertama Anda.
                </p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Tab Content */}
      {activeTab === 'categories' && <CategoryList />}
      {activeTab === 'units' && <UnitList />}

      {/* Product Form Modal - Only show for products tab */}
      {activeTab === 'products' && (
        <ProductForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSuccess={handleFormSuccess}
          product={editingProduct}
        />
      )}

      {/* Product Detail Modal */}
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
                <XMarkIcon className="h-6 w-6" />
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
                      <p className="text-gray-900 font-medium">{selectedProduct.min_stock || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        selectedProduct.is_active
                          ? 'text-green-800 bg-green-100'
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {selectedProduct.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
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
                            productStockDistribution.map((stockItem: any) => {
                              const status = getStockStatus(selectedProduct, stockItem.quantity);
                              const outlet = outlets.find(o => o.id === stockItem.outlet_id);
                              return (
                                <tr key={`${stockItem.product_id}-${stockItem.outlet_id}`}>
                                  <td className="px-4 py-3 text-sm text-gray-900">{outlet?.name || '-'}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{stockItem.quantity}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                      {status.text}
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

export default ProductList;
