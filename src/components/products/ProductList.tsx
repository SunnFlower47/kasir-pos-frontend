import React, { useState, useEffect } from 'react';
import { Product, Category, Unit } from '../../types';
import { apiService } from '../../services/api';
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ProductList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'units'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showOnlyInactive, setShowOnlyInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  // const [showBulkActions, setShowBulkActions] = useState(false); // TODO: Implement bulk actions
  const [categoriesError, setCategoriesError] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // No more mock data - 100% API backend

  const fetchData = async () => {
    setLoading(true);
    setCategoriesLoading(true);
    setCategoriesError(false);
    try {
      console.log('Fetching products from API...');
      const [productsResponse, categoriesResponse, unitsResponse] = await Promise.all([
        apiService.getProducts({
          search: searchTerm || undefined,
          category_id: selectedCategory || undefined,
          is_active: showOnlyInactive ? false : undefined, // Only filter when showing inactive
          with_stock: true // Include stock information
        }),
        apiService.getCategories(),
        apiService.getUnits()
      ]);

      console.log('API Responses:', { productsResponse, categoriesResponse, unitsResponse });
      console.log('🏷️ Categories Response Detail:', categoriesResponse);

      // Handle products
      if (productsResponse.success && productsResponse.data) {
        const products = productsResponse.data.data || productsResponse.data;
        setProducts(Array.isArray(products) ? products : []);
        console.log('✅ Products loaded:', products.length, 'items');
      } else {
        console.warn('⚠️ Products API failed');
        setProducts([]);
        toast.error('Gagal memuat data produk');
      }

      // Handle categories
      setCategoriesLoading(false);
      if (categoriesResponse.success && categoriesResponse.data) {
        const categoriesData = categoriesResponse.data.data || categoriesResponse.data; // Handle pagination
        const categories = Array.isArray(categoriesData) ? categoriesData : [];
        setCategories(categories);
        setCategoriesError(false);
        console.log('✅ Categories loaded:', categories.length, 'items');
        console.log('✅ Categories data:', categories);
      } else {
        console.warn('⚠️ Categories API failed:', categoriesResponse);
        setCategories([]);
        setCategoriesError(true);
      }

      // Handle units
      if (unitsResponse.success && unitsResponse.data) {
        const units = Array.isArray(unitsResponse.data) ? unitsResponse.data : [];
        setUnits(units);
        console.log('✅ Units loaded:', units.length, 'items');
      } else {
        console.warn('⚠️ Units API failed');
        setUnits([]);
      }
    } catch (error: any) {
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
      setCategories([]);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory, showOnlyInactive]); // eslint-disable-line react-hooks/exhaustive-deps

  // All categories are shown (no filtering needed for categories)
  const filteredCategories = categories;

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm));

    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;

    // Status filtering logic
    const matchesStatus = showOnlyInactive ? !product.is_active : product.is_active;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockStatus = (product: Product) => {
    // Use real stock data from API
    const currentStock = product.stock_quantity || 0;

    if (currentStock === 0) {
      return { status: 'out', text: 'Habis', color: 'text-red-600 bg-red-100', quantity: currentStock };
    } else if (currentStock <= product.min_stock) {
      return { status: 'low', text: 'Menipis', color: 'text-yellow-600 bg-yellow-100', quantity: currentStock };
    } else {
      return { status: 'good', text: 'Tersedia', color: 'text-green-600 bg-green-100', quantity: currentStock };
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleViewDetail = (product: Product) => {
    // TODO: Open product detail modal
    console.log('View detail for product:', product);
    toast.success(`Detail produk ${product.name} akan segera tersedia`);
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
      console.log('🔄 Deleting product:', product.id);
      const response = await apiService.deleteProduct(product.id);

      if (response.success) {
        toast.success('Product deleted successfully');
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
      console.log('🔄 Toggling product status:', product.id);
      const response = await apiService.updateProduct(product.id, {
        ...product,
        is_active: !product.is_active
      });

      if (response.success) {
        toast.success(`Product ${product.is_active ? 'deactivated' : 'activated'} successfully`);
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
      console.log('🔄 Bulk activating products:', selectedProducts);
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
      console.log('🔄 Bulk deactivating products:', selectedProducts);
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
            Semua ({products.length})
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
            Aktif ({products.filter(p => p.is_active).length})
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
            Hanya Nonaktif ({products.filter(p => !p.is_active).length})
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
                console.log('🔍 Category filter changed:', newValue);
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

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
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
    </div>
  );
};

export default ProductList;
