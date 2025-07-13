import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  TrashIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
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

interface PurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchase?: any;
}

const PurchaseFormNew: React.FC<PurchaseFormProps> = ({ isOpen, onClose, onSuccess, purchase }) => {
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
    if (isOpen) {
      fetchSuppliers();
      fetchOutlets();
      fetchProducts();

      if (purchase) {
        // Load existing purchase data
        setFormData({
          supplier_id: purchase.supplier_id?.toString() || '',
          outlet_id: purchase.outlet_id?.toString() || '',
          purchase_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
          notes: purchase.notes || '',
          items: purchase.purchase_items?.map((item: any) => ({
            id: item.id?.toString(),
            product_id: item.product_id,
            product: item.product,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          })) || []
        });
      } else {
        // Reset form for create mode
        setFormData({
          supplier_id: '',
          outlet_id: '',
          purchase_date: new Date().toISOString().split('T')[0],
          notes: '',
          items: []
        });
      }
    }
  }, [isOpen, purchase]);

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

      if (purchase) {
        await apiService.updatePurchase(purchase.id, submitData);
        toast.success('Purchase order berhasil diupdate');
      } else {
        await apiService.createPurchase(submitData);
        toast.success('Purchase order berhasil dibuat');
      }

      onSuccess();
      onClose();

      // Reset form
      setFormData({
        supplier_id: '',
        outlet_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: []
      });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {purchase ? 'Edit Purchase Order' : 'Buat Purchase Order Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Basic Info */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-lg font-semibold text-blue-600">
                  {formatCurrency(calculateTotal())}
                </div>
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari dan Tambah Produk
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchProduct(e.target.value)}
                  onFocus={() => setShowProductSearch(true)}
                  placeholder="Ketik nama produk atau SKU..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>

              {/* Product Search Results */}
              {showProductSearch && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto mt-1">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.slice(0, 10).map(product => (
                      <div
                        key={product.id}
                        onClick={() => addProductToItems(product)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-blue-600">
                              {formatCurrency(product.purchase_price || 0)}
                            </div>
                            <div className="text-xs text-gray-500">{product.unit?.name}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-center">
                      {searchTerm ? 'Produk tidak ditemukan' : 'Ketik untuk mencari produk'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Daftar Produk ({formData.items.length} item)
              </h3>
            </div>

            <div className="flex-1 overflow-auto">
              {formData.items.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
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
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <ShoppingBagIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Belum ada produk yang dipilih</p>
                    <p className="text-sm">Gunakan pencarian di atas untuk menambah produk</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes and Actions */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Catatan tambahan untuk purchase order ini..."
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-gray-900">
                Total: {formatCurrency(calculateTotal())}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.items.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Menyimpan...' : (purchase ? 'Update Purchase' : 'Buat Purchase Order')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

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

export default PurchaseFormNew;
