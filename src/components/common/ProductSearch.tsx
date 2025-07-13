import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { apiService } from '../../services/api';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface ProductSearchProps {
  value?: Product | null;
  onChange: (product: Product | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  value,
  onChange,
  placeholder = "Cari produk...",
  className = "",
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchTerm.length < 2) {
      setProducts([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search term when value changes
  useEffect(() => {
    if (value) {
      setSearchTerm(value.name);
    } else {
      setSearchTerm('');
    }
  }, [value]);

  const searchProducts = async (query: string) => {
    setLoading(true);
    try {
      const response = await apiService.getProducts({
        search: query,
        per_page: 20, // Limit results for performance
        is_active: true
      });

      if (response.success && response.data) {
        const productsData = response.data.data || response.data;
        const productsArray = Array.isArray(productsData) ? productsData : [];
        setProducts(productsArray);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setSelectedIndex(-1);

    if (!newValue) {
      onChange(null);
      setProducts([]);
      setIsOpen(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSearchTerm(product.name);
    onChange(product);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange(null);
    setProducts([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || products.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < products.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : products.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < products.length) {
          handleProductSelect(products[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-800">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (products.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          autoComplete="off"
        />

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Clear button */}
        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}

        {/* Dropdown arrow */}
        {!searchTerm && !loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && products.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {products.map((product, index) => (
            <div
              key={product.id}
              onClick={() => handleProductSelect(product)}
              className={`
                px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0
                ${index === selectedIndex ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {highlightMatch(product.name, searchTerm)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    SKU: {highlightMatch(product.sku, searchTerm)}
                  </div>
                  {product.category && (
                    <div className="text-xs text-gray-400 mt-1">
                      {product.category.name}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    Rp {product.selling_price?.toLocaleString('id-ID') || '0'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Stok: {(product as any).stock_quantity || 0}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Show more indicator */}
          {products.length === 20 && (
            <div className="px-4 py-2 text-center text-sm text-gray-500 bg-gray-50">
              Ketik lebih spesifik untuk hasil yang lebih akurat
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {isOpen && searchTerm.length >= 2 && products.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-center text-gray-500">
            Tidak ada produk ditemukan untuk "{searchTerm}"
          </div>
        </div>
      )}

      {/* Search hint */}
      {isOpen && searchTerm.length < 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-center text-gray-500">
            Ketik minimal 2 karakter untuk mencari produk
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
