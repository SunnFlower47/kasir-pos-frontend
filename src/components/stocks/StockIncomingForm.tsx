import React, { useState, useEffect } from 'react';
import { Product, Outlet, Supplier } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import ProductSearch from '../common/ProductSearch';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface StockIncomingItem {
  product: Product | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
}

interface StockIncomingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StockIncomingForm: React.FC<StockIncomingFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    supplier_id: '',
    outlet_id: '',
    reference_number: '',
    notes: '',
    items: [] as StockIncomingItem[]
  });

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      // Generate reference number
      setFormData(prev => ({
        ...prev,
        reference_number: 'SI' + Date.now()
      }));
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      const [outletsRes, suppliersRes] = await Promise.all([
        apiService.get('/outlets'),
        apiService.get('/suppliers')
      ]);

      if (outletsRes.success && outletsRes.data) {
        // Handle paginated response
        const outletsData = outletsRes.data.data || outletsRes.data;
        setOutlets(Array.isArray(outletsData) ? outletsData : []);
      }

      if (suppliersRes.success && suppliersRes.data) {
        const suppliersData = suppliersRes.data.data || suppliersRes.data;
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Gagal memuat data');
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: null,
        quantity: 1,
        unit_cost: 0,
        total_cost: 0,
        notes: ''
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof StockIncomingItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index] };

      if (field === 'product') {
        item.product = value;
        item.unit_cost = value?.purchase_price || 0;
      } else {
        (item as any)[field] = value;
      }

      // Calculate total cost
      if (field === 'quantity' || field === 'unit_cost') {
        item.total_cost = item.quantity * item.unit_cost;
      }

      newItems[index] = item;

      return {
        ...prev,
        items: newItems
      };
    });
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + item.total_cost, 0);
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

    // Validate items
    for (const item of formData.items) {
      if (!item.product || item.quantity <= 0 || item.unit_cost < 0) {
        toast.error('Semua item harus valid');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await apiService.post('/stocks/incoming', {
        supplier_id: parseInt(formData.supplier_id),
        outlet_id: parseInt(formData.outlet_id),
        reference_number: formData.reference_number,
        notes: formData.notes,
        items: formData.items.map(item => ({
          product_id: item.product?.id || 0,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          notes: item.notes
        }))
      });

      if (response.success) {
        toast.success('Stok masuk berhasil diproses');
        onSuccess();
        onClose();
        resetForm();
      } else {
        toast.error(response.message || 'Gagal memproses stok masuk');
      }
    } catch (error: any) {
      console.error('Error processing stock incoming:', error);
      const message = error.response?.data?.message || error.message || 'Gagal memproses stok masuk';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      outlet_id: '',
      reference_number: '',
      notes: '',
      items: []
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <TruckIcon className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Stok Masuk</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  Outlet Tujuan *
                </label>
                <select
                  value={formData.outlet_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, outlet_id: e.target.value }))}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Referensi
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="SI123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Item Stok Masuk</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Tambah Item
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Belum ada item. Klik "Tambah Item" untuk menambah.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Produk *
                          </label>
                          <ProductSearch
                            value={item.product}
                            onChange={(product) => updateItem(index, 'product', product)}
                            placeholder="Cari produk..."
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Harga Satuan
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.unit_cost}
                            onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <input
                            type="text"
                            value={`Rp ${item.total_cost.toLocaleString('id-ID')}`}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Catatan Item
                        </label>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateItem(index, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Catatan untuk item ini..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            {formData.items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">
                    Total: {formData.items.length} item(s)
                  </span>
                  <span className="text-xl font-bold text-primary-600">
                    Rp {getTotalAmount().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || formData.items.length === 0}
              >
                {loading ? 'Memproses...' : 'Proses Stok Masuk'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockIncomingForm;
