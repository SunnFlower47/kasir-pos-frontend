import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  TrashIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  sku: string;
  purchase_price: number;
  unit: {
    name: string;
  };
}

interface Supplier {
  id: number;
  name: string;
}

interface Outlet {
  id: number;
  name: string;
}

interface PurchaseItem {
  id?: string;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PurchaseFormData {
  supplier_id: string;
  outlet_id: string;
  purchase_date: string;
  notes: string;
  items: PurchaseItem[];
}

const CreatePurchase: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplier_id: '',
    outlet_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSuppliers();
    fetchOutlets();
    fetchProducts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await apiService.get('/suppliers');
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchOutlets = async () => {
    try {
      const response = await apiService.get('/outlets');
      setOutlets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiService.get('/products');
      const productsData = response.data.data || [];
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSearchProduct = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(term.toLowerCase()) ||
        product.sku.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const addProductToItems = (product: Product) => {
    const existingItemIndex = formData.items.findIndex(item => item.product_id === product.id);

    if (existingItemIndex >= 0) {
      // If product already exists, increase quantity
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unit_price;

      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    } else {
      // Add new item
      const newItem: PurchaseItem = {
        id: Date.now().toString(),
        product_id: product.id,
        product: product,
        quantity: 1,
        unit_price: product.purchase_price || 0,
        total_price: product.purchase_price || 0
      };

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }

    setSearchTerm('');
    setShowProductSearch(false);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;

    const updatedItems = [...formData.items];
    updatedItems[index].quantity = quantity;
    updatedItems[index].total_price = quantity * updatedItems[index].unit_price;

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const updateItemPrice = (index: number, price: number) => {
    if (price < 0) return;

    const updatedItems = [...formData.items];
    updatedItems[index].unit_price = price;
    updatedItems[index].total_price = updatedItems[index].quantity * price;

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id || !formData.outlet_id) {
      toast.error('Supplier dan outlet harus dipilih');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Minimal harus ada 1 item');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        supplier_id: parseInt(formData.supplier_id),
        outlet_id: parseInt(formData.outlet_id),
        purchase_date: formData.purchase_date,
        notes: formData.notes,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      await apiService.createPurchase(submitData);
      toast.success('Purchase order berhasil dibuat');
      navigate('/purchases');
    } catch (error: any) {
      console.error('Error creating purchase:', error);
      toast.error(error.response?.data?.message || 'Gagal membuat purchase order');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/purchases')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Kembali</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Buat Purchase Order Baru
                </h1>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(calculateTotal())}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Basic Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet *
                </label>
                <select
                  value={formData.outlet_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, outlet_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Outlet</option>
                  {outlets.map(outlet => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Pembelian *
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Search Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Cari dan Tambah Produk</h2>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchProduct(e.target.value)}
                onFocus={() => setShowProductSearch(true)}
                placeholder="Ketik nama produk atau SKU untuk mencari..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />

              {/* Product Search Results */}
              {showProductSearch && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto mt-1">
                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
                      {filteredProducts.slice(0, 12).map(product => (
                        <div
                          key={product.id}
                          onClick={() => addProductToItems(product)}
                          className="p-3 hover:bg-blue-50 cursor-pointer border border-gray-100 rounded-lg hover:border-blue-200 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500 mt-1">SKU: {product.sku}</div>
                              <div className="text-xs text-gray-500">{product.unit?.name}</div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-sm font-medium text-blue-600">
                                {formatCurrency(product.purchase_price || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-gray-500 text-center">
                      {searchTerm ? 'Produk tidak ditemukan' : 'Ketik untuk mencari produk'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Daftar Produk ({formData.items.length} item)
              </h2>
              {formData.items.length > 0 && (
                <div className="text-lg font-semibold text-blue-600">
                  Subtotal: {formatCurrency(calculateTotal())}
                </div>
              )}
            </div>

            {formData.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produk
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Harga Satuan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{item.product?.name}</div>
                            <div className="text-sm text-gray-500">SKU: {item.product?.sku}</div>
                            <div className="text-sm text-gray-500">{item.product?.unit?.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(item.total_price)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBagIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl text-gray-500 mb-2">Belum ada produk yang dipilih</p>
                <p className="text-gray-400">Gunakan pencarian di atas untuk menambah produk</p>
              </div>
            )}
          </div>
        </div>

        {/* Notes and Submit Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Catatan tambahan untuk purchase order ini..."
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">Total Pembelian</div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(calculateTotal())}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/purchases')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.items.length === 0}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Menyimpan...' : 'Buat Purchase Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Click outside to close search */}
      {showProductSearch && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowProductSearch(false)}
        />
      )}
    </div>
  );
};

export default CreatePurchase;
