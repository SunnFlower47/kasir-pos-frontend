import React, { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { Product, Category, Unit } from '../../types';
import toast from 'react-hot-toast';
import { invalidateProductCache, invalidateStockCache } from '../../utils/cacheInvalidation';

// Form-specific type with optional id
interface ProductFormData {
  id?: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category_id: number;
  unit_id: number;
  purchase_price: number | string; // Allow string for empty state
  selling_price: number | string; // Allow string for empty state
  wholesale_price: number | string; // Allow string for empty state
  min_stock: number | string; // Allow string for empty state
  image?: string;
  is_active: boolean;
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, onSuccess, product }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category_id: 0,
    unit_id: 0,
    purchase_price: 0,
    selling_price: 0,
    wholesale_price: 0,
    min_stock: 0,
    image: undefined,
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchUnits();

      if (product) {
        setFormData({
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          description: product.description,
          category_id: product.category_id || 0,
          unit_id: product.unit_id || 0,
          purchase_price: product.purchase_price,
          selling_price: product.selling_price,
          wholesale_price: product.wholesale_price,
          min_stock: product.min_stock,
          image: product.image || undefined, // Convert null to undefined
          is_active: product.is_active
        });
        if (product.image) {
          setImagePreview(product.image);
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await apiService.getUnits();
      if (response.success && response.data) {
        setUnits(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      category_id: 0,
      unit_id: 0,
      purchase_price: 0,
      selling_price: 0,
      wholesale_price: 0,
      min_stock: 0,
      image: undefined,
      is_active: true
    });
    setImagePreview(null);
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked
              : type === 'number' ? (value === '' ? '' : parseFloat(value) || 0)
              : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Convert empty string to 0 on blur
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        [name]: 0
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImagePreview(base64);
        setFormData(prev => ({ ...prev, image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.unit_id) {
      newErrors.unit_id = 'Unit is required';
    }

    const purchasePrice = typeof formData.purchase_price === 'string' ? 0 : formData.purchase_price;
    const sellingPrice = typeof formData.selling_price === 'string' ? 0 : formData.selling_price;
    const minStock = typeof formData.min_stock === 'string' ? 0 : formData.min_stock;

    if (purchasePrice < 0) {
      newErrors.purchase_price = 'Purchase price must be at least 0';
    }

    if (sellingPrice < 0) {
      newErrors.selling_price = 'Selling price must be at least 0';
    }

    if (minStock < 0) {
      newErrors.min_stock = 'Minimum stock must be at least 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);

    try {
      // Ensure all number fields are proper numbers (not empty strings)
      // For update: preserve existing values if field is empty string
      // For create: use 0 if empty
      const isUpdate = !!product?.id;
      
      // Helper to safely convert number fields
      const toNumber = (value: number | string, existing: number = 0): number => {
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'string' && value.trim() === '') {
          return isUpdate ? existing : 0;
        }
        const parsed = parseFloat(value as string);
        return isNaN(parsed) ? (isUpdate ? existing : 0) : parsed;
      };

      const submitData = {
        ...formData,
        min_stock: toNumber(formData.min_stock, product?.min_stock ?? 0),
        purchase_price: toNumber(formData.purchase_price, product?.purchase_price ?? 0),
        selling_price: toNumber(formData.selling_price, product?.selling_price ?? 0),
        wholesale_price: toNumber(formData.wholesale_price, product?.wholesale_price ?? 0),
        sku: formData.sku || undefined, // Send undefined if empty to let backend generate
      };

      let response;
      if (product?.id) {
        response = await apiService.updateProduct(product.id, submitData);
      } else {
        response = await apiService.createProduct(submitData);
      }

      if (response.success) {
        toast.success(product?.id ? 'Product updated successfully' : 'Product created successfully');
        // Invalidate cache before calling onSuccess
        invalidateProductCache();
        invalidateStockCache(); // Stock is related to products
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to save product');
      }
    } catch (error: any) {
      console.error('❌ Product form error:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Failed to save product';

      // Handle validation errors
      if (status === 422 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const newErrors: Record<string, string> = {};

        Object.keys(validationErrors).forEach(key => {
          newErrors[key] = validationErrors[key][0]; // Get first error message
        });

        setErrors(newErrors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: 'calc(100vh - 6rem)' }}
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {product?.id ? 'Edit Product' : 'Tambah Produk Baru'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
              type="button"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
            <form id="product-form" onSubmit={handleSubmit}>
              <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Image Upload */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image (Gambar Produk)
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, image: '', delete_image: true })); // Mark for deletion
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    title="Hapus gambar"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-block"
                >
                  Pilih Gambar
                </label>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <InformationCircleIcon className="w-3 h-3" />
                  Upload gambar produk (maks 2MB, format JPG/PNG). Gambar akan ditampilkan di kasir dan laporan
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">Informasi Dasar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Contoh: terigu segitiga biru"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <InformationCircleIcon className="w-3 h-3" />
                Nama produk yang akan ditampilkan di kasir dan laporan
              </p>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sku ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Contoh: PROD-001 (kosongkan untuk auto-generate)"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <InformationCircleIcon className="w-3 h-3" />
                Kode unik produk (Stock Keeping Unit), akan dibuat otomatis jika kosong
              </p>
              {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
            </div>
            </div>
          </div>

          {/* Category & Classification */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">Kategori & Klasifikasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barcode
              </label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.barcode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Contoh: 1234567890123"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <InformationCircleIcon className="w-3 h-3" />
                Kode barcode untuk scanning di kasir (EAN-13, UPC, atau kode custom)
              </p>
              {errors.barcode && <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value={0}>Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <InformationCircleIcon className="w-3 h-3" />
                Kategori produk untuk pengelompokan dan laporan
              </p>
              {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                name="unit_id"
                value={formData.unit_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.unit_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value={0}>Select Unit</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <InformationCircleIcon className="w-3 h-3" />
                Satuan pengukuran produk (kg, liter, pcs, dll)
              </p>
              {errors.unit_id && <p className="text-red-500 text-xs mt-1">{errors.unit_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock *
              </label>
              <input
                type="number"
                name="min_stock"
                value={formData.min_stock === 0 ? '' : formData.min_stock}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.min_stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <InformationCircleIcon className="w-3 h-3" />
                Batas minimum stok, sistem akan memberikan peringatan jika stok di bawah nilai ini
              </p>
              {errors.min_stock && <p className="text-red-500 text-xs mt-1">{errors.min_stock}</p>}
            </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">Harga & Stok</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price (Harga Beli) *
              </label>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price === 0 ? '' : formData.purchase_price}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.purchase_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <InformationCircleIcon className="w-3 h-3" />
                Harga beli produk dari supplier, digunakan untuk menghitung profit
              </p>
              {errors.purchase_price && <p className="text-red-500 text-xs mt-1">{errors.purchase_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price (Harga Jual) *
              </label>
              <input
                type="number"
                name="selling_price"
                value={formData.selling_price === 0 ? '' : formData.selling_price}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.selling_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <InformationCircleIcon className="w-3 h-3" />
                Harga jual ke customer di kasir (POS)
              </p>
              {errors.selling_price && <p className="text-red-500 text-xs mt-1">{errors.selling_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wholesale Price (Harga Grosir)
              </label>
              <input
                type="number"
                name="wholesale_price"
                value={formData.wholesale_price === 0 ? '' : formData.wholesale_price}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <InformationCircleIcon className="w-3 h-3" />
                Harga jual untuk pembelian dalam jumlah besar (opsional)
              </p>
            </div>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">Deskripsi & Status</h3>
            <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Deskripsi)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan deskripsi produk, spesifikasi, atau informasi tambahan"
            />
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <InformationCircleIcon className="w-3 h-3" />
              Informasi detail produk (spesifikasi, bahan, ukuran, dll)
            </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Active Product (Produk Aktif)
                </label>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <InformationCircleIcon className="w-3 h-3" />
                  Centang untuk mengaktifkan produk. Produk non-aktif tidak akan muncul di kasir
                </p>
              </div>
            </div>
          </div>
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end space-x-3 p-4 sm:p-5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors shadow-sm"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {product?.id ? 'Update Produk' : 'Simpan Produk'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
