import React, { useState, useEffect, RefObject, useRef, useCallback } from 'react';
import { Product, Category } from '../../types';
import { apiService } from '../../services/api';
import { useSearchDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, PlusIcon, ShoppingCartIcon, Squares2X2Icon, ChevronDownIcon, ArchiveBoxIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface ProductSearchProps {
  onAddToCart: (product: Product, quantity?: number) => void;
  searchRef?: RefObject<HTMLInputElement | null>;
  barcodeInputRef?: RefObject<HTMLInputElement | null>;
  onBarcodeSearch?: (barcode: string) => void;
  className?: string;
  onClearCache?: (clearCacheFn: () => void) => void; // Callback to expose clearCache function
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  onAddToCart,
  searchRef,
  barcodeInputRef,
  onBarcodeSearch,
  className = '',
  onClearCache
}) => {
  // Helper: detect if current input looks like a barcode / scanner input
  const isBarcodeSearch = useCallback((value: string) => {
    if (!value) return false;
    const trimmed = value.trim();
    // Pure digits with length >= 6 (EAN, custom codes, etc.)
    if (/^\d{6,}$/.test(trimmed)) return true;
    // Alphanumeric SKU / barcode-like codes length >= 6
    if (/^[A-Z0-9-_]{6,}$/i.test(trimmed)) return true;
    return false;
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularCategories, setPopularCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PRODUCTS_PER_PAGE = 50;
  
  // Cache for products per category (TTL: 2 minutes)
  const [productCache, setProductCache] = useState<Map<number | null, {
    products: Product[];
    topProducts: Product[];
    timestamp: number;
    hasMore: boolean;
    currentPage: number;
  }>>(new Map());
  
  const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  // Search with debounce hook (sedikit lebih lambat untuk mengurangi request)
  const { searchValue: searchTerm, debouncedSearchValue, setSearchValue: setSearchTerm } = useSearchDebounce('', 500);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [searchLoading, setSearchLoading] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search products function
  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Jangan panggil API suggestion kalau inputnya kelihatan seperti barcode
    // Barcode akan di-handle lewat onBarcodeSearch (Enter) supaya tidak spam request
    if (isBarcodeSearch(query)) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await apiService.getProducts({
        search: query,
        category_id: selectedCategory || undefined, // Filter suggestion sesuai kategori yang dipilih
        is_active: true,
        with_stock: true,
        limit: 10 // Limit suggestions
      });

      if (response.success && response.data) {
        const products = Array.isArray(response.data.data) ? response.data.data :
                        Array.isArray(response.data) ? response.data : [];
        setSearchSuggestions(products);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchLoading(false);
    }
  }, [isBarcodeSearch, selectedCategory]);

  // Effect to trigger search when debounced value changes
  useEffect(() => {
    searchProducts(debouncedSearchValue);
  }, [debouncedSearchValue, searchProducts]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;                                                                                                                                   

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedProduct = searchSuggestions[selectedSuggestionIndex];
          onAddToCart(selectedProduct);
          setShowSuggestions(false);
          setSearchTerm('');
        }
        break;
      case 'Escape':
        // Only close suggestions, don't interfere with transaction cancel
        if (showSuggestions) {
          e.stopPropagation();
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
    }
  }, [showSuggestions, searchSuggestions, selectedSuggestionIndex, onAddToCart, setSearchTerm]);

  // No more mock data - 100% API backend
  const fetchData = useCallback(async (page: number = 1, append: boolean = false) => {
    // Check cache first (only for first page and not appending)
    const cacheKey = selectedCategory || null;
    if (!append && page === 1) {
      const cached = productCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // Use cached data
        setProducts(cached.products);
        setTopProducts(cached.topProducts);
        setHasMore(cached.hasMore);
        setCurrentPage(cached.currentPage);
        setLoading(false);
        return;
      }
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCurrentPage(1);
    }

    try {
      // Determine limit based on mode
      let limit: number | undefined;
      if (selectedCategory) {
        // Filter kategori: 50 produk per page
        limit = PRODUCTS_PER_PAGE;
      } else if (showAllProducts) {
        // Show all: no limit (tapi sebaiknya tetap ada limit untuk safety)
        limit = 100;
      } else {
        // Default: 12 top products
        limit = 12;
      }

      // Build API params
      const productsParams: any = {
        // Grid utama TIDAK ikut search text - hanya top products + filter kategori
        category_id: selectedCategory || undefined,
        is_active: true,
        with_stock: true,
        per_page: limit, // Laravel pagination uses per_page
        page: page, // Laravel pagination uses page
        sort_by: showAllProducts ? undefined : 'total_sold', // Sort by popularity
        sort_order: showAllProducts ? undefined : 'desc'
      };

      // Fetch top products (12 items) and categories
      const [productsResponse, categoriesResponse, allProductsResponse] = await Promise.all([
        apiService.getProducts(productsParams),
        apiService.getCategories(),
        // Fetch all products untuk menghitung kategori terpopuler (hanya sekali, tidak perlu di pagination)
        page === 1 ? apiService.getProducts({
          is_active: true,
          with_stock: true,
          limit: 1000, // Ambil cukup banyak untuk statistik
          sort_by: 'total_sold',
          sort_order: 'desc'
        }) : Promise.resolve({ success: false, data: null })
      ]);

      if (productsResponse.success && productsResponse.data) {
        // Handle Laravel pagination response
        const paginationData: any = productsResponse.data.data || productsResponse.data;
        let newProducts: Product[] = [];
        let totalPages = 1;
        let currentPageNum = 1;

        if (paginationData && typeof paginationData === 'object' && 'data' in paginationData) {
          // Laravel pagination format
          newProducts = Array.isArray(paginationData.data) ? paginationData.data : [];
          totalPages = paginationData.last_page || paginationData.total_pages || 1;
          currentPageNum = paginationData.current_page || paginationData.page || 1;
          
        } else if (Array.isArray(paginationData)) {
          // Direct array format (fallback)
          newProducts = paginationData;
        }

        // Check if there are more products
        let shouldShowLoadMore = false;
        if (selectedCategory) {
          // Check if there are more pages (from Laravel pagination)
          const hasMorePages = totalPages > 1 && currentPageNum < totalPages;
          // Also check if we got full page of products (might be more even if pagination info missing)
          const gotFullPage = newProducts.length >= PRODUCTS_PER_PAGE;
          // If we got exactly PRODUCTS_PER_PAGE items, likely there are more
          const likelyHasMore = gotFullPage && newProducts.length === PRODUCTS_PER_PAGE;
          
          shouldShowLoadMore = hasMorePages || likelyHasMore;
          setHasMore(shouldShowLoadMore);
        } else {
          setHasMore(false);
        }

        // Set products based on mode
        if (append && selectedCategory) {
          // Append products for load more
          setProducts(prev => [...prev, ...newProducts]);
        } else if (showAllProducts || selectedCategory) {
          setProducts(newProducts);
        } else {
          setTopProducts(newProducts.slice(0, 12)); // Top 12 products
          setProducts(newProducts);
        }

        // Save to cache (only for first page, not appending)
        if (!append && page === 1) {
          const cacheKey = selectedCategory || null;
          setProductCache(prev => {
            const newCache = new Map(prev);
            const topProds = showAllProducts || selectedCategory ? [] : newProducts.slice(0, 12);
            const finalProducts = showAllProducts || selectedCategory ? newProducts : newProducts;
            
            newCache.set(cacheKey, {
              products: finalProducts,
              topProducts: topProds,
              timestamp: Date.now(),
              hasMore: selectedCategory ? shouldShowLoadMore : false,
              currentPage: currentPageNum
            });
            
            return newCache;
          });
        }

      } else {
        if (!append) {
          setProducts([]);
          setTopProducts([]);
        }
        if (!append) {
          toast.error('Gagal memuat data produk');
        }
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        // Handle different response formats
        let categories = [];
        if (Array.isArray(categoriesResponse.data)) {
          categories = categoriesResponse.data;
        } else if (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data)) {
          categories = categoriesResponse.data.data;
        } else if (categoriesResponse.data.categories && Array.isArray(categoriesResponse.data.categories)) {
          categories = categoriesResponse.data.categories;
        }
        setCategories(categories);

        // Calculate popular categories from products (hanya di page 1)
        if (page === 1 && allProductsResponse && allProductsResponse.success && allProductsResponse.data) {
          let allProducts = allProductsResponse.data.data || allProductsResponse.data;
          allProducts = Array.isArray(allProducts) ? allProducts : [];

          // Group products by category and calculate total_sold
          const categoryStats = new Map<number, { category: Category, totalSold: number }>();
          
          allProducts.forEach((product: any) => {
            if (product.category_id) {
              const category = categories.find((c: Category) => c.id === product.category_id);
              if (category) {
                const totalSold = (product.total_sold || 0) + (product.total_sold_count || 0);
                const existing = categoryStats.get(product.category_id);
                if (existing) {
                  existing.totalSold += totalSold;
                } else {
                  categoryStats.set(product.category_id, {
                    category,
                    totalSold: totalSold
                  });
                }
              }
            }
          });

          // Sort by total_sold and take top 5
          const popular = Array.from(categoryStats.values())
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 5)
            .map(item => item.category);

          setPopularCategories(popular);
        }
      } else {
        console.warn('⚠️ Categories response not successful:', categoriesResponse);
        setCategories([]);
        setPopularCategories([]);
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

      if (!append) {
        setProducts([]);
        setCategories([]);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [selectedCategory, showAllProducts]);

  // Clear cache function - exposed to parent component
  const clearProductCache = useCallback(() => {
    setProductCache(new Map());
  }, []);

  // Expose clearCache function to parent via callback
  useEffect(() => {
    if (onClearCache) {
      onClearCache(clearProductCache);
    }
  }, [onClearCache, clearProductCache]);

  // Load more products
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && selectedCategory) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchData(nextPage, true);
    }
  }, [loadingMore, hasMore, selectedCategory, currentPage, fetchData]);

  // Initial load & refetch ketika filter berubah
  useEffect(() => {
    fetchData();
  }, [fetchData, selectedCategory]);

  // Display logic: show top products by default, all products when filter kategori / showAll aktif
  const displayProducts = React.useMemo(() => {
    if (selectedCategory || showAllProducts) {
      return products; // Show all products when filter kategori / showAll
    }
    return topProducts; // Show only top 12 products by default
  }, [products, topProducts, selectedCategory, showAllProducts]);

  const filteredProducts = displayProducts.filter(product => {
    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;

    // Grid kartu TIDAK ikut search text, hanya kategori + status aktif
    return matchesCategory && product.is_active;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header & Search */}
      <div className="p-4 border-b bg-white border-gray-200">
        {/* Title & Toggle */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <ArchiveBoxIcon className="w-5 h-5 text-blue-600" />
            <span>Products</span>
          </h2>
        </div>

        {/* Combined Search Input - Barcode & Product Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={(node) => {
              // Assign to searchRef (primary)
              if (searchRef) {
                searchRef.current = node;
              }
              // Also assign to barcodeInputRef (for F1 shortcut)
              if (barcodeInputRef) {
                barcodeInputRef.current = node;
              }
            }}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              // Always handle suggestion navigation first
              handleKeyDown(e);

              // Only handle Enter for barcode/SKU if no suggestions are shown
              if (e.key === 'Enter' && e.currentTarget.value.trim() && !showSuggestions) {
                const value = e.currentTarget.value.trim();
                // If looks like barcode/SKU (numbers or short code), try barcode search
                if (/^[A-Z0-9-_]{3,}$/i.test(value) || /^\d+$/.test(value)) {
                  onBarcodeSearch?.(value);
                  setSearchTerm('');
                }
                // For product names, suggestions will handle the selection
              }
            }}
            placeholder="Scan barcode, ketik SKU, atau cari nama produk..."
            className="w-full pl-10 pr-16 py-2.5 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {searchLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500 hidden sm:block">
              F1
            </div>
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {searchSuggestions.map((product, index) => (
                <div
                  key={product.id}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedSuggestionIndex
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    onAddToCart(product);
                    setShowSuggestions(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        SKU: {product.sku} | Stock: {product.stock_quantity || 0}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-blue-600 text-sm">
                        Rp {product.selling_price.toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.category?.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter - Dropdown */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <FunnelIcon className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filter Kategori</span>
          </div>
          {/* Dropdown Filter - Prominent */}
          <div className="relative mb-3">
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setSelectedCategory(null);
                } else {
                  setSelectedCategory(Number(value));
                }
              }}
              disabled={loading}
              className="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="">Semua Kategori</option>
              {loading ? (
                <option value="" disabled>⏳ Memuat kategori...</option>
              ) : categories.length > 0 ? (
                categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>⚠️ Belum ada kategori di database</option>
              )}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            {categories.length > 0 && !loading && (
              <span className="absolute right-10 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                {categories.length} kategori
              </span>
            )}
          </div>

          {/* Quick Filter - Popular Categories */}
          {popularCategories.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">⚡ Kategori Populer</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 -mx-4 px-4" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
                {/* Semua Kategori Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selectedCategory === null) {
                      setSelectedCategory(-1 as any);
                      setTimeout(() => setSelectedCategory(null), 50);
                    } else {
                      setSelectedCategory(null);
                    }
                  }}
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedCategory === null
                      ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-200 hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 pointer-events-none">
                    <Squares2X2Icon className="w-4 h-4" />
                    <span>Semua Kategori</span>
                  </div>
                </button>
                {/* Popular Categories */}
                {popularCategories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Force refresh dengan set ke value berbeda dulu
                      if (selectedCategory === category.id) {
                        setSelectedCategory(-1 as any);
                        setTimeout(() => setSelectedCategory(category.id), 50);
                      } else {
                        setSelectedCategory(category.id);
                      }
                    }}
                    disabled={loading}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-200 hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <span className="pointer-events-none">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Products Grid - Optimal Layout */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => onAddToCart(product)}
                className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md transform hover:scale-[1.02] hover:border-blue-300 group"
              >
                {/* Product Image - Smaller */}
                <div className="aspect-square rounded-md mb-2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-colors">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <ShoppingCartIcon className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  )}
                </div>

                {/* Product Info - Compact */}
                <div className="space-y-0.5">
                  <h3 className="font-medium text-sm line-clamp-2 text-gray-900 group-hover:text-blue-900 transition-colors leading-tight">
                    {product.name}
                  </h3>

                  <p className="text-sm font-bold text-blue-600">
                    Rp {product.selling_price.toLocaleString('id-ID')}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 truncate flex-1 mr-1">
                      {product.category?.name}
                    </span>
                    <div className={`px-1 py-0.5 rounded-full text-xs font-medium ${
                      (product.stock_quantity || 0) > 0
                        ? (product.stock_quantity || 0) <= (product.min_stock || 5)
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock_quantity || 0}
                    </div>
                  </div>

                  {/* Add to Cart Indicator - Smaller */}
                  <div className="mt-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-center space-x-1 text-xs font-medium text-blue-600">
                      <PlusIcon className="w-3 h-3" />
                      <span>Add</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Skeleton Loading for Load More */}
            {loadingMore && Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse"
                role="status"
                aria-label="Loading products..."
              >
                {/* Product Image Skeleton */}
                <div className="aspect-square rounded-md mb-2 bg-gray-200"></div>
                
                {/* Product Info Skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-5 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button - Show when not loading more (skeleton will handle loading state) */}
        {!loading && !loadingMore && selectedCategory && hasMore && filteredProducts.length > 0 && (
          <div className="flex justify-center mt-6 pb-4 px-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md active:scale-95"
            >
              <span>Muat Lebih Banyak</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto h-20 w-20 text-gray-300 mb-4">
              <Squares2X2Icon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedCategory ? '🔍 Tidak Ditemukan' : '📦 Belum Ada Produk'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || selectedCategory
                ? 'Coba ubah kata kunci atau filter kategori'
                : 'Belum ada produk yang tersedia untuk ditampilkan'
              }
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Reset Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
