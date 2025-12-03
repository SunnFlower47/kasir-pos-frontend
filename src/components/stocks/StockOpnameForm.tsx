import React, { useState, useEffect } from 'react';
import { Product, Outlet } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  // CheckIcon, // TODO: Implement check functionality
  XMarkIcon,
  // DocumentTextIcon // TODO: Implement document functionality
} from '@heroicons/react/24/outline';

interface StockOpnameItem {
  product_id: number;
  product: Product;
  system_stock: number;
  physical_stock: number;
  difference: number;
  notes?: string;
}

interface StockOpnameFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const StockOpnameForm: React.FC<StockOpnameFormProps> = ({ onSuccess, onCancel }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [opnameItems, setOpnameItems] = useState<StockOpnameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [productsResponse, outletsResponse] = await Promise.all([
        apiService.getProducts({ with_stock: true }),
        apiService.getOutlets()
      ]);

      if (productsResponse.success && productsResponse.data) {
        const productData = productsResponse.data.data || productsResponse.data;
        setProducts(Array.isArray(productData) ? productData : []);
      }

      if (outletsResponse.success && outletsResponse.data) {
        const outletData = outletsResponse.data.data || outletsResponse.data;
        setOutlets(Array.isArray(outletData) ? outletData : []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Gagal memuat data');
    }
  };

  const handleOutletChange = async (outletId: number) => {
    setSelectedOutlet(outletId);
    setOpnameItems([]);
    setSearchTerm('');

    // Fetch products with stock for selected outlet
    await fetchProductsForOutlet(outletId);
  };

  const fetchProductsForOutlet = async (outletId: number) => {
    try {
      setLoading(true);
      const response = await apiService.getProducts({
        with_stock: true,
        outlet_id: outletId
      });

      if (response.success && response.data) {
        const productData = response.data.data || response.data;
        const productsArray = Array.isArray(productData) ? productData : [];
        setProducts(productsArray);
      } else {
        console.warn('⚠️ StockOpname - Products API failed:', response?.message);
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ StockOpname - Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    if (!selectedOutlet) {
      toast.error('Pilih outlet terlebih dahulu');
      return;
    }

    if (opnameItems.find(item => item.product_id === product.id)) {
      toast.error('Produk sudah ditambahkan');
      return;
    }

    // Use stock_quantity from API response (per outlet)
    const systemStock = product.stock_quantity || 0;

    const newItem: StockOpnameItem = {
      product_id: product.id,
      product,
      system_stock: systemStock,
      physical_stock: systemStock,
      difference: 0,
      notes: ''
    };

    setOpnameItems(prev => [...prev, newItem]);
    setSearchTerm('');
  };

  const handlePhysicalStockChange = (productId: number, physicalStock: number) => {
    setOpnameItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        const difference = physicalStock - item.system_stock;
        return {
          ...item,
          physical_stock: physicalStock,
          difference
        };
      }
      return item;
    }));
  };

  const handleNotesChange = (productId: number, notes: string) => {
    setOpnameItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        return { ...item, notes };
      }
      return item;
    }));
  };

  const handleRemoveItem = (productId: number) => {
    setOpnameItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const handleSubmit = async () => {
    if (!selectedOutlet) {
      toast.error('Pilih outlet terlebih dahulu');
      return;
    }

    if (opnameItems.length === 0) {
      toast.error('Tambahkan minimal satu produk');
      return;
    }

    setSubmitting(true);
    try {
      const opnameData = {
        outlet_id: selectedOutlet,
        items: opnameItems.map(item => ({
          product_id: item.product_id,
          system_stock: item.system_stock,
          physical_stock: item.physical_stock,
          difference: item.difference,
          notes: item.notes || null
        }))
      };

      const response = await apiService.processStockOpname(opnameData);

      if (response.success) {
        toast.success('Stok opname berhasil diproses');
        onSuccess();
      } else {
        toast.error(response.message || 'Gagal memproses stok opname');
      }
    } catch (error: any) {
      console.error('Error processing stock opname:', error);
      const message = error.response?.data?.message || error.message || 'Gagal memproses stok opname';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDifference = opnameItems.reduce((sum, item) => sum + Math.abs(item.difference), 0);
  const hasDiscrepancies = opnameItems.some(item => item.difference !== 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Stok Opname</h2>
          <p className="text-sm text-gray-600">Lakukan penghitungan fisik stok produk</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={submitting || opnameItems.length === 0}
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Memproses...
              </div>
            ) : (
              'Proses Opname'
            )}
          </button>
        </div>
      </div>

      {/* Outlet Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pilih Outlet</h3>
        <select
          value={selectedOutlet || ''}
          onChange={(e) => handleOutletChange(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

      {selectedOutlet && (
        <>
          {/* Product Search */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Produk</h3>
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk berdasarkan nama atau SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {searchTerm && (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleAddProduct(product)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">Stok: {product.stock_quantity || 0}</div>
                        <div className="text-xs text-gray-500">{product.unit?.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    Tidak ada produk yang ditemukan
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opname Items */}
          {opnameItems.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Daftar Produk Opname</h3>
                <div className="text-sm text-gray-600">
                  Total Item: {opnameItems.length}
                  {hasDiscrepancies && (
                    <span className="ml-2 text-orange-600">
                      • Selisih: {totalDifference}
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Produk
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Stok Sistem
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Stok Fisik
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Selisih
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Catatan
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {opnameItems.map((item) => (
                      <tr key={item.product_id} className={item.difference !== 0 ? 'bg-orange-50' : ''}>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{item.product.name}</div>
                            <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-900">{item.system_stock}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.physical_stock}
                            onChange={(e) => handlePhysicalStockChange(item.product_id, Number(e.target.value))}
                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${
                            item.difference > 0 ? 'text-green-600' :
                            item.difference < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {item.difference > 0 ? '+' : ''}{item.difference}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Catatan..."
                            value={item.notes || ''}
                            onChange={(e) => handleNotesChange(item.product_id, e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.product_id)}
                            className="text-red-600 hover:text-red-900"
                            title="Hapus"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StockOpnameForm;
