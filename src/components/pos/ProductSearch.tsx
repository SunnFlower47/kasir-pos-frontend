import React, { useState, useEffect } from 'react';
import { Product, Category } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

interface ProductSearchProps {
  onAddToCart: (product: Product, quantity?: number) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // No more mock data - 100% API backend

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        apiService.getProducts({
          search: searchTerm || undefined,
          category_id: selectedCategory || undefined,
          is_active: true,
          with_stock: true // Use enhanced API that includes stock
        }),
        apiService.getCategories()
      ]);

      if (productsResponse.success && productsResponse.data) {
        let products = productsResponse.data.data || productsResponse.data;
        products = Array.isArray(products) ? products : [];

        // Products already include stock_quantity from API
        setProducts(products);
        console.log('✅ POS Products loaded:', products.length, 'items with stock info');
      } else {
        setProducts([]);
        toast.error('Gagal memuat data produk');
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
        setCategories(categories);
        console.log('✅ POS Categories loaded:', categories.length, 'items');
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching POS products:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Gagal memuat data produk';

      if (status === 401) {
        toast.error('Sesi telah berakhir, silakan login kembali');
      } else if (status === 403) {
        toast.error('Akses ditolak: Anda tidak memiliki permission untuk melihat data produk');
      } else {
        toast.error(`Error ${status || 'Network'}: ${message}`);
      }

      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm));

    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;

    return matchesSearch && matchesCategory && product.is_active;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Search & Filter */}
      <div className="p-4 bg-white border-b space-y-3">
        {/* Search Input */}
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

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Semua
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => onAddToCart(product)}
                className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Squares2X2Icon className="h-8 w-8 text-gray-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500">{product.sku}</p>
                  <p className="text-sm font-semibold text-primary-600">
                    Rp {product.selling_price.toLocaleString()}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      {product.category?.name} • {product.unit?.name}
                    </p>
                    <p className={`text-xs font-medium ${
                      (product.stock_quantity || 0) > 0
                        ? (product.stock_quantity || 0) <= (product.min_stock || 5)
                          ? 'text-yellow-600'
                          : 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      Stok: {product.stock_quantity || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Squares2X2Icon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada produk</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory
                ? 'Tidak ada produk yang sesuai dengan pencarian'
                : 'Belum ada produk yang tersedia'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
